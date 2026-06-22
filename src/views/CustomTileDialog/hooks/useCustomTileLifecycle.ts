import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { CustomTile, CustomTilePull, SharedFilters, SubmitMessage } from '@/types/customTiles';
import { CustomGroupPull } from '@/types/customGroups';
import { addCustomTile, updateCustomTile } from '@/stores/customTiles';
import { submitCustomAction } from '@/services/firebase';
import { normalizePlaceholders, localizePlaceholders } from '@/services/placeholderAliasService';
import { useEditorGroupsReactive } from '@/hooks/useGroupFiltering';
import { useGameSettings } from '@/stores/settingsStore';
import { validateCustomTileWithGroups } from '@/services/validationService';
import { submitCustomTileCore } from './submitCustomTileCore';

export interface TileDraft {
  action: string;
  tags: string[];
}

export interface EditTarget {
  tileId: number | null;
  editTileData?: Partial<CustomTilePull>;
}

export interface CustomTileLifecycle {
  // Cross-sibling filter state (single owner).
  sharedFilters: SharedFilters;
  setSharedFilters: (filters: SharedFilters) => void;

  // Edit-target coordination.
  editTarget: EditTarget;
  beginEdit: (id: number, tileData?: Partial<CustomTilePull>) => void;
  clearEdit: () => void;

  // ViewCustomTiles refresh coordination.
  refreshTrigger: number;
  triggerRefresh: () => void;

  // Editor draft (action + committed tags) and the pending tag input.
  draft: TileDraft;
  setDraftAction: (action: string) => void;
  setDraftTags: (tags: string[]) => void;
  addDraftTag: (tag: string) => void;
  tagInputValue: string;
  setTagInputValue: (value: string) => void;

  // Debounced validation feedback for the editor.
  validationMessage: string;

  // Editor groups for the current gameMode/locale + the selected group.
  groups: (CustomGroupPull & { hasNoTiles: boolean; isAvailableForSetup: boolean })[];
  selectedGroup?: CustomGroupPull & { hasNoTiles: boolean; isAvailableForSetup: boolean };
  groupsRefreshTrigger: number;
  bumpGroupsRefresh: () => void;

  // Submit action (owns normalization, validation, persistence).
  submitTile: () => Promise<void>;
}

interface LifecycleArgs {
  customTiles: CustomTile[];
  setSubmitMessage: (message: SubmitMessage) => void;
  /** Called after a successful add/update so the board re-renders. */
  boardUpdated: () => void;
}

/**
 * Owns the custom-tile editor lifecycle that used to be threaded through the
 * dialog as a manual state bus: shared filters, edit target, refresh trigger,
 * the editor draft, debounced validation, and the submit action.
 *
 * Hook-as-DI: it fetches its own deps (settings, editor groups, i18n) and
 * exposes a stable surface. Called ONCE in CustomTileDialog and sliced down to
 * the siblings — calling it twice would fork the shared state and desync the
 * two columns.
 */
