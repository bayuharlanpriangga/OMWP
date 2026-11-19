export function stripMarkup(text: string | null | undefined): string {
  return String(text || '')
    .replace(/\[{2,3}|\]{2,3}/g, '')
    .replace(/\*\*|\{\/?(?:s|m|l|xl)\}/g, '');
}
