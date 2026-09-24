import { darkColors, lightColors, minTouchSize, type Colors } from '../../src/ui/theme';

// WCAG 2.2 relative luminance and contrast ratio.
function luminance(hex: string): number {
  const [r, g, b] = [1, 3, 5].map((i) => {
    const c = parseInt(hex.slice(i, i + 2), 16) / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contrast(a: string, b: string): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

// Every text colour and the background it is drawn on.
const pairs: [keyof Colors, keyof Colors][] = [
  ['text', 'background'],
  ['mutedText', 'background'],
  ['accent', 'background'],
  ['warningText', 'warningBackground'],
  ['buttonText', 'buttonBackground'],
];

describe.each([
  ['light', lightColors],
  ['dark', darkColors],
])('%s palette', (_name, colors) => {
  it.each(pairs)('%s on %s has contrast of at least 4.5:1 (FR-022)', (fg, bg) => {
    expect(contrast(colors[fg], colors[bg])).toBeGreaterThanOrEqual(4.5);
  });
});

it('touch targets are at least 48 (FR-023)', () => {
  expect(minTouchSize).toBeGreaterThanOrEqual(48);
});
