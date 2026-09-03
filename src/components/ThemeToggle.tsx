import { HiOutlineSun, HiOutlineMoon } from 'react-icons/hi';
import { useTheme } from '../context/ThemeContext';

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label="Toggle dark mode"
      className="header-action-item header-action-item-hoverable text-xl text-gray-600 dark:text-gray-300"
    >
      {theme === 'dark' ? <HiOutlineSun /> : <HiOutlineMoon />}
    </button>
  );
}
