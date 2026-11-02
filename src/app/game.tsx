import { useState } from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, useWindowDimensions, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { channelsFor, validateSettings } from '@/domain/game';
import { useGame } from '@/viewmodels/use-game';
import { MatchButton } from '@/components/match-button';
import { VisualGrid } from '@/components/visual-grid';
import { colors, ui } from '@/theme/game';

export default function GameScreen() {
  const params = useLocalSearchParams<{ config?: string }>();
  const [settings] = useState(() => { try { return validateSettings(JSON.parse(params.config ?? 'null')); } catch { return validateSettings(null); } });
  const mode = settings.mode;
  const game = useGame(settings);
  const [name, setName] = useState('');
  const { width, height, fontScale } = useWindowDimensions();
  const wide = width > height && width >= 700 && fontScale < 1.5;
  const { state } = game;
  const running = state.status === 'running';
  const warmup = running && state.eventIndex < settings.n;
  return <SafeAreaView style={ui.screen} edges={['left', 'right', 'bottom']}><ScrollView contentContainerStyle={[ui.content, wide && { maxWidth: 1040 }]}>
    <View style={ui.row}><Text style={ui.eyebrow}>{mode.toUpperCase()} · {settings.n}-BACK</Text><Text style={ui.small}>{settings.eventDurationMs / 1000}s / event</Text></View>
    <View style={ui.row}><View><Text style={ui.small}>Event</Text><Text style={ui.heading}>{Math.max(0, state.eventIndex + 1)} / {settings.eventCount}</Text></View><View><Text style={ui.small}>Correct responses</Text><Text style={ui.heading}>{state.counts.hits}</Text></View><View><Text style={ui.small}>Score</Text><Text style={ui.heading}>{game.score}</Text></View></View>
    <View style={styles.progress}><View style={[styles.progressFill, { width: `${Math.max(0, (state.eventIndex + 1) / settings.eventCount) * 100}%` }]} /></View>
    <Text style={[ui.heading, { textAlign: 'center' }]}>{state.status === 'finished' ? 'Round complete. Well done.' : warmup ? 'Watch and remember' : running ? `Does it match ${settings.n} events ago?` : 'Find your focus'}</Text>
    <View style={{ flexDirection: wide ? 'row' : 'column', gap: 24, alignItems: 'stretch' }}><View style={{ flex: wide ? 1 : undefined, minWidth: 0 }}>
    {mode !== 'auditory' ? <VisualGrid gridSize={settings.gridSize} activeCell={game.stimulus?.visual} eventIndex={state.eventIndex} /> : <View style={styles.audio}><Text style={styles.note}>♪</Text><Text style={ui.heading}>{running ? 'Listen to the letter' : 'A moment to listen'}</Text><Text style={ui.text}>Keep the last {settings.n} letters in mind.</Text></View>}
    {mode !== 'visual' ? <Text style={[ui.small, { textAlign: 'center' }]}>Audio on · English letters · turn off silent mode on iPhone</Text> : null}
    </View><View style={{ flex: wide ? 1 : undefined, minWidth: 0, gap: 16 }}>
    {state.status === 'finished' ? <View style={ui.card}><Text style={ui.eyebrow}>YOUR ROUND</Text><Text style={ui.title}>{game.score} points</Text><Text style={ui.text}>{state.counts.hits} hits · {state.counts.misses} misses · {state.counts.falseAlarms} false alarms</Text><Text style={ui.small}>+100 per hit, −50 per miss or false alarm. Minimum 0.</Text><Text style={ui.small}>{state.counts.correctRejections} correct rejections</Text>
      <Text style={ui.text}>Save this round under your name</Text><TextInput accessibilityLabel="Player name" placeholder="Your name" placeholderTextColor={colors.muted} maxLength={30} value={name} onChangeText={setName} editable={!game.saved && !game.savingScore} style={{ color: colors.ink, borderColor: colors.line, borderWidth: 1, borderRadius: 12, padding: 16, minHeight: 48 }} />
      <Pressable accessibilityRole="button" disabled={game.saved || game.savingScore || !name.trim()} style={[ui.button, (game.saved || game.savingScore || !name.trim()) && ui.disabled]} onPress={() => void game.save(name)}><Text style={ui.buttonText}>{game.saved ? 'Saved' : game.savingScore ? 'Saving…' : 'Save score'}</Text></Pressable>
      {game.saveMessage ? <Text accessibilityRole="alert" style={ui.text}>{game.saveMessage}</Text> : null}
    </View> : <>
      <Text style={[ui.small, { textAlign: 'center' }]}>{warmup ? `Warm-up · match buttons unlock after event ${settings.n}.` : running ? 'One response per stream, per event.' : 'Press Start when you’re ready. No timer or audio runs until then.'}</Text>
      <View style={{ gap: 8 }}>{channelsFor(mode).map((channel) => <MatchButton key={channel} channel={channel} disabled={!running || warmup} responded={!!state.responded[channel]} feedback={game.feedback} onPress={() => game.press(channel)} />)}</View>
    </>}
    {game.message ? <Text accessibilityRole="alert" style={ui.text}>{game.message}</Text> : null}
    {!running ? <Pressable accessibilityRole="button" disabled={game.preparing || game.savingScore} style={({ pressed }) => [ui.button, game.preparing && ui.disabled, pressed && ui.pressed]} onPress={() => void game.start()}><Text style={ui.buttonText}>{game.preparing ? 'Preparing audio…' : state.status === 'finished' ? 'Play again →' : 'Start round →'}</Text></Pressable> : null}
    </View></View>
    <Pressable accessibilityRole="button" style={styles.home} onPress={() => router.navigate('/')}><Text style={[ui.text, { textAlign: 'center' }]}>{running ? 'End round & return home' : 'Return home'}</Text></Pressable>
  </ScrollView></SafeAreaView>;
}
const styles = StyleSheet.create({
  progress: { height: 5, backgroundColor: colors.line, borderRadius: 5, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: colors.accent },
  audio: { alignItems: 'center', justifyContent: 'center', minHeight: 240, backgroundColor: colors.soft, borderRadius: 26, gap: 12 },
  note: { color: colors.accent, fontSize: 90 },
  home: { minHeight: 48, justifyContent: 'center' },
});
