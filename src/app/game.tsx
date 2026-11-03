import { useState } from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { channelsFor, validateSettings } from '@/domain/game';
import { MatchButton } from '@/components/match-button';
import { VisualGrid } from '@/components/visual-grid';
import { useGame } from '@/viewmodels/use-game';
import { colors, ui } from '@/theme/game';

export default function GameScreen() {
  const params = useLocalSearchParams<{ config?: string }>();

  const [settings] = useState(() => {
    try {
      return validateSettings(JSON.parse(params.config ?? 'null'));
    } catch {
      return validateSettings(null);
    }
  });

  const game = useGame(settings);
  const [playerName, setPlayerName] = useState('');
  const { width, height, fontScale } = useWindowDimensions();
  const isWideLayout = width > height && width >= 700 && fontScale < 1.5;

  const { state } = game;
  const isRunning = state.status === 'running';
  const isWarmup = isRunning && state.eventIndex < settings.n;
  const currentEventNumber = Math.max(0, state.eventIndex + 1);
  const progressPercent = Math.max(
    0,
    (currentEventNumber / settings.eventCount) * 100,
  );
  const instruction = getInstruction(
    state.status,
    isWarmup,
    settings.n,
  );

  return (
    <SafeAreaView
      style={ui.screen}
      edges={['left', 'right', 'bottom']}>
      <ScrollView
        contentContainerStyle={[
          ui.content,
          isWideLayout && { maxWidth: 1040 },
        ]}>
        <RoundHeading settings={settings} />

        <GameHud
          currentEventNumber={currentEventNumber}
          eventCount={settings.eventCount}
          correctResponses={state.counts.hits}
          score={game.score}
        />

        <ProgressBar progressPercent={progressPercent} />

        <Text style={[ui.heading, styles.instruction]}>
          {instruction}
        </Text>

        <View
          style={[
            styles.gameColumns,
            isWideLayout ? styles.wideColumns : styles.narrowColumns,
          ]}>
          <StimulusPanel
            isWideLayout={isWideLayout}
            mode={settings.mode}
            gridSize={settings.gridSize}
            n={settings.n}
            isRunning={isRunning}
            activeCell={game.stimulus?.visual}
            eventIndex={state.eventIndex}
          />

          <View style={[styles.controlsColumn, !isWideLayout && styles.stackedColumn]}>
            {state.status === 'finished' ? (
              <RoundSummary
                score={game.score}
                counts={state.counts}
                playerName={playerName}
                onPlayerNameChange={setPlayerName}
                saved={game.saved}
                saving={game.savingScore}
                saveMessage={game.saveMessage}
                onSave={() => void game.save(playerName)}
              />
            ) : (
              <ActiveRoundControls
                mode={settings.mode}
                isRunning={isRunning}
                isWarmup={isWarmup}
                n={settings.n}
                responded={state.responded}
                feedback={game.feedback}
                onMatch={game.press}
              />
            )}

            {game.message ? (
              <Text accessibilityRole="alert" style={ui.text}>
                {game.message}
              </Text>
            ) : null}

            {!isRunning ? (
              <StartButton
                status={state.status}
                preparing={game.preparing}
                disabled={game.preparing || game.savingScore}
                onPress={() => void game.start()}
              />
            ) : null}
          </View>
        </View>

        <ReturnHomeButton isRunning={isRunning} />
      </ScrollView>
    </SafeAreaView>
  );
}

type RoundSettings = {
  mode: 'visual' | 'auditory' | 'dual';
  n: number;
  eventDurationMs: number;
  eventCount: number;
  gridSize: number;
};

function RoundHeading({ settings }: { settings: RoundSettings }) {
  return (
    <View style={ui.row}>
      <Text style={ui.eyebrow}>
        {settings.mode.toUpperCase()} · {settings.n}-BACK
      </Text>
      <Text style={ui.small}>
        {settings.eventDurationMs / 1000}s / event
      </Text>
    </View>
  );
}

