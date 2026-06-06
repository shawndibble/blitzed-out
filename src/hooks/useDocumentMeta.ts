import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';

export default function useDocumentMeta(): void {
  const { t, i18n } = useTranslation();

  useEffect(() => {
    document.title = `Blitzed Out - ${t('siteTagline')}`;
    document.documentElement.lang = i18n.language;
  }, [t, i18n.language]);
}
