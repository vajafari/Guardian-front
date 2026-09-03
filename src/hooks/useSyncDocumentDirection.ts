import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';

/** Keeps <html dir> / <html lang> in sync with the active i18n language. */
export function useSyncDocumentDirection() {
  const { i18n } = useTranslation();
  const language = i18n.resolvedLanguage ?? 'en';

  useEffect(() => {
    document.documentElement.dir = i18n.dir(language);
    document.documentElement.lang = language;
  }, [i18n, language]);
}
