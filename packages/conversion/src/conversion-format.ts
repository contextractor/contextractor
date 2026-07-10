/** The output formats this package can produce from one cleaned-HTML string. */
export type ConversionFormat = 'txt' | 'markdown' | 'json' | 'html';

const CONVERSION_FORMATS = new Set<string>(['txt', 'markdown', 'json', 'html']);

/** Runtime guard: is `value` a {@link ConversionFormat}? */
export function isConversionFormat(value: string): value is ConversionFormat {
  return CONVERSION_FORMATS.has(value);
}
