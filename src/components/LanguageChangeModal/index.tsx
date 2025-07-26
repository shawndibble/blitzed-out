import { Trans, useTranslation } from 'react-i18next';
import ConfirmationModal from '@/components/ConfirmationModal';
import { languages } from '@/services/i18nHelpers';

interface LanguageChangeModalProps {
  open: boolean;
  onClose: () => void;
  onRebuildBoard: () => void;
  onKeepBoard: () => void;
  fromLanguage: string;
  toLanguage: string;
}

export default function LanguageChangeModal({
  open,
  onClose,
  onRebuildBoard,
  onKeepBoard,
  fromLanguage,
  toLanguage,
}: LanguageChangeModalProps): JSX.Element {
  const { t } = useTranslation();

  const fromLanguageLabel = languages[fromLanguage]?.label || fromLanguage;
  const toLanguageLabel = languages[toLanguage]?.label || toLanguage;

  const handleRebuildBoard = (): void => {
    onRebuildBoard();
    onClose();
  };

  const handleKeepBoard = (): void => {
    onKeepBoard();
    onClose();
  };

  return (
    <ConfirmationModal
      open={open}
      onClose={onClose}
      onConfirm={handleRebuildBoard}
      onCancel={handleKeepBoard}
      title={<Trans i18nKey="languageChangeTitle" />}
      message={
        <>
          <Trans
            i18nKey="languageChangeMessage"
            values={{
              fromLanguage: fromLanguageLabel,
              toLanguage: toLanguageLabel,
            }}
          />
          <br />
          <br />
          <Trans i18nKey="languageChangeExplanation" />
        </>
      }
      confirmText={t('rebuildBoardAction')}
      cancelText={t('keepCurrentBoard')}
      severity="info"
      confirmColor="primary"
    />
  );
}
