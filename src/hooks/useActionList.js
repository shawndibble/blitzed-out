import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { importActions } from '@/services/importLocales';

export default function useActionList(gameMode?: string) {
  const { i18n } = useTranslation();
  const [actionsList, setActionList] = useState<Record<string, any>>({});
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const importData = async (): Promise<void> => {
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
