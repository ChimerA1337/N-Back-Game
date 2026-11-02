import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { validateSettings, type GameSettings } from '@/domain/game';
const KEY = 'nback.settings.v1';
/** Small settings payload; native storage is asynchronous and encrypted. */
export async function loadSettings(): Promise<GameSettings> {
  const raw = Platform.OS === 'web' ? globalThis.localStorage?.getItem(KEY) : await SecureStore.getItemAsync(KEY);
  try { return validateSettings(raw ? JSON.parse(raw) : null); }
  catch { return validateSettings(null); }
}
export async function saveSettings(settings: GameSettings) {
  const raw = JSON.stringify(validateSettings(settings));
  if (Platform.OS === 'web') globalThis.localStorage.setItem(KEY, raw);
  else await SecureStore.setItemAsync(KEY, raw);
}
