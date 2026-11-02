import { useEffect, useState } from 'react';
import { AccessibilityInfo, Animated, StyleSheet, View } from 'react-native';
import { colors } from '@/theme/game';

function CellHighlight({ reducedMotion }: { reducedMotion: boolean }) {
  const [opacity] = useState(() => new Animated.Value(reducedMotion ? 1 : 0));

  useEffect(() => {
    if (reducedMotion) {
      opacity.setValue(1);
      return;
    }
    const animation = Animated.timing(opacity, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    });
    animation.start();
    return () => animation.stop();
  }, [opacity, reducedMotion]);

  return <Animated.View pointerEvents="none" style={[styles.highlight, { opacity }]} />;
}

/** Explicit equal-sized rows keep empty cells visible without content-based sizing. */
export function VisualGrid({ activeCell, eventIndex, gridSize = 3 }: { activeCell?: number; eventIndex: number; gridSize?: number }) {
  const [reducedMotion, setReducedMotion] = useState(true);
  useEffect(() => {
    let mounted = true;
    void AccessibilityInfo.isReduceMotionEnabled()
      .then((value) => { if (mounted) setReducedMotion(value); })
      .catch(() => {});
    const subscription = AccessibilityInfo.addEventListener('reduceMotionChanged', setReducedMotion);
    return () => { mounted = false; subscription.remove(); };
  }, []);

  return (
    <View style={styles.grid} accessibilityLabel="Visual stimulus grid">
      {Array.from({ length: gridSize }, (_, i) => i).map((row) => (
        <View key={row} style={styles.row}>
          {Array.from({ length: gridSize }, (_, i) => i).map((column) => {
            const index = row * gridSize + column;
            const active = activeCell === index;
            return (
              <View
                key={column}
                style={styles.cell}
                accessible
                accessibilityLabel={`Row ${row + 1}, column ${column + 1}${active ? ', highlighted' : ''}`}>
                {/* A new event remounts the overlay even when its cell repeats. */}
                {active ? <CellHighlight key={eventIndex} reducedMotion={reducedMotion} /> : null}
              </View>
            );
          })}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {
    width: '100%',
    aspectRatio: 1,
    padding: 12,
    gap: 10,
    backgroundColor: colors.soft,
    borderRadius: 26,
  },
  row: { flex: 1, flexDirection: 'row', gap: 10, minHeight: 0 },
  cell: {
    flex: 1,
    minWidth: 0,
    borderRadius: 16,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.line,
  },
  highlight: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    borderRadius: 15,
    backgroundColor: colors.accent,
  },
});
