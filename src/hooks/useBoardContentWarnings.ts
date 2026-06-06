import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { getContentGameMode, isPublicRoom } from '@/helpers/strings';
import buildGameBoard from '@/services/buildGame';
import { Settings } from '@/types/Settings';

export interface BoardContentWarnings {
  /** Selected groups that have no available tiles for the current locale/mode. */
  missingGroups: string[];
  /** Fewer than half the playable slots resolved to real content. */
  lowContent: boolean;
}

const EMPTY: BoardContentWarnings = { missingGroups: [], lowContent: false };
const DEBOUNCE_MS = 300;

/**
 * Surfaces authoring-time board health (missing groups, sparse content) by
 * running the existing side-effect-free board builder against the current
 * settings. Unlike useGameBoard it never persists — it only reads metadata.
 */
export default function useBoardContentWarnings(formData: Settings): BoardContentWarnings {
  const { i18n } = useTranslation();
  const [warnings, setWarnings] = useState<BoardContentWarnings>(EMPTY);

  const { roomTileCount, finishRange, room, gameMode, role, selectedActions } = formData;

  useEffect(() => {
    // Mirror useGameBoard's loading guard: nothing to evaluate yet. Reset
    // asynchronously to avoid a synchronous setState inside the effect body.
    if (!finishRange) {
      const reset = setTimeout(() => setWarnings(EMPTY), 0);
      return () => clearTimeout(reset);
    }

    let cancelled = false;
    const handle = setTimeout(async () => {
      const isPublic = isPublicRoom(room || '');
      const finalGameMode = getContentGameMode(isPublic ? 'online' : gameMode);
      const locale = i18n.resolvedLanguage || 'en';
      const tileCount = isPublic ? 40 : roomTileCount || 40;

      try {
        const { metadata } = await buildGameBoard(formData, locale, finalGameMode, tileCount);
        if (cancelled) return;
        setWarnings({
          missingGroups: metadata.missingGroups,
          lowContent: metadata.tilesWithContent < tileCount / 2,
        });
      } catch {
        if (!cancelled) setWarnings(EMPTY);
      }
    }, DEBOUNCE_MS);

    return () => {
      cancelled = true;
      clearTimeout(handle);
    };
    // eslint-disable-next-line @eslint-react/exhaustive-deps -- pin the content-driving fields; formData object ref changes each render
  }, [roomTileCount, finishRange, room, gameMode, role, selectedActions, i18n.resolvedLanguage]);

  return warnings;
}
