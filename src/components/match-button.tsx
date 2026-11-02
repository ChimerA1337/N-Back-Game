import { useEffect, useState } from 'react';
import { AccessibilityInfo, Animated, Pressable, Text } from 'react-native';
import type { Channel } from '@/domain/game';
import { colors, ui } from '@/theme/game';

/** Gentle opacity pulse plus a text cue; reduced-motion users get the cue alone. */
export function MatchButton({ channel, disabled, responded, feedback, onPress }: {
  channel: Channel; disabled: boolean; responded: boolean;
  feedback: { channel: Channel; correct: boolean; id: number } | null; onPress: () => void;
}) {
  const [opacity] = useState(() => new Animated.Value(1));
  const [reducedMotion, setReducedMotion] = useState(true);
  useEffect(() => {
    let mounted = true;
    void AccessibilityInfo.isReduceMotionEnabled().then((value) => { if (mounted) setReducedMotion(value); }).catch(() => {});
    const listener = AccessibilityInfo.addEventListener('reduceMotionChanged', setReducedMotion);
    return () => { mounted = false; listener.remove(); };
  }, []);
  useEffect(() => {
    if (feedback?.channel !== channel || feedback.correct || reducedMotion) return;
    const animation = Animated.sequence([
      Animated.timing(opacity, { toValue: 0.45, duration: 130, useNativeDriver: true }),
      Animated.timing(opacity, { toValue: 1, duration: 220, useNativeDriver: true }),
    ]);
    animation.start();
    return () => { animation.stop(); opacity.setValue(1); };
  }, [feedback, channel, opacity, reducedMotion]);
  const cue = feedback?.channel === channel ? (feedback.correct ? 'Match found ✓' : 'No match this time') : null;
  return <Animated.View style={{ opacity, gap: 8 }}>
    <Pressable accessibilityRole="button" accessibilityLabel={`${channel === 'visual' ? 'Visual' : 'Audio'} match`} accessibilityState={{ disabled: disabled || responded }} disabled={disabled || responded} onPress={onPress} style={({ pressed }) => [ui.button, disabled && ui.disabled, responded && { backgroundColor: colors.responded }, pressed && ui.pressed]}>
      <Text style={ui.buttonText}>{channel === 'visual' ? 'Visual' : 'Audio'} Match</Text>
    </Pressable><Text accessibilityLiveRegion="polite" style={[ui.small, { textAlign: 'center', minHeight: 20 }]}>{cue ?? (responded ? 'Response recorded' : ' ')}</Text>
  </Animated.View>;
}
