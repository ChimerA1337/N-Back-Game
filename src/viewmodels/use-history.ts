import { useCallback, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import { listScores, type ScoreRecord, type ScoreSort } from '@/repositories/scores';
export function useHistory() {
  const [scores, setScores] = useState<ScoreRecord[]>([]);
  const [request, setRequest] = useState<{ sort: ScoreSort; ascending: boolean }>({ sort: 'date', ascending: false });
  const { sort, ascending } = request;
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  useFocusEffect(useCallback(() => {
    let active = true;
    void listScores(request.sort, request.ascending).then(rows => { if (active) { setScores(rows); setError(''); } })
      .catch(() => { if (active) setError('Score history could not be loaded.'); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [request]));
  return { scores, sort, ascending, loading, error, reload: () => { setLoading(true); setRequest(value => ({ ...value })); },
    chooseSort: (value: ScoreSort) => { setLoading(true); setRequest({ sort: value, ascending: value === sort ? !ascending : value === 'name' }); } };
}
