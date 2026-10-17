export const SAVE_STORAGE = {
  metadata: 'throne_of_mud_meta',
  activeSession: 'throne_of_mud_active_session',
  audioSettings: 'throne_of_mud_audio_settings',
  language: 'throne_of_mud_language',
  database: 'ThroneOfMudDB',
  databaseVersion: 1,
  store: 'saves',
  activeSave: 'active_save',
  hasSave: 'throne_of_mud_has_save',
  formatVersion: '0.8.2',
  autoSaveIntervalMs: 180_000,
  idleTimeoutMs: 3000,
} as const;
