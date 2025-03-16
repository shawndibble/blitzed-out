import { useEffect, useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { importActions } from '@/services/importLocales';

export default function useActionList(gameMode?: string) {
  const { i18n } = useTranslation();
  const [actionsList, setActionList] = useState<Record<string, any>>({});
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const importData = useCallback(async (): Promise<void> => {
    if (!gameMode) return;
    setIsLoading(true);
    try {
      const data = await importActions(i18n.resolvedLanguage, gameMode);
      setActionList(data);
    } catch (error) {
      console.error('Error importing actions:', error);
      setActionList({});
    } finally {
      setIsLoading(false);
    }
  }, [gameMode, i18n.resolvedLanguage]);

  useEffect(() => {
    importData();
  }, [importData]);

  return { actionsList, isLoading };
}
