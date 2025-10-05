import type { SharedThemeContext } from './theme.context.model';
import { createContext, useContext } from 'react';

export const ThemeContext = createContext<SharedThemeContext<'ReadWrite'>>({
  theme: {
    value: 'light',
    setValue: () => {
      // Function needs to be set
    },
  },
});

export const useTheme = () => {
  const { theme } = useContext<SharedThemeContext<'ReadWrite'>>(ThemeContext);
  return {
    theme: theme.value,
    toggleTheme: () =>
      theme.value === 'light'
        ? theme.setValue('dark')
        : theme.setValue('light'),
  };
};
