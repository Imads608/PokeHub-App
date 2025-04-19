import type {
  ContextFieldType,
  ContextField,
} from '@pokehub/frontend/shared-context';

export type ThemeType = 'light' | 'dark';

export interface SharedThemeContext<T extends ContextFieldType> {
  theme: ContextField<ThemeType, T>;
}
