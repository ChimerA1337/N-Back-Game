import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

const KEY = 'nback.highscore.v1';
// Serialize reads/writes so two completed rounds cannot overwrite a higher score.
let queue: Promise<number> = Promise.resolve(0);
async function read(): Promise<number> {
  const raw = Platform.OS === 'web' ? globalThis.localStorage?.getItem(KEY) : await SecureStore.getItemAsync(KEY);
  const score = Number(raw);
  return Number.isFinite(score) && score >= 0 ? score : 0;
}
export async function loadHighScore() { await queue.catch(() => 0); return read(); }
export function saveHighScore(score: number): Promise<number> {
  queue = queue.catch(() => 0).then(async () => {
    const best = Math.max(await read(), score);
    if (Platform.OS === 'web') globalThis.localStorage?.setItem(KEY, String(best));
    else await SecureStore.setItemAsync(KEY, String(best));
    return best;
  });
  return queue;
}
