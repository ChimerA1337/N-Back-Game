import { StyleSheet } from 'react-native';

// Defines css for various elements in the program.

export const colors = {
  background: '#101816',
  surface: '#1B2823',
  ink: '#ECF3ED',
  muted: '#ACBEB2',
  accent: '#A4D5AF',
  onAccent: '#14281B',
  soft: '#22352B',
  line: '#46604F',
  responded: '#789984',
};
export const ui = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { padding: 24, gap: 24, width: '100%', maxWidth: 560, alignSelf: 'center', flexGrow: 1 },
  eyebrow: { color: colors.accent, fontSize: 12, fontWeight: '700', letterSpacing: 2 },
  title: { color: colors.ink, fontSize: 42, fontWeight: '700', letterSpacing: -1.5 },
  heading: { color: colors.ink, fontSize: 22, fontWeight: '600' },
  text: { color: colors.muted, fontSize: 16, lineHeight: 24 },
  small: { color: colors.muted, fontSize: 13, lineHeight: 20 },
  card: { padding: 22, borderRadius: 24, backgroundColor: colors.surface, gap: 12, borderWidth: 1, borderColor: colors.line },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap' },
  button: { minHeight: 58, backgroundColor: colors.accent, borderRadius: 18, padding: 16, alignItems: 'center', justifyContent: 'center' },
  buttonText: { color: colors.onAccent, fontSize: 17, fontWeight: '600' },
  disabled: { opacity: 0.45 },
  pressed: { opacity: 0.75 },
});
