import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import {
  Dialog,
  DialogContent,
  DialogTitle,
  Divider,
  IconButton,
} from '@mui/material';
import { Close } from '@mui/icons-material';
import { Trans, useTranslation } from 'react-i18next';
import { importCustomTiles, getCustomTiles } from 'stores/customTiles';
import useBreakpoint from 'hooks/useBreakpoint';
import ToastAlert from 'components/ToastAlert';
import groupActionsFolder from 'helpers/actionsFolder';
import ImportExport from 'views/CustomTileDialog/ImportExport';
import AddCustomTile from './AddCustomTile';
import CustomTileHelp from './CustomTileHelp';
import ViewCustomTiles from './ViewCustomTiles';

export default function CustomTileDialog({
  boardUpdated,
  actionsList,
  setOpen,
  open = false,
}) {
  const { t } = useTranslation();
  const isMobile = useBreakpoint();
  const [submitMessage, setSubmitMessage] = useState({
    message: '',
    type: 'info',
  });
  const [expanded, setExpanded] = useState('ctAdd');
  const [tileId, updateTile] = useState(null);

  const handleChange = (panel) => (_event, newExpanded) => {
    setExpanded(newExpanded ? panel : false);
  };

  const allTiles = useLiveQuery(() => getCustomTiles());
  if (!allTiles) return null;

  const tagList = allTiles
    ?.map(({ tags }) => tags)
    ?.flat()
    ?.filter((tag, index, self) => tag && self.indexOf(tag) === index)
    ?.sort();

  const bulkImport = async (records) => {
    await importCustomTiles(records);
    boardUpdated();
  };

  const mappedGroups = groupActionsFolder(actionsList);

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
            boardUpdated={boardUpdated}
            customTiles={allTiles}
            mappedGroups={mappedGroups}
            expanded={expanded}
            handleChange={handleChange}
            tagList={tagList}
            updateTileId={tileId}
            setUpdateTileId={updateTile}
          />

          <ImportExport
            expanded={expanded}
            handleChange={handleChange}
            customTiles={allTiles}
            mappedGroups={mappedGroups}
            setSubmitMessage={setSubmitMessage}
            bulkImport={bulkImport}
          />

          {!!allTiles?.length && (
            <>
              <Divider sx={{ my: 2 }} />
              <ViewCustomTiles
                tagList={tagList}
                customTiles={allTiles}
                boardUpdated={boardUpdated}
                mappedGroups={mappedGroups}
                updateTile={updateTile}
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
