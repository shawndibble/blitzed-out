import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { importActions } from 'services/importLocales';

export default function useActionList(gameMode) {
  const { i18n } = useTranslation();
  const [actionsList, setActionList] = useState({});

  useEffect(() => {
    if (!gameMode) return;
    setActionList(importActions(i18n.resolvedLanguage, gameMode));
  }, [i18n.resolvedLanguage, gameMode]);

  return actionsList;
}
