"use client";

import { type FocusEvent, type KeyboardEvent, useCallback, useEffect, useId, useMemo, useRef, useState } from "react";

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
  const pointerStartedInsideRef = useRef(false);
  const [typedValue, setTypedValue] = useState<string | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [opensAbove, setOpensAbove] = useState(false);
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

  function resetPointerStartedInside() {
    window.setTimeout(() => {
      pointerStartedInsideRef.current = false;
    }, 0);
  }

  const updateListPlacement = useCallback(() => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) {
      return;
    }

    const estimatedListHeight = 320;
    const spaceBelow = window.innerHeight - rect.bottom;
    const spaceAbove = rect.top;
    setOpensAbove(spaceBelow < estimatedListHeight && spaceAbove > spaceBelow);
  }, []);

  const openList = useCallback(() => {
    updateListPlacement();
    setIsOpen(true);
  }, [updateListPlacement]);

  const selectOption = useCallback(
    (option: SearchableOption, shouldFocus = true) => {
      onChange(option.value);
      setTypedValue(null);
      setIsOpen(false);
      if (shouldFocus) {
        inputRef.current?.focus();
      }
    },
    [onChange]
  );

  function handleInputChange(nextInputValue: string) {
    setTypedValue(nextInputValue);
    openList();
    setActiveIndex(0);

    const exactMatch = options.find((option) => option.label === nextInputValue);
    if (exactMatch) {
      onChange(exactMatch.value);
    } else if (!nextInputValue.trim()) {
      onChange("");
    }
  }

  const commitCurrentInput = useCallback(() => {
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
  }, [inputValue, options, selectOption]);

  useEffect(() => {
    if (!isOpen) {
      return undefined;
    }

    function handleDocumentPointerDown(event: PointerEvent) {
      const target = event.target;
      const startedInside =
        target instanceof Node ? (containerRef.current?.contains(target) ?? false) : false;

      pointerStartedInsideRef.current = startedInside;

      if (!startedInside) {
        setIsOpen(false);
        commitCurrentInput();
      }
    }

    function handleDocumentPointerUp() {
      resetPointerStartedInside();
    }

    document.addEventListener("pointerdown", handleDocumentPointerDown, true);
    document.addEventListener("pointerup", handleDocumentPointerUp, true);

    return () => {
      document.removeEventListener("pointerdown", handleDocumentPointerDown, true);
      document.removeEventListener("pointerup", handleDocumentPointerUp, true);
    };
  }, [commitCurrentInput, isOpen]);

  useEffect(() => {
    if (!isOpen) {
      return undefined;
    }

    updateListPlacement();
    window.addEventListener("resize", updateListPlacement);
    window.addEventListener("scroll", updateListPlacement, true);

    return () => {
      window.removeEventListener("resize", updateListPlacement);
      window.removeEventListener("scroll", updateListPlacement, true);
    };
  }, [isOpen, updateListPlacement]);

  function handleBlur(event: FocusEvent<HTMLDivElement>) {
    const nextTarget = event.relatedTarget;
    if (nextTarget && containerRef.current?.contains(nextTarget)) {
      return;
    }

    if (pointerStartedInsideRef.current) {
      return;
    }

    setIsOpen(false);
    commitCurrentInput();
  }

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      openList();
      setActiveIndex((current) => Math.min(current + 1, Math.max(visibleOptions.length - 1, 0)));
      return;
    }

    if (event.key === "ArrowUp") {
      event.preventDefault();
      openList();
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
      <div
        className={`searchable-select-control${opensAbove ? " is-open-above" : ""}`}
        ref={containerRef}
        onBlur={handleBlur}
        onPointerDownCapture={() => {
          pointerStartedInsideRef.current = true;
        }}
        onPointerUpCapture={resetPointerStartedInside}
        onPointerCancelCapture={resetPointerStartedInside}
      >
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
            onClick={openList}
            onFocus={openList}
            onKeyDown={handleKeyDown}
          />
          <button
            aria-label={`Show ${label} options`}
            className="searchable-select-toggle"
            type="button"
            onClick={() => {
              setIsOpen((current) => {
                const shouldOpen = !current;
                if (shouldOpen) {
                  updateListPlacement();
                }

                return shouldOpen;
              });
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
