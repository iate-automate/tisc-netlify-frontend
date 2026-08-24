import settingsJson from '../../config/settings.json';

export const settings = settingsJson;

/** Trim trailing slashes from Airtable API base URL */
export function airtableApiBase(): string {
  return settings.airtable.apiUrl.replace(/\/+$/, '');
}

export function airtableBaseId(which: 'main' | 'portal'): string {
  const id = which === 'portal' ? settings.airtable.basePortal : settings.airtable.baseMain;
  return id.replace(/\/+$/, '');
}
