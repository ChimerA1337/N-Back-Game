import { FlatList, Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useHistory } from '@/viewmodels/use-history';
import { ui } from '@/theme/game';
export default function HistoryScreen() {
  const history = useHistory();
  return <SafeAreaView style={ui.screen} edges={['left', 'right', 'bottom']}><FlatList contentContainerStyle={ui.content} data={history.scores} keyExtractor={item => item.id}
    ListHeaderComponent={<View style={{ gap: 16 }}><Text style={ui.title}>Score history</Text><Text style={ui.small}>Sort by name, score, or date. Tap again to reverse.</Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>{(['name', 'score', 'date'] as const).map(sort => <Pressable key={sort} accessibilityRole="button" onPress={() => history.chooseSort(sort)} style={ui.button}><Text style={ui.buttonText}>{sort}{history.sort === sort ? history.ascending ? ' ↑' : ' ↓' : ''}</Text></Pressable>)}</View>
      {history.error ? <><Text accessibilityRole="alert" style={ui.text}>{history.error}</Text><Pressable accessibilityRole="button" style={ui.button} onPress={history.reload}><Text style={ui.buttonText}>Retry</Text></Pressable></> : null}
      {history.loading ? <Text style={ui.text}>Loading scores…</Text> : null}</View>}
    ListEmptyComponent={!history.loading && !history.error ? <Text style={ui.text}>No saved rounds yet. Finish a round and save your name.</Text> : undefined}
    renderItem={({ item }) => { const settings = JSON.parse(item.settings); return <View style={ui.card}><Text style={ui.heading}>{item.name} · {item.score} points</Text><Text style={ui.text}>{settings.mode} · {settings.n}-back · {settings.eventCount} events</Text><Text style={ui.small}>{new Date(item.date).toLocaleString()}</Text></View>; }}
  /></SafeAreaView>;
}
