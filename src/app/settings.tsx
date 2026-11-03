import { router } from 'expo-router';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { GameSettings } from '@/domain/game';
import { useSettings } from '@/viewmodels/use-settings';
import { ui } from '@/theme/game';

type SettingOption = {
  key: keyof GameSettings;
  label: string;
  options: (string | number)[];
};

const settingOptions: SettingOption[] = [
  { key: 'mode', label: 'Stimuli', options: ['visual', 'auditory', 'dual'] },
  { key: 'n', label: 'Memory gap (n)', options: [1, 2, 3, 4, 5] },
  {
    key: 'eventDurationMs',
    label: 'Event duration (milliseconds)',
    options: [1000, 1500, 2000, 2500, 3000, 4000, 5000],
  },
  { key: 'eventCount', label: 'Events per round', options: [10, 20, 30, 50, 100] },
  { key: 'gridSize', label: 'Grid side length', options: [3, 5] },
  { key: 'letterCount', label: 'Distinct spoken letters', options: [4, 5, 6, 7, 8] },
];

export default function SettingsScreen() {
  const { settings, setSettings, loading, message, save } = useSettings();

  async function saveSettingsAndReturnHome() {
    const saved = await save();

    if (saved) {
      router.navigate('/');
    }
  }

  return (
    <SafeAreaView style={ui.screen} edges={['left', 'right', 'bottom']}>
      <ScrollView contentContainerStyle={ui.content}>
        <Text style={ui.title}>Your practice</Text>

        {settingOptions.map((setting) => (
          <View key={setting.key} style={ui.card}>
            <Text style={ui.heading}>{setting.label}</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
              {setting.options.map((option) => {
                const isSelected = settings[setting.key] === option;

                return (
                  <Pressable
                    key={option}
                    disabled={loading}
                    accessibilityRole="radio"
                    accessibilityState={{ checked: isSelected }}
                    accessibilityLabel={`${setting.label}: ${option}`}
                    onPress={() =>
                      setSettings({ ...settings, [setting.key]: option })
                    }
                    style={[
                      ui.button,
                      { minWidth: 48 },
                      !isSelected && ui.disabled,
                    ]}>
                    <Text style={ui.buttonText}>{option}</Text>
                  </Pressable>
                );
              })}
            </View>
          </View>
        ))}

        <Text style={ui.small}>
          Letters: C, H, K, L, Q, R, S, Y. Smaller sets use the first letters.
          Scores depend on round length and mode.
        </Text>

        <Pressable
          disabled={loading}
          accessibilityRole="button"
          style={[ui.button, loading && ui.disabled]}
          onPress={() => void saveSettingsAndReturnHome()}>
          <Text style={ui.buttonText}>
            {loading ? 'Loading…' : 'Save settings'}
          </Text>
        </Pressable>

        {message ? (
          <Text accessibilityRole="alert" style={ui.text}>
            {message}
          </Text>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}
