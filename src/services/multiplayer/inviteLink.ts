const APP_SCHEME = 'startupludo';

export function buildInviteLink(code: string): string {
  return `${APP_SCHEME}://join/${code.toUpperCase()}`;
}

export function buildShareMessage(code: string): string {
  const cleanCode = code.replace(/-/g, '').toUpperCase();
  return `Rejoins ma partie Startup Ludo !\n\nCode : ${cleanCode}\nLien direct : ${buildInviteLink(cleanCode)}`;
}
