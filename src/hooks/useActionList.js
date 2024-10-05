import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { importActions } from '@/services/importLocales';

export default function useActionList(gameMode) {
  const { i18n } = useTranslation();
  const [actionsList, setActionList] = useState({});
  const [isLoading, setIsLoading] = useState(true);

  const importData = async () => {
    if (!gameMode) return;
    setIsLoading(true);
    const data = await importActions(i18n.resolvedLanguage, gameMode);
    setActionList(data);
    setIsLoading(false);
  };

  useEffect(() => {
    importData();
  }, [i18n.resolvedLanguage, gameMode]);

  return { actionsList, isLoading };
}