function GameHud({
  currentEventNumber,
  eventCount,
  correctResponses,
  score,
}: {
  currentEventNumber: number;
  eventCount: number;
  correctResponses: number;
  score: number;
}) {
  return (
    <View style={ui.row}>
      <HudValue label="Event" value={`${currentEventNumber} / ${eventCount}`} />
      <HudValue label="Correct responses" value={String(correctResponses)} />
      <HudValue label="Score" value={String(score)} />
    </View>
  );
}

function HudValue({ label, value }: { label: string; value: string }) {
  return (
    <View>
      <Text style={ui.small}>{label}</Text>
      <Text style={ui.heading}>{value}</Text>
    </View>
  );
}

function ProgressBar({ progressPercent }: { progressPercent: number }) {
  return (
    <View style={styles.progressTrack}>
      <View
        style={[styles.progressFill, { width: `${progressPercent}%` }]}
      />
    </View>
  );
}

function getInstruction(
  status: 'idle' | 'running' | 'finished',
  isWarmup: boolean,
  n: number,
) {
  if (status === 'finished') return 'Round complete. Well done.';
  if (isWarmup) return 'Watch and remember';
  if (status === 'running') return `Does it match ${n} events ago?`;
  return 'Find your focus';
}

function StimulusPanel({
  isWideLayout,
  mode,
  gridSize,
  n,
  isRunning,
  activeCell,
  eventIndex,
}: {
  isWideLayout: boolean;
  mode: RoundSettings['mode'];
  gridSize: number;
  n: number;
  isRunning: boolean;
  activeCell?: number;
  eventIndex: number;
}) {
  return (
    <View style={[styles.stimulusColumn, !isWideLayout && styles.stackedColumn]}>
      {mode !== 'auditory' ? (
        <VisualGrid
          gridSize={gridSize}
          activeCell={activeCell}
          eventIndex={eventIndex}
        />
      ) : (
        <View style={styles.audioPanel}>
          <Text style={styles.audioNote}>♪</Text>
          <Text style={ui.heading}>
            {isRunning ? 'Listen to the letter' : 'A moment to listen'}
          </Text>
          <Text style={ui.text}>Keep the last {n} letters in mind.</Text>
        </View>
      )}

      {mode !== 'visual' ? (
        <Text style={[ui.small, styles.audioHint]}>
          Audio on · English letters · turn off silent mode on iPhone
        </Text>
      ) : null}
    </View>
  );
}

type MatchFeedback = {
  channel: 'visual' | 'auditory';
  correct: boolean;
  id: number;
} | null;

function ActiveRoundControls({
  mode,
  isRunning,
  isWarmup,
  n,
  responded,
  feedback,
  onMatch,
}: {
  mode: RoundSettings['mode'];
  isRunning: boolean;
  isWarmup: boolean;
  n: number;
  responded: Partial<Record<'visual' | 'auditory', boolean>>;
  feedback: MatchFeedback;
  onMatch: (channel: 'visual' | 'auditory') => void;
}) {
  let statusText = 'Press Start when you’re ready. No timer or audio runs until then.';
  if (isWarmup) statusText = `Warm-up · match buttons unlock after event ${n}.`;
  else if (isRunning) statusText = 'One response per stream, per event.';

  return (
    <>
      <Text style={[ui.small, styles.centeredText]}>{statusText}</Text>
      <View style={styles.matchButtons}>
        {channelsFor(mode).map((channel) => (
          <MatchButton
            key={channel}
            channel={channel}
            disabled={!isRunning || isWarmup}
            responded={!!responded[channel]}
            feedback={feedback}
            onPress={() => onMatch(channel)}
          />
        ))}
      </View>
    </>
  );
}

