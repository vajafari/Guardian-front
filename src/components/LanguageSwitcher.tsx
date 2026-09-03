import { useTranslation } from 'react-i18next';
import { SUPPORTED_LANGUAGES, type SupportedLanguage } from '../i18n';

export function LanguageSwitcher() {
  const { i18n, t } = useTranslation();
  const currentLanguage = i18n.resolvedLanguage as SupportedLanguage;

  return (
    <div
      role="group"
      aria-label="Language"
      className="inline-flex gap-0.5 p-0.5 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-100 dark:bg-gray-900"
    >
      {SUPPORTED_LANGUAGES.map((lang) => (
        <button
          key={lang}
          type="button"
          onClick={() => i18n.changeLanguage(lang)}
          aria-pressed={lang === currentLanguage}
          className={
            lang === currentLanguage
              ? 'px-2.5 py-1 rounded-md text-xs font-bold tracking-wide bg-primary text-white'
              : 'px-2.5 py-1 rounded-md text-xs font-bold tracking-wide text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100'
          }
        >
          {t(`language.${lang}`)}
        </button>
      ))}
    </div>
  );
}
