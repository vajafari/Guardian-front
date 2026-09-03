import { useTranslation } from 'react-i18next';
import { SUPPORTED_LANGUAGES, type SupportedLanguage } from '../i18n';
import './LanguageSwitcher.css';

export function LanguageSwitcher() {
  const { i18n, t } = useTranslation();
  const currentLanguage = i18n.resolvedLanguage as SupportedLanguage;

  return (
    <div className="language-switcher" role="group" aria-label="Language">
      {SUPPORTED_LANGUAGES.map((lang) => (
        <button
          key={lang}
          type="button"
          className={
            lang === currentLanguage
              ? 'language-switcher__option language-switcher__option--active'
              : 'language-switcher__option'
          }
          onClick={() => i18n.changeLanguage(lang)}
          aria-pressed={lang === currentLanguage}
        >
          {t(`language.${lang}`)}
        </button>
      ))}
    </div>
  );
}
