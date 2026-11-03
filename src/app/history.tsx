import { FlatList, Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useHistory } from '@/viewmodels/use-history';
import { ui } from '@/theme/game';

export default function HistoryScreen() {
  const history = useHistory();

  const sortOptions = ['name', 'score', 'date'] as const;

  return (
    <SafeAreaView style={ui.screen} edges={['left', 'right', 'bottom']}>
      <FlatList
        contentContainerStyle={ui.content}
        data={history.scores}
        keyExtractor={(score) => score.id}
        ListHeaderComponent={
          <View style={{ gap: 16 }}>
            <Text style={ui.title}>Score history</Text>
            <Text style={ui.small}>
              Sort by name, score, or date. Tap again to reverse.
            </Text>

            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
              {sortOptions.map((sortOption) => {
                const isSelectedSort = history.sort === sortOption;
                const arrow = history.ascending ? ' ↑' : ' ↓';

                return (
                  <Pressable
                    key={sortOption}
                    accessibilityRole="button"
                    onPress={() => history.chooseSort(sortOption)}
                    style={ui.button}>
                    <Text style={ui.buttonText}>
                      {sortOption}
                      {isSelectedSort ? arrow : ''}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            {history.error ? (
              <View style={{ gap: 8 }}>
                <Text accessibilityRole="alert" style={ui.text}>
                  {history.error}
                </Text>
                <Pressable
                  accessibilityRole="button"
                  style={ui.button}
                  onPress={history.reload}>
                  <Text style={ui.buttonText}>Retry</Text>
                </Pressable>
              </View>
            ) : null}

            {history.loading ? (
              <Text style={ui.text}>Loading scores…</Text>
            ) : null}
          </View>
        }
        ListEmptyComponent={
          !history.loading && !history.error ? (
            <Text style={ui.text}>
              No saved rounds yet. Finish a round and save your name.
            </Text>
          ) : undefined
        }
        renderItem={({ item: score }) => {
          const settings = JSON.parse(score.settings);

          return (
            <View style={ui.card}>
              <Text style={ui.heading}>
                {score.name} · {score.score} points
              </Text>
              <Text style={ui.text}>
                {settings.mode} · {settings.n}-back · {settings.eventCount} events
              </Text>
              <Text style={ui.small}>
                {new Date(score.date).toLocaleString()}
              </Text>
            </View>
          );
        }}
      />
    </SafeAreaView>
  );
}
