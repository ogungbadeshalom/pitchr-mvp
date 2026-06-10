export function getEmailConfig() {
  return {
    apiKey: process.env.ZEPTOMAIL_API_KEY || 'placeholder',
    from: process.env.ZEPTOMAIL_FROM || 'noreply@pitchr.ng',
    fromName: 'Pitchr',
  };
}
