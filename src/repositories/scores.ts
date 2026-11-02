import { SCORE_SCHEMA, INSERT_SCORE, scoreQuery, playerName, type ScoreSort } from '@/domain/score-storage';
import * as SQLite from 'expo-sqlite';
import type { Counts, GameSettings } from '@/domain/game';
export type { ScoreSort } from '@/domain/score-storage';
export type ScoreRecord = { id: string; name: string; score: number; date: number; settings: string; counts: string };
let database: Promise<SQLite.SQLiteDatabase> | undefined;
/** Reuse a single connection; failed initialization can be retried. */
async function getDatabase() {
  if (!database) database = (async () => {
    const db = await SQLite.openDatabaseAsync('nback.db');
    await db.execAsync(SCORE_SCHEMA);
    return db;
  })().catch(error => { database = undefined; throw error; });
  return database;
}
export async function saveScore(id: string, name: string, score: number, settings: GameSettings, counts: Counts) {
  const trimmed = playerName(name);
  const db = await getDatabase();
  // The round identifier makes repeated save requests idempotent, even after a retry.
  await db.runAsync(INSERT_SCORE,
    id, trimmed, score, Date.now(), JSON.stringify(settings), JSON.stringify(counts));
}
export async function listScores(sort: ScoreSort, ascending: boolean): Promise<ScoreRecord[]> {
  const db = await getDatabase();
  return db.getAllAsync<ScoreRecord>(scoreQuery(sort, ascending));
}
