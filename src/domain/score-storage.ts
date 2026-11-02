/** SQL shared by the native repository and executable SQLite tests. */
export const SCORE_SCHEMA = 'CREATE TABLE IF NOT EXISTS scores (id TEXT PRIMARY KEY NOT NULL, name TEXT NOT NULL, score INTEGER NOT NULL, date INTEGER NOT NULL, settings TEXT NOT NULL, counts TEXT NOT NULL)';
export const INSERT_SCORE = 'INSERT OR IGNORE INTO scores (id, name, score, date, settings, counts) VALUES (?, ?, ?, ?, ?, ?)';
export type ScoreSort = 'name' | 'score' | 'date';
/** Only fixed column identifiers and directions enter SQL; user values are bound. */
export function scoreQuery(sort: ScoreSort, ascending: boolean) {
  const columns = { name: 'name COLLATE NOCASE', score: 'score', date: 'date' };
  const column = Object.hasOwn(columns, sort) ? columns[sort] : columns.date;
  return `SELECT * FROM scores ORDER BY ${column} ${ascending ? 'ASC' : 'DESC'}, date DESC, id ASC`;
}
export function playerName(name: string) {
  const trimmed = name.trim();
  if (!trimmed || trimmed.length > 30) throw new Error('Enter a name with 1–30 characters.');
  return trimmed;
}