function RoundSummary({
  score,
  counts,
  playerName,
  onPlayerNameChange,
  saved,
  saving,
  saveMessage,
  onSave,
}: {
  score: number;
  counts: { hits: number; misses: number; falseAlarms: number; correctRejections: number };
  playerName: string;
  onPlayerNameChange: (name: string) => void;
  saved: boolean;
  saving: boolean;
  saveMessage: string;
  onSave: () => void;
}) {
  const saveDisabled = saved || saving || !playerName.trim();
  let saveButtonLabel = 'Save score';
  if (saved) saveButtonLabel = 'Saved';
  else if (saving) saveButtonLabel = 'Saving…';

  return (
    <View style={ui.card}>
      <Text style={ui.eyebrow}>YOUR ROUND</Text>
      <Text style={ui.title}>{score} points</Text>
      <Text style={ui.text}>
        {counts.hits} hits · {counts.misses} misses · {counts.falseAlarms} false alarms
      </Text>
      <Text style={ui.small}>
        +100 per hit, −50 per miss or false alarm. Minimum 0.
      </Text>
      <Text style={ui.small}>
        {counts.correctRejections} correct rejections
      </Text>

      <Text style={ui.text}>Save this round under your name</Text>
      <TextInput
        accessibilityLabel="Player name"
        placeholder="Your name"
        placeholderTextColor={colors.muted}
        maxLength={30}
        value={playerName}
        onChangeText={onPlayerNameChange}
        editable={!saved && !saving}
        style={styles.nameInput}
      />
      <Pressable
        accessibilityRole="button"
        disabled={saveDisabled}
        style={[ui.button, saveDisabled && ui.disabled]}
        onPress={onSave}>
        <Text style={ui.buttonText}>{saveButtonLabel}</Text>
      </Pressable>

      {saveMessage ? (
        <Text accessibilityRole="alert" style={ui.text}>
          {saveMessage}
        </Text>
      ) : null}
    </View>
  );
}

function StartButton({
  status,
  preparing,
  disabled,
  onPress,
}: {
  status: 'idle' | 'running' | 'finished';
  preparing: boolean;
  disabled: boolean;
  onPress: () => void;
}) {
  let label = 'Start round →';
  if (preparing) label = 'Preparing audio…';
  else if (status === 'finished') label = 'Play again →';

  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      style={({ pressed }) => [
        ui.button,
        disabled && ui.disabled,
        pressed && ui.pressed,
      ]}
      onPress={onPress}>
      <Text style={ui.buttonText}>{label}</Text>
    </Pressable>
  );
}

function ReturnHomeButton({ isRunning }: { isRunning: boolean }) {
  const label = isRunning ? 'End round & return home' : 'Return home';

  return (
    <Pressable
      accessibilityRole="button"
      style={styles.homeButton}
      onPress={() => router.navigate('/')}>
      <Text style={[ui.text, styles.centeredText]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  gameColumns: {
    gap: 24,
    alignItems: 'stretch',
  },
  wideColumns: {
    flexDirection: 'row',
  },
  narrowColumns: {
    flexDirection: 'column',
  },
  stimulusColumn: {
    flex: 1,
    minWidth: 0,
  },
  controlsColumn: {
    minWidth: 0,
    gap: 16,
  },
  stackedColumn: {
    flex: 0,
  },
  progressTrack: {
    height: 5,
    backgroundColor: colors.line,
    borderRadius: 5,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.accent,
  },
  instruction: {
    textAlign: 'center',
  },
  centeredText: {
    textAlign: 'center',
  },
  matchButtons: {
    gap: 8,
  },
  audioPanel: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 240,
    backgroundColor: colors.soft,
    borderRadius: 26,
    gap: 12,
  },
  audioNote: {
    color: colors.accent,
    fontSize: 90,
  },
  audioHint: {
    textAlign: 'center',
  },
  nameInput: {
    color: colors.ink,
    borderColor: colors.line,
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    minHeight: 48,
  },
  homeButton: {
    minHeight: 48,
    justifyContent: 'center',
  },
});
