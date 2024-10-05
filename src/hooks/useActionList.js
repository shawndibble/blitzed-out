import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { importActions } from '@/services/importLocales';

export default function useActionList(gameMode) {
  const { i18n } = useTranslation();
  const [actionsList, setActionList] = useState({});

  const importData = async () => {
    if (!gameMode) return;
    const data = await importActions(i18n.resolvedLanguage, gameMode);
    setActionList(data);
  };

  useEffect(() => {
    importData()
  }, [i18n.resolvedLanguage, gameMode]);

  return actionsList;
}
