/** Only real HTTPS URLs on this exact host are trusted to open automatically. */
export function classifyQR(value: string): { kind: 'slonig' | 'other' | 'not-url'; url?: string } {
  const raw = value.trim();
  if (!/^https?:\/\//i.test(raw)) return { kind: 'not-url' };
  try {
    const url = new URL(raw);
    if (!['https:', 'http:'].includes(url.protocol) || !url.hostname) return { kind: 'not-url' };
    // Reject embedded credentials, including misleading user@host tricks.
    if (url.username || url.password) return { kind: 'not-url' };
    if (url.protocol === 'https:' && url.hostname.toLowerCase() === 'app.slonig.org' && (url.port === '' || url.port === '443')) {
      return { kind: 'slonig', url: url.href };
    }
    return { kind: 'other', url: url.href };
  } catch { return { kind: 'not-url' }; }
}
