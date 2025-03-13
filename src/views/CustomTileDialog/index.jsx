import { useState, useCallback, useMemo, useEffect } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { Dialog, DialogContent, DialogTitle, Divider, IconButton } from '@mui/material';
import { Close } from '@mui/icons-material';
import { Trans, useTranslation } from 'react-i18next';
import { importCustomTiles, getCustomTiles } from '@/stores/customTiles';
import useBreakpoint from '@/hooks/useBreakpoint';
import ToastAlert from '@/components/ToastAlert';
import groupActionsFolder from '@/helpers/actionsFolder';
import { importActions } from '@/services/importLocales';
import ImportExport from '@/views/CustomTileDialog/ImportExport';
import AddCustomTile from './AddCustomTile';
import CustomTileHelp from './CustomTileHelp';
import ViewCustomTiles from './ViewCustomTiles';

export default function CustomTileDialog({ boardUpdated, setOpen, open = false }) {
  const { t, i18n } = useTranslation();
  const isMobile = useBreakpoint();
  const [submitMessage, setSubmitMessage] = useState({
    message: '',
    type: 'info',
  });
  const [expanded, setExpanded] = useState('ctAdd');
  const [tileId, setTileId] = useState(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [allGameModeActions, setAllGameModeActions] = useState({
    online: {},
    local: {}
  });
  const [isLoadingActions, setIsLoadingActions] = useState(true);

  // Create a function to trigger refresh of the ViewCustomTiles component
  const triggerRefresh = useCallback(() => {
    setRefreshTrigger(prev => prev + 1);
  }, []);

  const handleChange = (panel) => (_event, newExpanded) => {
    setExpanded(newExpanded ? panel : false);
  };

  // Load actions for both game modes
  useEffect(() => {
    async function loadAllGameModeActions() {
      setIsLoadingActions(true);
      try {
        const [onlineActions, localActions] = await Promise.all([
          importActions(i18n.resolvedLanguage, 'online'),
          importActions(i18n.resolvedLanguage, 'local')
        ]);
        
        setAllGameModeActions({
          online: onlineActions,
          local: localActions
        });
      } catch (error) {
        console.error('Error loading game mode actions:', error);
      } finally {
        setIsLoadingActions(false);
      }
    }
    
    loadAllGameModeActions();
  }, [i18n.resolvedLanguage]);

  const allTiles = useLiveQuery(() => getCustomTiles({ paginated: false }));
  
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

  const bulkImport = useCallback(async (records) => {
    await importCustomTiles(records);
    boardUpdated();
    triggerRefresh();
  }, [boardUpdated, triggerRefresh]);

  // Create mapped groups for both game modes
  const mappedGroups = useMemo(() => {
    // Create mapped groups for both game modes
    const onlineGroups = groupActionsFolder(allGameModeActions.online);
    const localGroups = groupActionsFolder(allGameModeActions.local);
    
    // Create a map to store merged groups with all intensity levels
    const groupMap = new Map();
    
    // Process online groups first
    onlineGroups.forEach(onlineGroup => {
      groupMap.set(onlineGroup.value, {
        ...onlineGroup,
        // Store all intensities in an array
        allIntensities: onlineGroup.intensities || []
      });
    });
    
    // Process local groups, merging with existing online groups if needed
    localGroups.forEach(localGroup => {
      const existingGroup = groupMap.get(localGroup.value);
      
      if (existingGroup) {
        // Merge intensities from both game modes
        const allIntensities = [...existingGroup.allIntensities];
        
        // Add any new intensities from local mode
        (localGroup.intensities || []).forEach(intensity => {
          if (!allIntensities.some(i => i.value === intensity.value)) {
            allIntensities.push(intensity);
          }
        });
        
        // Update the group with merged intensities
        groupMap.set(localGroup.value, {
          ...existingGroup,
          allIntensities
        });
      } else {
        // This is a new group only in local mode
        groupMap.set(localGroup.value, {
          ...localGroup,
          allIntensities: localGroup.intensities || []
        });
      }
    });
    
    // Convert the map back to an array and ensure each group has all intensities
    const allGroups = Array.from(groupMap.values()).map(group => ({
      ...group,
      intensities: group.allIntensities
    }));
    
    return allGroups;
  }, [allGameModeActions]);

  if (!allTiles || isLoadingActions) return null;


  return (
    <>
      <Dialog fullScreen={isMobile} open={open} onClose={() => setOpen(false)}>
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
        <DialogContent>
          <CustomTileHelp expanded={expanded} handleChange={handleChange} />

          <AddCustomTile
            setSubmitMessage={setSubmitMessage}
            boardUpdated={() => {
              boardUpdated();
              triggerRefresh();
            }}
            customTiles={allTiles}
            mappedGroups={mappedGroups}
            expanded={expanded}
            handleChange={handleChange}
            tagList={tagList}
            updateTileId={tileId}
            setUpdateTileId={setTileId}
          />

          <ImportExport
            expanded={expanded}
            handleChange={handleChange}
            customTiles={allTiles}
            mappedGroups={mappedGroups}
            setSubmitMessage={setSubmitMessage}
            bulkImport={bulkImport}
          />

          {Array.isArray(allTiles) && allTiles.length > 0 && (
            <>
              <Divider sx={{ my: 2 }} />
              <ViewCustomTiles
                tagList={tagList}
                boardUpdated={() => {
                  boardUpdated();
                  triggerRefresh();
                }}
                mappedGroups={mappedGroups}
                updateTile={(id) => {
                  setTileId(id);
                  setExpanded('ctAdd');
                }}
                refreshTrigger={refreshTrigger}
              />
            </>
          )}
        </DialogContent>
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
