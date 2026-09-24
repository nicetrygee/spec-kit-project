import { useColorScheme } from 'react-native';

// Colours for light and dark mode (FR-024). Every text colour meets WCAG AA
// contrast (≥ 4.5:1) on its background; tests/ui/theme.test.ts checks this (FR-022).

export type Colors = {
  background: string;
  text: string;
  mutedText: string;
  accent: string;
  warningText: string;
  warningBackground: string;
  buttonText: string;
  buttonBackground: string;
  border: string;
};

export const lightColors: Colors = {
  background: '#FFFFFF',
  text: '#1A1A1A',
  mutedText: '#595959',
  accent: '#0B5CAD',
  warningText: '#6B3E00',
  warningBackground: '#FFF4D6',
  buttonText: '#FFFFFF',
  buttonBackground: '#0B5CAD',
  border: '#767676',
};

export const darkColors: Colors = {
  background: '#121212',
  text: '#F2F2F2',
  mutedText: '#B3B3B3',
  accent: '#7DB8F0',
  warningText: '#FFD98A',
  warningBackground: '#3A2A00',
  buttonText: '#0A1A2A',
  buttonBackground: '#7DB8F0',
  border: '#8A8A8A',
};

/** Covers 44 pt (iPhone) and 48 dp (Android) minimum tap targets (FR-023). */
export const minTouchSize = 48;

export const spacing = { small: 8, medium: 16, large: 24 } as const;

/** Colours for the phone's current light/dark setting. */
export function useTheme(): Colors {
  return useColorScheme() === 'dark' ? darkColors : lightColors;
}
