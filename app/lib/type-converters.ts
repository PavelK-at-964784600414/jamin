import { ThemeForm, ThemesTable } from './definitions';

/**
 * Converts a ThemeForm to a ThemesTable object
 */
export function themeFormToThemesTable(themeForm: ThemeForm): ThemesTable {
  return {
    id: themeForm.id,
    user_name: themeForm.user_name,
    title: themeForm.title,
    description: themeForm.description || '',
    seconds: themeForm.seconds,
    key: themeForm.keySignature,
    mode: themeForm.mode,
    chords: themeForm.chords,
    tempo: themeForm.tempo,
    instrument: themeForm.instrument,
    recording_url: themeForm.sample,
    date: themeForm.date.toISOString(),
    status: themeForm.status,
    image_url: '', // This needs to be provided from somewhere else
  };
}

/**
 * Converts a ThemesTable to a ThemeForm object
 */
export function themesTableToThemeForm(theme: ThemesTable): ThemeForm {
  return {
    id: theme.id,
    user_name: theme.user_name,
    title: theme.title,
    description: theme.description || '',
    seconds: theme.seconds,
    keySignature: theme.key,
    mode: theme.mode,
    chords: theme.chords,
    tempo: theme.tempo,
    instrument: theme.instrument,
    sample: theme.recording_url,
    date: new Date(theme.date),
    status: theme.status,
  };
}
