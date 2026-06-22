import {
  AllGameModeActions,
  CustomTile,
  CustomTileDialogProps,
  CustomTilePull,
  SubmitMessage,
} from '@/types/customTiles';
import { Box, Dialog, DialogContent, DialogTitle, Divider, Grid, IconButton } from '@mui/material';
import { Trans, useTranslation } from 'react-i18next';
import { getTiles, importCustomTiles } from '@/stores/customTiles';
import { useCallback, useEffect, useMemo, useState } from 'react';

import AddCustomTile from './AddCustomTile';
import { Close } from '@mui/icons-material';
import CustomTileHelp from './CustomTileHelp';
import ImportExport from '@/views/CustomTileDialog/ImportExport';
import PackDirectory from './PackDirectory';
import Packs from './Packs';
import ToastAlert from '@/components/ToastAlert';
import ViewCustomTiles from './ViewCustomTiles';
import { importActions } from '@/services/dexieActionImport';
import useBreakpoint from '@/hooks/useBreakpoint';
import { useCustomTileLifecycle } from './hooks/useCustomTileLifecycle';
import { useLiveQuery } from 'dexie-react-hooks';

export default function CustomTileDialog({
  boardUpdated,
  setOpen,
  open = false,
}: CustomTileDialogProps) {
  const { t, i18n } = useTranslation();
  const isMobile = useBreakpoint();
  const isSmallScreen = useBreakpoint('md');
  const [submitMessage, setSubmitMessage] = useState<SubmitMessage>({
    message: '',
    type: 'info',
  });
  const [expanded, setExpanded] = useState<string>('ctAdd');
  const [allGameModeActions, setAllGameModeActions] = useState<AllGameModeActions>({
    online: {},
    local: {},
    solo: {},
  });
  const [isLoadingActions, setIsLoadingActions] = useState<boolean>(true);

  const handleChange = (panel: string) => (_event: React.SyntheticEvent, newExpanded: boolean) => {
    setExpanded(newExpanded ? panel : '');
  };

  // Load actions for both game modes
  useEffect(() => {
    async function loadAllGameModeActions() {
      setIsLoadingActions(true);
      try {
        const [onlineActions, localActions, soloActions] = await Promise.all([
          importActions(i18n.resolvedLanguage, 'online'),
          importActions(i18n.resolvedLanguage, 'local'),
          importActions(i18n.resolvedLanguage, 'solo'),
        ]);

        setAllGameModeActions({
          online: onlineActions,
          local: localActions,
          solo: soloActions,
        });
      } catch (error) {
        console.error('Error loading game mode actions:', error);
      } finally {
        setIsLoadingActions(false);
      }
    }

    loadAllGameModeActions();
  }, [i18n.resolvedLanguage]);

  const allTiles = useLiveQuery(() => getTiles({ locale: i18n.resolvedLanguage }));

  const tagList = useMemo(() => {
    if (!allTiles) return [];

    return Array.isArray(allTiles)
      ? allTiles
          .map(({ tags }) => tags)
          .flat()
          .filter((tag, index, self) => tag && self.indexOf(tag) === index)
          .sort()
      : [];
  }, [allTiles]);

  const lifecycle = useCustomTileLifecycle({
    customTiles: (allTiles as CustomTilePull[]) ?? [],
    setSubmitMessage,
    boardUpdated,
  });
  const { triggerRefresh } = lifecycle;

  const bulkImport = useCallback(
    async (records: CustomTile[]) => {
      await importCustomTiles(records);
      boardUpdated();
      triggerRefresh();
    },
    [boardUpdated, triggerRefresh]
  );

  const handlePackImported = useCallback(
    (packName: string) => {
      boardUpdated();
      triggerRefresh();
      setSubmitMessage({ message: t('packs.importedToast', { name: packName }), type: 'success' });
    },
    [boardUpdated, triggerRefresh, t]
  );

  if (!allTiles || isLoadingActions) return null;

  // Render content based on screen size
  const renderContent = () => {
    const leftColumnContent = (
      <>
        <CustomTileHelp expanded={expanded} handleChange={handleChange} />

        <AddCustomTile
          lifecycle={lifecycle}
          expanded={expanded}
          handleChange={handleChange}
          tagList={tagList}
        />

        <ImportExport
          expanded={expanded}
          handleChange={handleChange}
          customTiles={allTiles as CustomTilePull[]}
          mappedGroups={allGameModeActions}
          setSubmitMessage={setSubmitMessage}
          bulkImport={bulkImport}
          onImportSuccess={triggerRefresh}
        />

        <Packs
          expanded={expanded}
          handleChange={handleChange}
          gameMode={lifecycle.sharedFilters.gameMode}
          onGameModeChange={(mode) =>
            lifecycle.setSharedFilters({ ...lifecycle.sharedFilters, gameMode: mode })
          }
          onImported={handlePackImported}
        />
      </>
    );

    // Expanding the Content Packs accordion swaps the right pane to the public
    // directory; any other panel shows the custom-tile editor.
    const rightColumnContent =
      expanded === 'ctPacks' ? (
        <Box>
          <PackDirectory
            gameMode={lifecycle.sharedFilters.gameMode}
            onGameModeChange={(mode) =>
              // Reset group/intensity so a stale group name from the previous
              // mode can't point at a group that doesn't exist in the new one.
              lifecycle.setSharedFilters({
                ...lifecycle.sharedFilters,
                gameMode: mode,
                groupName: '',
                intensity: '',
              })
            }
            onImported={handlePackImported}
          />
        </Box>
      ) : (
        <Box>
          <ViewCustomTiles
            tagList={tagList}
            boardUpdated={() => {
              boardUpdated();
              triggerRefresh();
            }}
            mappedGroups={allGameModeActions}
            updateTile={(id: number, tileData?: Partial<CustomTilePull>) => {
              lifecycle.beginEdit(id, tileData);
              setExpanded('ctAdd');
            }}
            refreshTrigger={lifecycle.refreshTrigger}
            sharedFilters={lifecycle.sharedFilters}
            setSharedFilters={lifecycle.setSharedFilters}
          />
        </Box>
      );

    if (!isSmallScreen) {
      return (
        <Grid container spacing={2}>
          <Grid size={{ xs: 12, md: 6 }}>{leftColumnContent}</Grid>
          <Grid size={{ xs: 12, md: 6 }}>{rightColumnContent}</Grid>
        </Grid>
      );
    } else {
      return (
        <>
          {leftColumnContent}
          {rightColumnContent && (
            <>
              <Divider sx={{ my: 2 }} />
              {rightColumnContent}
            </>
          )}
        </>
      );
    }
  };

  return (
    <>
      <Dialog
        fullScreen={isMobile}
        open={open}
        onClose={() => setOpen(false)}
        maxWidth={!isSmallScreen ? 'lg' : 'sm'}
        fullWidth={true}
        disableRestoreFocus
      >
        <DialogTitle>
          <Trans i18nKey="manageTiles" />
          <IconButton
            aria-label={t('close')}
            onClick={() => setOpen(false)}
            sx={{
              position: 'absolute',
              right: 8,
              top: 8,
              color: (theme) => theme.palette.grey[500],
            }}
          >
            <Close />
          </IconButton>
        </DialogTitle>
        <DialogContent>{renderContent()}</DialogContent>
      </Dialog>
      <ToastAlert
        open={!!submitMessage.message}
        close={() => setSubmitMessage({ message: '', type: 'info' })}
        type={submitMessage.type}
      >
        {submitMessage.message}
      </ToastAlert>
    </>
  );
}
