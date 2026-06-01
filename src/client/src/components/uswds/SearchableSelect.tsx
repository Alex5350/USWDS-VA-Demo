"use client";

import { type FocusEvent, type KeyboardEvent, useId, useMemo, useRef, useState } from "react";

import { UsaFormGroup } from "@/components/uswds/UsaFormGroup";

type SearchableOption = {
  value: string;
  label: string;
  detail?: string;
};

type SearchableSelectProps = {
  id: string;
  label: string;
  options: SearchableOption[];
  value: string;
  required?: boolean;
  showSelectedDetail?: boolean;
  onChange: (value: string) => void;
};

export function SearchableSelect({
  id,
  label,
  options,
  value,
  required = false,
  showSelectedDetail = false,
  onChange
}: SearchableSelectProps) {
  const generatedId = useId();
  const listId = `${id}-${generatedId}-list`;
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [typedValue, setTypedValue] = useState<string | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const selectedOption = useMemo(() => options.find((option) => option.value === value), [options, value]);
  const inputValue = typedValue ?? selectedOption?.label ?? "";

  const filteredOptions = useMemo(() => {
    const normalizedInput = inputValue.trim().toLowerCase();
    const selectedLabelIsShowing = selectedOption?.label === inputValue;

    if (!normalizedInput || selectedLabelIsShowing) {
      return options;
    }

    return options.filter((option) => {
      const haystack = `${option.label} ${option.detail ?? ""}`.toLowerCase();
      return haystack.includes(normalizedInput);
    });
  }, [inputValue, options, selectedOption?.label]);

  const visibleOptions = filteredOptions.slice(0, 50);
  const safeActiveIndex = Math.min(activeIndex, Math.max(visibleOptions.length - 1, 0));
  const activeOptionId = isOpen && visibleOptions[safeActiveIndex] ? `${listId}-option-${safeActiveIndex}` : undefined;

  function selectOption(option: SearchableOption, shouldFocus = true) {
    onChange(option.value);
    setTypedValue(null);
    setIsOpen(false);
    if (shouldFocus) {
      inputRef.current?.focus();
    }
  }

  function handleInputChange(nextInputValue: string) {
    setTypedValue(nextInputValue);
    setIsOpen(true);
    setActiveIndex(0);

    const exactMatch = options.find((option) => option.label === nextInputValue);
    if (exactMatch) {
      onChange(exactMatch.value);
    } else if (!nextInputValue.trim()) {
      onChange("");
    }
  }

  function commitCurrentInput() {
    const exactMatch = options.find((option) => option.label === inputValue);
    if (exactMatch) {
      selectOption(exactMatch, false);
      return;
    }

    const normalizedInput = inputValue.trim().toLowerCase();
    const fuzzyMatch = normalizedInput
      ? options.find((option) => `${option.label} ${option.detail ?? ""}`.toLowerCase().includes(normalizedInput))
      : undefined;

    if (fuzzyMatch) {
      selectOption(fuzzyMatch, false);
      return;
    }

    setTypedValue(null);
  }

  function handleBlur(event: FocusEvent<HTMLDivElement>) {
    const nextTarget = event.relatedTarget;
    if (nextTarget && containerRef.current?.contains(nextTarget)) {
      return;
    }

    setIsOpen(false);
    commitCurrentInput();
  }

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setIsOpen(true);
      setActiveIndex((current) => Math.min(current + 1, Math.max(visibleOptions.length - 1, 0)));
      return;
    }

    if (event.key === "ArrowUp") {
      event.preventDefault();
      setIsOpen(true);
      setActiveIndex((current) => Math.max(current - 1, 0));
      return;
    }

    if (event.key === "Enter" && isOpen && visibleOptions[safeActiveIndex]) {
      event.preventDefault();
      selectOption(visibleOptions[safeActiveIndex]);
      return;
    }

    if (event.key === "Escape") {
      setIsOpen(false);
      setTypedValue(null);
    }
  }

  return (
    <UsaFormGroup id={id} label={label}>
      <div className="searchable-select-control" ref={containerRef} onBlur={handleBlur}>
        <div className="searchable-select-input-row">
          <input
            aria-activedescendant={activeOptionId}
            aria-autocomplete="list"
            aria-controls={listId}
            aria-describedby={showSelectedDetail && selectedOption ? `${id}-selected-detail` : undefined}
            aria-expanded={isOpen}
            className="usa-input searchable-select"
            id={id}
            name={id}
            ref={inputRef}
            required={required}
            role="combobox"
            value={inputValue}
            onChange={(event) => handleInputChange(event.target.value)}
            onClick={() => setIsOpen(true)}
            onFocus={() => setIsOpen(true)}
            onKeyDown={handleKeyDown}
          />
          <button
            aria-label={`Show ${label} options`}
            className="searchable-select-toggle"
            type="button"
            onClick={() => {
              setIsOpen((current) => !current);
              inputRef.current?.focus();
            }}
          />
        </div>
        {isOpen ? (
          <ul className="searchable-select-list" id={listId} role="listbox">
            {visibleOptions.length > 0 ? (
              visibleOptions.map((option, index) => (
                <li
                  aria-selected={option.value === value}
                  className={`searchable-select-option${index === activeIndex ? " is-active" : ""}`}
                  id={`${listId}-option-${index}`}
                  key={option.value}
                  role="option"
                  tabIndex={-1}
                  onMouseDown={(event) => event.preventDefault()}
                  onMouseEnter={() => setActiveIndex(index)}
                  onClick={() => selectOption(option)}
                >
                  <span className="searchable-select-option-label">{option.label}</span>
                  {option.detail ? <span className="searchable-select-option-detail">{option.detail}</span> : null}
                </li>
              ))
            ) : (
              <li className="searchable-select-empty">No matching options.</li>
            )}
          </ul>
        ) : null}
      </div>
      {showSelectedDetail && selectedOption ? (
        <p className="field-detail" id={`${id}-selected-detail`}>
          {selectedOption.detail ?? selectedOption.label}
        </p>
      ) : null}
    </UsaFormGroup>
  );
}
