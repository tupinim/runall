import { useEffect, useState } from 'react';
import type { ITheme, Terminal } from '@xterm/xterm';

export function useXtermThemeSync(term: Terminal | null) {
  const [state, setState] = useState<ITheme | undefined>();

  useEffect(() => {
    if (!term) return;

    const root = document.documentElement;

    const getColor = (varName: string, fallback: string): string => {
      return getComputedStyle(root).getPropertyValue(varName)?.trim() || fallback;
    };

    const updateTheme = () => {
      const theme: ITheme = {
        background: getColor('--color-base-200', '#ffffff'),
        foreground: getColor('--color-base-content', '#1f2937'),
        cursor: getColor('--color-base-content', '#1f2937'),
        selectionBackground: getColor('--color-base-300', '#93c5fd44'),
        selectionForeground: getColor('--color-base-content', '#1f2937'),
        selectionInactiveBackground: getColor('--color-base-300', '#1f2937'),
      };

      term.options.theme = theme;
      setState(theme);
    };

    updateTheme();

    const observer = new MutationObserver(updateTheme);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-theme'],
    });

    return () => observer.disconnect();
  }, [term]);

  return state;
}