export function useCustomTileLifecycle({
  customTiles,
  setSubmitMessage,
  boardUpdated,
}: LifecycleArgs): CustomTileLifecycle {
  const { t } = useTranslation();
  const { settings } = useGameSettings();
  const locale = settings.locale || 'en';

  const [sharedFilters, setSharedFilters] = useState<SharedFilters>({
    gameMode: 'online',
    groupName: '',
    intensity: '',
  });

  const [editTarget, setEditTarget] = useState<EditTarget>({
    tileId: null,
    editTileData: undefined,
  });

  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const triggerRefresh = useCallback(() => setRefreshTrigger((prev) => prev + 1), []);

  const [draft, setDraft] = useState<TileDraft>({ action: '', tags: [t('custom')] });
  const [tagInputValue, setTagInputValue] = useState('');
  const [validationMessage, setValidationMessage] = useState('');
  const [groupsRefreshTrigger, setGroupsRefreshTrigger] = useState(0);
  const bumpGroupsRefresh = useCallback(() => setGroupsRefreshTrigger((prev) => prev + 1), []);

  const { groups } = useEditorGroupsReactive(sharedFilters.gameMode, locale);

  const selectedGroup = useMemo(
    () => groups.find((group) => group.name === sharedFilters.groupName),
    [groups, sharedFilters.groupName]
  );

  const setDraftAction = useCallback(
    (action: string) => setDraft((prev) => ({ ...prev, action })),
    []
  );
  const setDraftTags = useCallback((tags: string[]) => setDraft((prev) => ({ ...prev, tags })), []);
  const addDraftTag = useCallback(
    (tag: string) => setDraft((prev) => ({ ...prev, tags: [...prev.tags, tag] })),
    []
  );

  const beginEdit = useCallback((id: number, tileData?: Partial<CustomTilePull>) => {
    setEditTarget({ tileId: id, editTileData: tileData });
  }, []);

  const clearEdit = useCallback(() => {
    setEditTarget({ tileId: null, editTileData: undefined });
    setDraft({ action: '', tags: [t('custom')] });
    setTagInputValue('');
    setValidationMessage('');
    // Filters intentionally preserved — user's gameMode/group/intensity stay.
  }, [t]);

  // Auto-select first group for new tiles when none is selected.
  useEffect(() => {
    if (!editTarget.tileId && groups.length > 0 && !sharedFilters.groupName) {
      const firstGroup = groups[0];
      setSharedFilters({
        ...sharedFilters,
        groupName: firstGroup.name,
        intensity: '',
      });
    }
  }, [editTarget.tileId, groups, sharedFilters]);

  // Populate the editor when an edit target is set.
  useEffect(() => {
    if (!editTarget.tileId) return;

    const editTile =
      editTarget.editTileData ||
      (Array.isArray(customTiles) ? customTiles.find(({ id }) => id === editTarget.tileId) : null);

    if (!editTile) return;

    const tileGroup = groups.find((group) => group.id === editTile.group_id);
    const newGroupName = tileGroup?.name || '';
    const newIntensity = editTile.intensity ? editTile.intensity.toString() : '';

    // Loop guard: only update filters when something actually changed.
    if (sharedFilters.groupName !== newGroupName || sharedFilters.intensity !== newIntensity) {
      setSharedFilters({
        ...sharedFilters,
        groupName: newGroupName,
        intensity: newIntensity,
      });
    }

    setDraft({
      action: localizePlaceholders(editTile.action || '', locale),
      tags: editTile.tags || [t('custom')],
    });
    // sharedFilters intentionally omitted from deps: the guard above reads the
    // latest value via closure and including it would re-fire on every filter
    // change, reintroducing the loops the guard exists to prevent.
    // eslint-disable-next-line @eslint-react/exhaustive-deps
  }, [editTarget.tileId, editTarget.editTileData, customTiles, groups, t, locale]);

  // Debounced validation feedback.
  useEffect(() => {
    const validateForm = async () => {
      if (!selectedGroup || !sharedFilters.intensity || !draft.action) {
        setValidationMessage('');
        return;
      }

      try {
        const validation = await validateCustomTileWithGroups(
          {
            group_id: selectedGroup.id,
            intensity: Number(sharedFilters.intensity),
            action: draft.action,
            tags: draft.tags,
            isCustom: 1,
          },
          locale,
          sharedFilters.gameMode
        );

        setValidationMessage(validation.isValid ? '' : validation.errors.join(', '));
      } catch {
        setValidationMessage('');
      }
    };

    // 300ms keeps feedback responsive without over-calling validation.
    const timeoutId = setTimeout(validateForm, 300);
    return () => clearTimeout(timeoutId);
  }, [
    selectedGroup,
    sharedFilters.intensity,
    sharedFilters.gameMode,
    draft.action,
    draft.tags,
    locale,
  ]);

  const tileExists = useCallback(
    (groupId: string, intensity: string | number, action: string): boolean => {
      const tilesArray = Array.isArray(customTiles) ? customTiles : [];
      return tilesArray.some(
        (tile) =>
          tile.group_id === groupId &&
          tile.intensity === Number(intensity) &&
          tile.action === action
      );
    },
    [customTiles]
  );

  const submitTile = useCallback(async (): Promise<void> => {
    // Normalize localized placeholder tokens to canonical English before dedup,
    // validation, Firebase submission, and storage.
    const action = normalizePlaceholders(draft.action, locale);

    const decision = submitCustomTileCore(
      {
        gameMode: sharedFilters.gameMode,
        selectedGroupId: selectedGroup?.id,
        intensity: sharedFilters.intensity,
        action,
        tags: draft.tags,
        pendingTag: tagInputValue,
        validationMessage,
        updateTileId: editTarget.tileId,
        tileExists,
      },
      {
        allFieldsRequired: t('allFieldsRequired', 'All fields are required'),
        actionExists: t('actionExists'),
      }
    );

    if (decision.kind === 'error') {
      setSubmitMessage(decision.message);
      return;
    }

    // The pending tag has been folded into the committed list — clear the input.
    setTagInputValue('');

    try {
      const validation = await validateCustomTileWithGroups(
        decision.data,
        locale,
        sharedFilters.gameMode
      );

      if (!validation.isValid) {
        setSubmitMessage({ message: validation.errors.join(', '), type: 'error' });
        return;
      }

      if (!decision.isUpdate) {
        const groupLabel = `${selectedGroup?.name} - Level ${sharedFilters.intensity}`;
        submitCustomAction(groupLabel, action);
        await addCustomTile(decision.data);
      } else {
        await updateCustomTile(editTarget.tileId as number, decision.data);
      }

      boardUpdated();
      triggerRefresh();

      setDraft({ action: '', tags: [t('custom')] });
      setEditTarget({ tileId: null, editTileData: undefined });

      setSubmitMessage({
        message: decision.isUpdate ? t('customUpdated') : t('customAdded'),
        type: 'success',
      });
    } catch (error) {
      console.error('Error saving custom tile:', error);
      setSubmitMessage({ message: t('errorSavingTile'), type: 'error' });
    }
  }, [
    draft.action,
    draft.tags,
    locale,
    sharedFilters.gameMode,
    sharedFilters.intensity,
    selectedGroup,
    tagInputValue,
    validationMessage,
    editTarget.tileId,
    tileExists,
    customTiles,
    boardUpdated,
    triggerRefresh,
    setSubmitMessage,
    t,
  ]);

  return {
    sharedFilters,
    setSharedFilters,
    editTarget,
    beginEdit,
    clearEdit,
    refreshTrigger,
    triggerRefresh,
    draft,
    setDraftAction,
    setDraftTags,
    addDraftTag,
    tagInputValue,
    setTagInputValue,
    validationMessage,
    groups,
    selectedGroup,
    groupsRefreshTrigger,
    bumpGroupsRefresh,
    submitTile,
  };
}
