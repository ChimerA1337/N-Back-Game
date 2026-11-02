import { useCallback, useState } from 'react';
import { router, useFocusEffect } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { type Mode } from '@/domain/game';
import { useSettings } from '@/viewmodels/use-settings';
import { loadHighScore } from '@/repositories/high-score';
import { colors, ui } from '@/theme/game';

const modes: { value: Mode; label: string; hint: string; symbol: string }[] = [
  { value: 'visual', label: 'Visual', hint: 'Remember positions', symbol: '▦' },
  { value: 'auditory', label: 'Auditory', hint: 'Remember letters', symbol: '♪' },
  { value: 'dual', label: 'Dual', hint: 'Track both together', symbol: '◎' },
];
export default function HomeScreen() {
  const { settings, setSettings, loading, message, save } = useSettings();
  const mode = settings.mode;
  const setMode = (mode: Mode) => setSettings({ ...settings, mode });
  const [highScore, setHighScore] = useState<number | null>(null);
  const [error, setError] = useState('');
  useFocusEffect(useCallback(() => {
    let active = true;
    void loadHighScore().then((score) => { if (active) { setHighScore(score); setError(''); } })
      .catch(() => { if (active) setError('Saved high score is unavailable. You can still play.'); });
    return () => { active = false; };
  }, []));
  return <SafeAreaView style={ui.screen}><ScrollView contentContainerStyle={ui.content}>
    <View style={styles.brand}><Text style={ui.eyebrow}>WORKING MEMORY · N-BACK</Text><Text style={styles.mark}>n.</Text></View>
    <View style={{ gap: 12 }}><Text style={ui.title}>A little focus.{'\n'}A stronger memory.</Text><Text style={ui.text}>Watch. Listen. Remember what came before.</Text></View>
    <View style={[ui.card, ui.row]}><View><Text style={ui.eyebrow}>PERSONAL BEST</Text><Text style={styles.score}>{highScore === null ? '—' : highScore.toLocaleString()}</Text></View><Text style={styles.star}>✧</Text></View>
    {error ? <Text accessibilityRole="alert" style={ui.small}>{error}</Text> : null}
    <View style={{ gap: 12 }}><Text style={ui.heading}>Choose your focus</Text>{modes.map((item) => <Pressable key={item.value} accessibilityRole="radio" accessibilityState={{ checked: mode === item.value }} onPress={() => setMode(item.value)} style={({ pressed }) => [styles.mode, mode === item.value && styles.selected, pressed && ui.pressed]}>
      <Text style={styles.symbol}>{item.symbol}</Text><View style={{ flex: 1 }}><Text style={styles.label}>{item.label}</Text><Text style={ui.small}>{item.hint}</Text></View><Text style={styles.radio}>{mode === item.value ? '●' : '○'}</Text>
    </Pressable>)}</View>
    <View style={ui.card}><Text style={ui.eyebrow}>THIS ROUND · {mode.toUpperCase()}</Text><View style={ui.row}>{[[`${settings.n}-back`, 'Memory gap'], [`${settings.eventDurationMs / 1000}s`, 'Per event'], [String(settings.eventCount), 'Events']].map(([value, label]) => <View key={label} style={{ gap: 4 }}><Text style={ui.heading}>{value}</Text><Text style={ui.small}>{label}</Text></View>)}</View></View>
    <Pressable accessibilityRole="button" style={({ pressed }) => [ui.button, pressed && ui.pressed]} disabled={loading} onPress={() => { void save(); router.push({ pathname: '/game', params: { config: JSON.stringify(settings) } }); }}><Text style={ui.buttonText}>Let’s practice →</Text></Pressable>
    <View style={ui.row}><Pressable accessibilityRole="button" style={ui.button} onPress={() => router.push('/settings')}><Text style={ui.buttonText}>Settings</Text></Pressable><Pressable accessibilityRole="button" style={ui.button} onPress={() => router.push('/history')}><Text style={ui.buttonText}>Score history</Text></Pressable></View>
    {message ? <Text style={ui.small}>{message}</Text> : null}
    <Text style={ui.small}>Tap Match when a position or spoken letter repeats from exactly {settings.n} events ago. The first {settings.n} events are for remembering. In Dual, respond to each stream separately.</Text>
  </ScrollView></SafeAreaView>;
}
const styles = StyleSheet.create({
  brand: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  mark: { fontSize: 44, fontWeight: '800', color: colors.accent },
  score: { fontSize: 38, fontWeight: '700', color: colors.ink, marginTop: 8 },
  star: { color: colors.accent, fontSize: 58 },
  mode: { flexDirection: 'row', alignItems: 'center', gap: 16, borderWidth: 1, borderColor: colors.line, borderRadius: 18, padding: 16, minHeight: 80 },
  selected: { borderColor: colors.accent, backgroundColor: colors.soft, borderWidth: 2, padding: 15 },
  symbol: { width: 36, textAlign: 'center', color: colors.accent, fontSize: 30 },
  label: { color: colors.ink, fontSize: 17, fontWeight: '600' },
  radio: { color: colors.accent, fontSize: 24 },
});
