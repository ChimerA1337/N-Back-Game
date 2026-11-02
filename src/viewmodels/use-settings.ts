import { useCallback, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import { DEFAULT_SETTINGS, type GameSettings } from '@/domain/game';
import { loadSettings, saveSettings } from '@/repositories/settings';
/** Reload on focus; serialize user changes through an explicit Save action. */
export function useSettings() {
  const [settings, setSettings] = useState<GameSettings>(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  useFocusEffect(useCallback(() => {
    let active = true;
    void loadSettings().then(value => { if (active) setSettings(value); })
      .catch(() => { if (active) setMessage('Settings could not be loaded. Defaults are shown.'); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []));
  async function save() {
    setLoading(true);
    try { await saveSettings(settings); setMessage('Settings saved. They apply to the next round.'); return true; }
    catch { setMessage('Could not save settings. Please try again.'); return false; }
    finally { setLoading(false); }
  }
  return { settings, setSettings, loading, message, save };
}
