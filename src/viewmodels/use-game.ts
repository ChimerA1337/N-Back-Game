import { useCallback, useRef, useState } from 'react';
import { AppState } from 'react-native';
import { useFocusEffect } from 'expo-router';
import * as Speech from 'expo-speech';
import { calculateScore, createStimuli, GameEngine, type GameSettings, type Channel, type Stimulus } from '@/domain/game';
import { saveScore } from '@/repositories/scores';
import { saveHighScore } from '@/repositories/high-score';

/** Owns timers and speech. Focus cleanup invalidates even pending async starts. */
export function useGame(settings: GameSettings) {
  const mode = settings.mode;
  const roundId = useRef('');
  const saving = useRef(false);
  const [saved, setSaved] = useState(false);
  const [savingScore, setSavingScore] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');
  const [initialEngine] = useState(() => new GameEngine(mode, createStimuli(Math.random, settings), settings.n));
  const engine = useRef(initialEngine);
  const [state, setState] = useState(() => initialEngine.snapshot());
  const [stimulus, setStimulus] = useState<Stimulus | null>(null);
  const [preparing, setPreparing] = useState(false);
  const [message, setMessage] = useState('');
  const [feedback, setFeedback] = useState<{ channel: Channel; correct: boolean; id: number } | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const generation = useRef(0);
  const starting = useRef(false);

  const publish = useCallback(() => {
    const snapshot = engine.current.snapshot();
    setState(snapshot);
    setStimulus(snapshot.status === 'running' ? engine.current.sequence[snapshot.eventIndex] : null);
  }, []);

  const stop = useCallback(() => {
    generation.current++;
    starting.current = false;
    if (timer.current !== null) clearTimeout(timer.current);
    timer.current = null;
    void Speech.stop().catch(() => {});
  }, []);

  useFocusEffect(useCallback(() => {
    const subscription = AppState.addEventListener('change', (next) => {
      if (next !== 'active') {
        const wasActive = engine.current.snapshot().status === 'running' || starting.current;
        stop();
        if (wasActive) {
          engine.current.cancel();
          publish();
          setMessage('Round cancelled when the app left the foreground. Start again when ready.');
        }
        setPreparing(false);
      }
    });
    return () => { subscription.remove(); stop(); engine.current.cancel(); };
  }, [stop, publish]));

  async function start() {
    if (saving.current || starting.current || engine.current.snapshot().status === 'running') return;
    stop();
    const token = generation.current;
    starting.current = true;
    setPreparing(true);
    setMessage('');
    setFeedback(null);
    setSaved(false); setSaveMessage('');
    roundId.current = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    try {
      let voice: string | undefined;
      if (mode !== 'visual') {
        const voices = await Speech.getAvailableVoicesAsync();
        if (token !== generation.current) return;
        voice = voices.find((item) => item.language.toLowerCase().startsWith('en'))?.identifier;
        if (!voice) throw new Error('No English speech voice is available. Enable one in device settings or choose Visual on Home.');
      }
      if (token !== generation.current) return;
      engine.current = new GameEngine(mode, createStimuli(Math.random, settings), settings.n);
      engine.current.start();
      publish();
      const output = async () => {
        if (token !== generation.current) return;
        const current = engine.current.snapshot();
        if (mode !== 'visual') {
          await Speech.stop();
          if (token !== generation.current) return;
          Speech.speak(engine.current.sequence[current.eventIndex].auditory, {
            language: 'en-US', voice, rate: 0.85,
            onError: () => {
              if (token !== generation.current) return;
              stop(); engine.current.cancel(); publish();
              setPreparing(false);
              setMessage('Speech failed. Check your device voice settings or play Visual mode.');
            },
          });
        }
        if (token !== generation.current) return;
        timer.current = setTimeout(() => {
          if (token !== generation.current) return;
          engine.current.advance();
          const next = engine.current.snapshot();
          publish();
          setFeedback(null);
          if (next.status === 'finished') {
            stop();
            const finishedGeneration = generation.current;
            void saveHighScore(calculateScore(next.counts)).catch(() => {
              if (finishedGeneration === generation.current) {
                setMessage('Round complete, but the high score could not be saved.');
              }
            });
          } else void output().catch(fail);
        }, settings.eventDurationMs);
      };
      const fail = () => {
        if (token !== generation.current) return;
        stop(); engine.current.cancel(); publish();
        setPreparing(false);
        setMessage('Could not play speech. Try Visual mode or check device settings.');
      };
      await output();
    } catch (error) {
      if (token !== generation.current) return;
      stop(); engine.current.cancel(); publish();
      setPreparing(false);
      setMessage(error instanceof Error ? error.message : 'Could not start the round.');
    } finally {
      if (token === generation.current) { starting.current = false; setPreparing(false); }
    }
  }
  function press(channel: Channel) {
    const result = engine.current.press(channel);
    if (result === 'ignored') return;
    publish();
    setFeedback({ channel, correct: result === 'hit', id: Date.now() });
  }
  async function save(name: string) {
    if (saving.current || saved || engine.current.snapshot().status !== 'finished') return;
    saving.current = true; setSavingScore(true); setSaveMessage('');
    try {
      const completed = engine.current.snapshot();
      await saveScore(roundId.current, name, calculateScore(completed.counts), settings, completed.counts);
      setSaved(true); setSaveMessage('Score saved. Find it in Score history.');
    } catch (error) { setSaveMessage(error instanceof Error ? error.message : 'Could not save score. Try again.'); }
    finally { saving.current = false; setSavingScore(false); }
  }
  return { state, stimulus, saved, savingScore, saveMessage, save,
    preparing, message, feedback, start, press, score: calculateScore(state.counts) };
}
