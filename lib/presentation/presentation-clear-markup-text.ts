export function stripMarkup(text: string | null | undefined): string {
  return String(text || '')
    .replace(/\[{2,3}|\]{2,3}/g, '')
    .replace(/\*{2,3}|\{\/?(?:s|m|l|xl|i|u)\}/g, '')
    .replace(/__(.+?)__/g, '$1')
    .replace(/(^|[^\w*])\*([^\s*\n][^*\n]*?)\*(?=[^\w*]|$)/g, '$1$2');
}
