export function formatBugReportsPrompt(bugs: string[]): string {
  const list = bugs
    .map((text, i) => `${i + 1}. ${text.replace(/\s*\n\s*/g, ' ')}`)
    .join('\n');
  return [
    'Agisci come sviluppatore Full-Stack Senior. Dobbiamo correggere immediatamente tutti i bug segnalati dagli utenti in Nutriplan PWA. Analizza e risolvi i seguenti problemi:',
    '',
    list,
    '',
    'Senza aggiungere nomi di chi li ha scritti, date o altre informazioni superflue.',
  ].join('\n');
}
