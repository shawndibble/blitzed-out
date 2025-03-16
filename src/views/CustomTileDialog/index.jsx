import { useState, useCallback, useMemo, useEffect, SyntheticEvent } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { Dialog, DialogContent, DialogTitle, Divider, IconButton, Grid2, Box } from '@mui/material';
import { Close } from '@mui/icons-material';
import { Trans, useTranslation } from 'react-i18next';
import { importCustomTiles, getTiles } from '@/stores/customTiles';
import useBreakpoint from '@/hooks/useBreakpoint';
import ToastAlert from '@/components/ToastAlert';
import { importActions } from '@/services/importLocales';
import ImportExport from '@/views/CustomTileDialog/ImportExport';
import AddCustomTile from './AddCustomTile';
import CustomTileHelp from './CustomTileHelp';
import ViewCustomTiles from './ViewCustomTiles';
import { CustomTileDialogProps, CustomTile, AllGameModeActions, SubmitMessage } from '@/types/customTiles';

export default function CustomTileDialog({ boardUpdated, setOpen, open = false }: CustomTileDialogProps) {
  const { t, i18n } = useTranslation();
  const isMobile = useBreakpoint();
  const isSmallScreen = useBreakpoint('md');
  const [submitMessage, setSubmitMessage] = useState<SubmitMessage>({
    message: '',
    type: 'info',
  });
  const [expanded, setExpanded] = useState<string>('ctAdd');
  const [tileId, setTileId] = useState<number | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState<number>(0);
  const [allGameModeActions, setAllGameModeActions] = useState<AllGameModeActions>({
    online: {},
    local: {},
  });
  const [isLoadingActions, setIsLoadingActions] = useState<boolean>(true);

  // Create a function to trigger refresh of the ViewCustomTiles component
  const triggerRefresh = useCallback(() => {
    setRefreshTrigger((prev) => prev + 1);
  }, []);

  const handleChange = (panel: string) => (_event: SyntheticEvent, newExpanded: boolean) => {
    setExpanded(newExpanded ? panel : '');
  };

  // Load actions for both game modes
  useEffect(() => {
    async function loadAllGameModeActions() {
      setIsLoadingActions(true);
      try {
        const [onlineActions, localActions] = await Promise.all([
          importActions(i18n.resolvedLanguage, 'online'),
          importActions(i18n.resolvedLanguage, 'local'),
        ]);

        setAllGameModeActions({
          online: onlineActions,
          local: localActions,
        });
      } catch (error) {
        console.error('Error loading game mode actions:', error);
      } finally {
        setIsLoadingActions(false);
      }
    }

    loadAllGameModeActions();
  }, [i18n.resolvedLanguage]);

  const allTiles = useLiveQuery(() =>
    getTiles({ paginated: false, locale: i18n.resolvedLanguage })
  );

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

  const bulkImport = useCallback(
    async (records: CustomTile[]) => {
      await importCustomTiles(records);
      boardUpdated();
      triggerRefresh();
    },
    [boardUpdated, triggerRefresh]
  );

  if (!allTiles || isLoadingActions) return null;

  // Render content based on screen size
  const renderContent = () => {
    const leftColumnContent = (
      <>
        <CustomTileHelp expanded={expanded} handleChange={handleChange} />

        <AddCustomTile
          setSubmitMessage={setSubmitMessage}
          boardUpdated={() => {
            boardUpdated();
            triggerRefresh();
          }}
          customTiles={allTiles as CustomTile[]}
          mappedGroups={allGameModeActions}
          expanded={expanded}
          handleChange={handleChange}
          tagList={tagList}
          updateTileId={tileId}
          setUpdateTileId={setTileId}
        />

        <ImportExport
          expanded={expanded}
          handleChange={handleChange}
          customTiles={allTiles as CustomTile[]}
          mappedGroups={allGameModeActions}
          setSubmitMessage={setSubmitMessage}
          bulkImport={bulkImport}
        />
      </>
    );

    const rightColumnContent = Array.isArray(allTiles) && allTiles.length > 0 && (
      <Box>
        <ViewCustomTiles
          tagList={tagList}
          boardUpdated={() => {
            boardUpdated();
            triggerRefresh();
          }}
          mappedGroups={allGameModeActions}
          updateTile={(id: number) => {
            setTileId(id);
            setExpanded('ctAdd');
          }}
          refreshTrigger={refreshTrigger}
        />
      </Box>
    );

    if (!isSmallScreen) {
      return (
        <Grid2 container spacing={2}>
          <Grid2 size={{ xs: 12, md: 6 }}>{leftColumnContent}</Grid2>
          <Grid2 size={{ xs: 12, md: 6 }}>{rightColumnContent}</Grid2>
        </Grid2>
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
