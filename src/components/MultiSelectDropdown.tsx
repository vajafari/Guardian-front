import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { HiOutlineChevronDown } from 'react-icons/hi';

interface MultiSelectOption {
  value: string;
  label: string;
}

interface MultiSelectDropdownProps {
  id?: string;
  options: MultiSelectOption[];
  selectedValues: string[];
  onChange: (values: string[]) => void;
}

export function MultiSelectDropdown({ id, options, selectedValues, onChange }: MultiSelectDropdownProps) {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const toggleValue = (value: string) => {
    if (selectedValues.includes(value)) {
      onChange(selectedValues.filter((v) => v !== value));
    } else {
      onChange([...selectedValues, value]);
    }
  };

  const filteredOptions = query
    ? options.filter((option) => option.label.toLowerCase().includes(query.toLowerCase()))
    : options;

  return (
    <div className="relative" ref={containerRef}>
      <button
        id={id}
        type="button"
        className="input flex items-center justify-between w-full text-start"
        onClick={() => setIsOpen((open) => !open)}
      >
        <span className={selectedValues.length === 0 ? 'text-gray-400' : ''}>
          {selectedValues.length === 0 ? '—' : t('common.selectedCount', { count: selectedValues.length })}
        </span>
        <HiOutlineChevronDown className={`transition-transform shrink-0 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute z-20 mt-1 w-full rounded-lg border border-gray-200 bg-white shadow-lg dark:border-gray-600 dark:bg-gray-800">
          {options.length > 6 && (
            <div className="p-2 border-b border-gray-100 dark:border-gray-700">
              <input
                type="text"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                className="input w-full"
                autoFocus
              />
            </div>
          )}
          <div className="max-h-48 overflow-y-auto p-1">
            {filteredOptions.length === 0 ? (
              <p className="px-3 py-2 text-sm text-gray-400">—</p>
            ) : (
              filteredOptions.map((option) => (
                <label
                  key={option.value}
                  className="flex items-center gap-2 px-3 py-1.5 text-sm rounded cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  <input
                    type="checkbox"
                    className="accent-primary"
                    checked={selectedValues.includes(option.value)}
                    onChange={() => toggleValue(option.value)}
                  />
                  <span>{option.label}</span>
                </label>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
