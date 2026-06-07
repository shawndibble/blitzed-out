import { useCallback, useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { getPack } from '@/services/contentPacks';
import type { ContentPackDoc } from '@/types/contentPacks';

interface UrlPackImportResult {
  pendingPack: ContentPackDoc | null;
  isLoading: boolean;
  failed: boolean;
  dismiss: () => void;
}

/**
 * Reads `?importPack=<id>` from the URL and fetches the pack so a preview dialog
 * can confirm the import (mirrors useUrlImport, but pack imports are previewed +
 * confirmed rather than applied silently). The query param is cleared once read.
 */
export default function useUrlPackImport(): UrlPackImportResult {
  const [queryParams, setParams] = useSearchParams();
  const importPackId = queryParams.get('importPack');
  const [pendingPack, setPendingPack] = useState<ContentPackDoc | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [failed, setFailed] = useState(false);

  const dismiss = useCallback(() => {
    setPendingPack(null);
    setFailed(false);
  }, []);

  useEffect(() => {
    if (!importPackId) return;

    let cancelled = false;
    setIsLoading(true);
    setFailed(false);
    getPack(importPackId)
      .then((pack) => {
        if (cancelled) return;
        if (pack) setPendingPack(pack);
        else setFailed(true);
      })
      .finally(() => {
        if (cancelled) return;
        setIsLoading(false);
        // Clear the param only after the fetch settles — clearing it earlier
        // changes importPackId, which would cancel this effect's own request.
        setParams(
          (prev) => {
            const next = new URLSearchParams(prev);
            next.delete('importPack');
            return next;
          },
          { replace: true }
        );
      });

    return () => {
      cancelled = true;
    };
    // Only react to a change in the incoming pack id.
    // eslint-disable-next-line @eslint-react/exhaustive-deps
  }, [importPackId]);

  return { pendingPack, isLoading, failed, dismiss };
}
