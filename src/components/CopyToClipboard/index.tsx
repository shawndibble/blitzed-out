import { ContentCopy } from '@mui/icons-material';
import { IconButton, Tooltip } from '@mui/material';
import ToastAlert from '@/components/ToastAlert';
import { useState, ReactNode } from 'react';
import { useTranslation } from 'react-i18next';

interface CopyToClipboardProps {
  text: string;
  copiedText?: string | null;
  icon?: ReactNode | null;
  tooltip?: ReactNode | null;
}

export default function CopyToClipboard({ 
  text, 
  copiedText = null, 
  icon = null, 
  tooltip = null 
}: CopyToClipboardProps): JSX.Element {
  const { t } = useTranslation();
  const [open, setOpen] = useState<boolean>(false);

  const copyText = copiedText || t('copied');
  const buttonIcon = icon || <ContentCopy />;

  const handleCopy = () => {
    navigator.clipboard.writeText(text);
    setOpen(true);
  };

  const handleClose = () => setOpen(false);

  return (
    <>
      <Tooltip title={tooltip || t('copyToClipboard')}>
        <IconButton onClick={handleCopy}>{buttonIcon}</IconButton>
      </Tooltip>
      <ToastAlert open={open} close={handleClose} type="success">
        {copyText}
      </ToastAlert>
    </>
  );
}
