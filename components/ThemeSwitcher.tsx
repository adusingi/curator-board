"use client";

import { useEffect, useMemo, useState } from "react";
import { DEFAULT_THEME_ID, getThemeById, themes, THEME_STORAGE_KEY } from "@/lib/themes";

function applyTheme(themeId: string) {
  document.documentElement.dataset.theme = getThemeById(themeId).id;
  window.localStorage.setItem(THEME_STORAGE_KEY, themeId);
}

function readInitialThemeId() {
  if (typeof window === "undefined") {
    return DEFAULT_THEME_ID;
  }

  const fromStorage = window.localStorage.getItem(THEME_STORAGE_KEY);
  const fromDocument = document.documentElement.dataset.theme;
  return getThemeById(fromStorage || fromDocument || DEFAULT_THEME_ID).id;
}

export default function ThemeSwitcher() {
  const [open, setOpen] = useState(false);
  const [currentThemeId, setCurrentThemeId] = useState(readInitialThemeId);
  const [highlightedIndex, setHighlightedIndex] = useState(() =>
    Math.max(0, themes.findIndex((theme) => theme.id === readInitialThemeId())),
  );

  const themeIndex = useMemo(
    () => Math.max(0, themes.findIndex((theme) => theme.id === currentThemeId)),
    [currentThemeId],
  );

  useEffect(() => {
    if (!open) return;

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        setOpen(false);
        return;
      }

      if (event.key === "ArrowDown") {
        event.preventDefault();
        setHighlightedIndex((prev) => (prev + 1) % themes.length);
        return;
      }

      if (event.key === "ArrowUp") {
        event.preventDefault();
        setHighlightedIndex((prev) => (prev - 1 + themes.length) % themes.length);
        return;
      }

      if (event.key === "Enter") {
        event.preventDefault();
        const selected = themes[highlightedIndex];
        applyTheme(selected.id);
        setCurrentThemeId(selected.id);
        setOpen(false);
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [highlightedIndex, open]);

  function toggleOpen() {
    setHighlightedIndex(themeIndex);
    setOpen((prev) => !prev);
  }

  function chooseTheme(themeId: string, index: number) {
    applyTheme(themeId);
    setCurrentThemeId(themeId);
    setHighlightedIndex(index);
    setOpen(false);
  }

  return (
    <>
      <button type="button" className="theme-trigger" onClick={toggleOpen}>
        <span className="theme-trigger-dot" />
        <span suppressHydrationWarning>{getThemeById(currentThemeId).label}</span>
        <span className="theme-trigger-hint">[/]</span>
      </button>

      {open && (
        <div className="theme-overlay" role="dialog" aria-modal="true" aria-label="Theme switcher">
          <div className="theme-panel">
            <div className="theme-panel-header">
              <div className="theme-panel-title">settings</div>
              <div className="theme-panel-tab">theme</div>
            </div>

            <div className="theme-group">
              <div className="theme-separator">
                <span>{themes[highlightedIndex]?.group ?? "dark"}</span>
              </div>
              <div className="theme-options" role="listbox" aria-label="Themes">
                {themes.map((theme, index) => (
                  <button
                    key={theme.id}
                    type="button"
                    role="option"
                    aria-selected={theme.id === currentThemeId}
                    className="theme-option"
                    data-highlighted={highlightedIndex === index}
                    onMouseEnter={() => setHighlightedIndex(index)}
                    onClick={() => chooseTheme(theme.id, index)}
                  >
                    <span>{theme.label}</span>
                    {theme.id === currentThemeId ? <span>✓</span> : null}
                  </button>
                ))}
              </div>
            </div>

            <div className="theme-footer">
              <span>↑↓ select</span>
              <span>↵ apply</span>
              <button type="button" className="theme-close" onClick={() => setOpen(false)}>
                esc close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
