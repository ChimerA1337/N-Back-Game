import { router } from 'expo-router';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useSettings } from '@/viewmodels/use-settings';
import { ui } from '@/theme/game';
import type { GameSettings } from '@/domain/game';
export default function SettingsScreen() {
  const { settings, setSettings, loading, message, save } = useSettings();
  const fields: { key: keyof GameSettings; label: string; options: (string | number)[] }[] = [
    { key: 'mode', label: 'Stimuli', options: ['visual', 'auditory', 'dual'] },
    { key: 'n', label: 'Memory gap (n)', options: [1, 2, 3, 4, 5] },
    { key: 'eventDurationMs', label: 'Event duration (milliseconds)', options: [1000, 1500, 2000, 2500, 3000, 4000, 5000] },
    { key: 'eventCount', label: 'Events per round', options: [10, 20, 30, 50, 100] },
    { key: 'gridSize', label: 'Grid side length', options: [3, 5] },
    { key: 'letterCount', label: 'Distinct spoken letters', options: [4, 5, 6, 7, 8] },
  ];
  return <SafeAreaView style={ui.screen} edges={['left', 'right', 'bottom']}><ScrollView contentContainerStyle={ui.content}>
    <Text style={ui.title}>Your practice</Text>
    {fields.map(field => <View key={field.key} style={ui.card}><Text style={ui.heading}>{field.label}</Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>{field.options.map(value => <Pressable key={value} disabled={loading} accessibilityRole="radio" accessibilityState={{ checked: settings[field.key] === value }} accessibilityLabel={`${field.label}: ${value}`} onPress={() => setSettings({ ...settings, [field.key]: value })} style={[ui.button, { minWidth: 48 }, settings[field.key] !== value && ui.disabled]}><Text style={ui.buttonText}>{value}</Text></Pressable>)}</View>
    </View>)}
    <Text style={ui.small}>Letters: C, H, K, L, Q, R, S, Y. Smaller sets use the first letters. Scores depend on round length and mode.</Text>
    <Pressable disabled={loading} accessibilityRole="button" style={[ui.button, loading && ui.disabled]} onPress={async () => { if (await save()) router.navigate('/'); }}><Text style={ui.buttonText}>{loading ? 'Loading…' : 'Save settings'}</Text></Pressable>
    {message ? <Text accessibilityRole="alert" style={ui.text}>{message}</Text> : null}
  </ScrollView></SafeAreaView>;
}
