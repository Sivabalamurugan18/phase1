import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Search, X } from 'lucide-react';

interface Option {
  value: string;
  label: string;
  disabled?: boolean;
}

interface SearchableSelectProps {
  id: string;
  name: string;
  label?: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  options: Option[];
  placeholder?: string;
  disabled?: boolean;
  required?: boolean;
  error?: string;
  className?: string;
}

const SearchableSelect: React.FC<SearchableSelectProps> = ({
  id,
  name,
  label,
  value,
  onChange,
  options,
  placeholder = "Select an option",
  disabled = false,
  required = false,
  error,
  className = ''
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const [filteredOptions, setFilteredOptions] = useState(options);
  const [isTyping, setIsTyping] = useState(false);
  
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const optionRefs = useRef<(HTMLDivElement | null)[]>([]);

  // Filter options based on search term
  useEffect(() => {
    const filtered = options.filter(option => {
      // Always include disabled options (like separators)
      if (option.disabled) return true;
      
      return (
        option.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
        option.value.toLowerCase().includes(searchTerm.toLowerCase())
      );
    });
    setFilteredOptions(filtered);
    setHighlightedIndex(-1);
  }, [searchTerm, options]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSearchTerm('');
        setIsTyping(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Focus search input when dropdown opens
  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isOpen]);

  // Scroll highlighted option into view
  useEffect(() => {
    if (highlightedIndex >= 0 && optionRefs.current[highlightedIndex]) {
      optionRefs.current[highlightedIndex]?.scrollIntoView({
        block: 'nearest',
        behavior: 'smooth'
      });
    }
  }, [highlightedIndex]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen && !isTyping) {
      if (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowDown') {
        e.preventDefault();
        setIsOpen(true);
      }
      return;
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        if (!isOpen) setIsOpen(true);
        setHighlightedIndex(prev => {
          let next = prev < filteredOptions.length - 1 ? prev + 1 : 0;
          // Skip disabled options
          while (filteredOptions[next]?.disabled && next < filteredOptions.length - 1) {
            next++;
          }
          return next;
        });
        break;
      case 'ArrowUp':
        e.preventDefault();
        if (!isOpen) setIsOpen(true);
        setHighlightedIndex(prev => {
          let next = prev > 0 ? prev - 1 : filteredOptions.length - 1;
          // Skip disabled options
          while (filteredOptions[next]?.disabled && next > 0) {
            next--;
          }
          return next;
        });
        break;
      case 'Enter':
        e.preventDefault();
        if (highlightedIndex >= 0 && filteredOptions[highlightedIndex] && !filteredOptions[highlightedIndex].disabled) {
          handleSelect(filteredOptions[highlightedIndex]);
        }
        break;
      case 'Escape':
        e.preventDefault();
        setIsOpen(false);
        setSearchTerm('');
        setIsTyping(false);
        break;
      case 'Tab':
        setIsOpen(false);
        setSearchTerm('');
        setIsTyping(false);
        break;
    }
  };

  const handleSelect = (option: Option) => {
    // Create a synthetic event to match the expected onChange signature
    const syntheticEvent = {
      target: {
        name,
        value: option.value
      }
    } as React.ChangeEvent<HTMLSelectElement>;
    
    onChange(syntheticEvent);
    setIsOpen(false);
    setSearchTerm('');
    setHighlightedIndex(-1);
    setIsTyping(false);
  };

  const handleToggle = () => {
    if (disabled) return;
    setIsOpen(!isOpen);
    if (!isOpen) {
      setSearchTerm('');
      setIsTyping(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setSearchTerm(newValue);
    setIsTyping(true);
    
    // Auto-open dropdown when typing
    if (newValue && !isOpen) {
      setIsOpen(true);
    }
    
    // Auto-close dropdown if search is cleared
    if (!newValue) {
      setIsOpen(false);
      setIsTyping(false);
    }
  };

  const handleInputFocus = () => {
    if (searchTerm && !isOpen) {
      setIsOpen(true);
    }
  };

  const clearSelection = (e: React.MouseEvent) => {
    e.stopPropagation();
    const syntheticEvent = {
      target: {
        name,
        value: ''
      }
    } as React.ChangeEvent<HTMLSelectElement>;
    
    onChange(syntheticEvent);
    setSearchTerm('');
    setIsTyping(false);
  };

  const selectedOption = options.find(option => option.value === value);

  return (
    <div className={className}>
      {label && (
        <label htmlFor={id} className="block text-sm font-medium text-gray-700 mb-1">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}
      
      <div className="relative" ref={dropdownRef}>
        {/* Main Search Input - Always Visible */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            ref={searchInputRef}
            type="text"
            id={id}
            value={isTyping ? searchTerm : (selectedOption ? selectedOption.label : '')}
            onChange={handleInputChange}
            onFocus={handleInputFocus}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            disabled={disabled}
            className={`
              w-full pl-10 pr-10 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm
              ${error ? 'border-red-300' : 'border-gray-300'}
              ${disabled ? 'bg-gray-100 cursor-not-allowed' : 'bg-white cursor-text hover:border-gray-400'}
            `}
          />
          
          {/* Clear and Dropdown Toggle Buttons */}
          <div className="absolute inset-y-0 right-0 flex items-center pr-2">
            {value && !disabled && (
              <button
                type="button"
                onClick={clearSelection}
                className="mr-1 p-1 hover:bg-gray-100 rounded-full transition-colors"
                title="Clear selection"
              >
                <X className="h-3 w-3 text-gray-400 hover:text-gray-600" />
              </button>
            )}
            <button
              type="button"
              onClick={handleToggle}
              disabled={disabled}
              className="p-1 hover:bg-gray-100 rounded-full transition-colors"
              title="Toggle dropdown"
            >
              <ChevronDown 
                className={`h-4 w-4 text-gray-400 transition-transform duration-200 ${
                  isOpen ? 'transform rotate-180' : ''
                }`} 
              />
            </button>
          </div>
        </div>

        {/* Dropdown */}
        {isOpen && (
          <div className="absolute z-50 mt-1 w-full bg-white shadow-lg max-h-80 rounded-md py-1 text-base ring-1 ring-black ring-opacity-5 overflow-auto focus:outline-none sm:text-sm">
            {/* Options List */}
            <div className="max-h-80 overflow-auto">
              {filteredOptions.length === 0 ? (
                <div className="px-3 py-2 text-gray-500 text-sm">
                  No options found
                </div>
              ) : (
                filteredOptions.map((option, index) => (
                  <div
                    key={option.value}
                    ref={el => optionRefs.current[index] = el}
                    onClick={() => !option.disabled && handleSelect(option)}
                    className={`
                      ${option.disabled ? 'cursor-default' : 'cursor-pointer'} select-none relative py-2 pl-3 pr-9 ${!option.disabled ? 'hover:bg-blue-50' : ''} transition-colors
                      ${highlightedIndex === index ? 'bg-blue-100 text-blue-900' : 'text-gray-900'}
                      ${value === option.value ? 'bg-blue-50 font-medium' : ''}
                      ${option.disabled ? 'text-gray-400 bg-gray-50 italic' : ''}
                    `}
                    role="option"
                    aria-selected={value === option.value}
                    aria-disabled={option.disabled}
                  >
                    <span className={`block truncate ${option.disabled ? 'text-center font-medium' : ''}`}>
                      {option.label}
                    </span>
                    
                    {value === option.value && !option.disabled && (
                      <span className="absolute inset-y-0 right-0 flex items-center pr-4">
                        <svg className="h-4 w-4 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </span>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>
      
      {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
    </div>
  );
};

export default SearchableSelect;