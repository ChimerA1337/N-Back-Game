import assert from 'node:assert/strict';
import { test } from 'node:test';
import { GameEngine, generateSequence, createStimuli, calculateScore, SETTINGS, LETTERS } from '../src/domain/game.ts';

function seeded(seed) {
  return () => {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    return seed / 4294967296;
  };
}
const fixtures = [
  { visual: 0, auditory: 'C' }, { visual: 1, auditory: 'H' },
  { visual: 0, auditory: 'C' }, { visual: 2, auditory: 'K' },
];
const atFirstEligible = (mode = 'visual') => {
  const game = new GameEngine(mode, fixtures);
  game.start(); game.advance(); game.advance();
  return game;
};

test('generation returns exactly the requested number of valid stimuli', () => {
  const stimuli = createStimuli(seeded(42));
  assert.equal(stimuli.length, SETTINGS.eventCount);
  assert.ok(stimuli.every(({ visual, auditory }) => visual >= 0 && visual <= 8 && LETTERS.includes(auditory)));
  assert.deepEqual(stimuli, createStimuli(seeded(42)));
});

test('enforces 20–40% eligible matches across 100 seeds and n=1..5, without accidental matches', () => {
  for (let seed = 1; seed <= 100; seed++) {
    for (let n = 1; n <= 5; n++) {
      const sequence = generateSequence([0, 1, 2, 3, 4, 5, 6, 7, 8], 30, n, seeded(seed));
      const count = sequence.filter((value, index) => index >= n && value === sequence[index - n]).length;
      assert.equal(count, Math.round((30 - n) * 0.3));
      assert.ok(count / (30 - n) >= 0.2 && count / (30 - n) <= 0.4);
    }
  }
});

test('both dual streams enforce their own target match count', () => {
  const sequence = createStimuli(seeded(4));
  for (const channel of ['visual', 'auditory']) {
    const matches = sequence.filter((item, i) => i >= 2 && item[channel] === sequence[i - 2][channel]);
    assert.equal(matches.length, 8);
  }
});

test('invalid generator arguments are rejected', () => {
  assert.throws(() => generateSequence([0], 30, 2));
  assert.throws(() => generateSequence([0, 1], 2, 2));
  assert.throws(() => generateSequence([0, 1], 30, 0));
});

test('first n events are never matches and ignore presses, even with repeated values', () => {
  const game = new GameEngine('dual', Array.from({ length: 5 }, () => ({ visual: 0, auditory: 'C' })));
  game.start();
  for (let i = 0; i < 2; i++) {
    assert.equal(game.isMatch('visual'), false);
    assert.equal(game.isMatch('auditory'), false);
    assert.equal(game.press('visual'), 'ignored');
    assert.equal(game.press('auditory'), 'ignored');
    game.advance();
  }
  assert.deepEqual(game.snapshot().counts, { hits: 0, misses: 0, falseAlarms: 0, correctRejections: 0 });
});

test('presses before start and after finish are ignored', () => {
  const game = new GameEngine('visual', fixtures);
  assert.equal(game.press('visual'), 'ignored');
  game.start();
  for (let i = 0; i < fixtures.length; i++) game.advance();
  assert.equal(game.snapshot().status, 'finished');
  const before = game.snapshot();
  assert.equal(game.press('visual'), 'ignored');
  game.advance();
  assert.deepEqual(game.snapshot(), before);
});

test('double hit press is ignored synchronously and does not inflate score', () => {
  const game = atFirstEligible();
  assert.equal(game.press('visual'), 'hit');
  assert.equal(game.press('visual'), 'ignored');
  assert.equal(game.snapshot().counts.hits, 1);
  assert.equal(calculateScore(game.snapshot().counts), 100);
});

test('double false alarm is ignored; response guard resets on the next event', () => {
  const game = atFirstEligible();
  game.press('visual'); game.advance();
  assert.equal(game.press('visual'), 'falseAlarm');
  assert.equal(game.press('visual'), 'ignored');
  assert.equal(game.snapshot().counts.falseAlarms, 1);
  game.advance();
  assert.equal(game.snapshot().counts.misses, 0);
  assert.equal(game.snapshot().counts.correctRejections, 0);
});

test('dual response guards are independent; disabled channel is ignored in a single mode', () => {
  const game = atFirstEligible('dual');
  assert.equal(game.press('visual'), 'hit');
  assert.equal(game.press('auditory'), 'hit');
  assert.equal(game.press('visual'), 'ignored');
  assert.equal(game.press('auditory'), 'ignored');
  assert.equal(game.snapshot().counts.hits, 2);
  assert.equal(atFirstEligible().press('auditory'), 'ignored');
});

test('silent events count misses and correct rejections, including the final event exactly once', () => {
  const game = atFirstEligible('dual');
  game.advance();
  assert.equal(game.snapshot().counts.misses, 2);
  assert.equal(game.snapshot().status, 'running');
  game.advance();
  assert.equal(game.snapshot().status, 'finished');
  assert.equal(game.snapshot().counts.correctRejections, 2);
  game.advance();
  assert.equal(game.snapshot().counts.correctRejections, 2);
});

test('the final matching stimulus accepts a response before finishing', () => {
  const game = new GameEngine('visual', fixtures.slice(0, 3));
  game.start(); game.advance(); game.advance();
  assert.equal(game.snapshot().status, 'running');
  assert.equal(game.press('visual'), 'hit');
  game.advance();
  assert.equal(game.snapshot().status, 'finished');
  assert.equal(game.snapshot().counts.hits, 1);
  assert.equal(game.snapshot().counts.misses, 0);
});

test('cancel prevents late ticks and presses; fresh restart resets counts', () => {
  const game = atFirstEligible(); game.press('visual'); game.cancel();
  game.advance();
  assert.equal(game.press('visual'), 'ignored');
  assert.equal(game.snapshot().status, 'idle');
  assert.equal(game.snapshot().eventIndex, -1);
  assert.equal(game.snapshot().counts.hits, 0);
  game.start();
  assert.equal(game.snapshot().eventIndex, 0);
});

test('snapshot consumers cannot mutate engine state', () => {
  const game = atFirstEligible(); const state = game.snapshot();
  state.counts.hits = 99; state.responded.visual = true;
  assert.equal(game.press('visual'), 'hit');
  assert.equal(game.snapshot().counts.hits, 1);
});

test('score formula rewards hits, penalizes misses/false alarms, and clamps at zero', () => {
  assert.equal(calculateScore({ hits: 4, misses: 1, falseAlarms: 1, correctRejections: 20 }), 300);
  assert.equal(calculateScore({ hits: 0, misses: 4, falseAlarms: 5, correctRejections: 0 }), 0);
});

test('settings validation accepts supported bounds and replaces corrupt storage', async () => {
  const { validateSettings, DEFAULT_SETTINGS } = await import('../src/domain/game.ts');
  for (const bad of [null, {}, { ...DEFAULT_SETTINGS, n: 0 }, { ...DEFAULT_SETTINGS, n: 6 },
    { ...DEFAULT_SETTINGS, eventCount: 9 }, { ...DEFAULT_SETTINGS, eventCount: 101 },
    { ...DEFAULT_SETTINGS, gridSize: 4 }, { ...DEFAULT_SETTINGS, mode: 'invalid' },
    { ...DEFAULT_SETTINGS, letterCount: 3 }, { ...DEFAULT_SETTINGS, eventDurationMs: 999 }]) {
    assert.deepEqual(validateSettings(bad), DEFAULT_SETTINGS);
  }
  const custom = { mode: 'dual', n: 5, eventCount: 10, eventDurationMs: 1000, gridSize: 5, letterCount: 4 };
  assert.deepEqual(validateSettings(custom), custom);
  const copy = validateSettings(custom); copy.n = 1;
  assert.equal(custom.n, 5);
});

test('custom settings drive both streams and preserve the match rate at all n/count limits', async () => {
  const { DEFAULT_SETTINGS } = await import('../src/domain/game.ts');
  for (const n of [1, 2, 3, 4, 5]) for (const eventCount of [10, 20, 30, 50, 100]) {
    const settings = { ...DEFAULT_SETTINGS, n, eventCount, gridSize: 5, letterCount: 4 };
    const sequence = createStimuli(seeded(42), settings);
    assert.equal(sequence.length, eventCount);
    assert.ok(sequence.every(s => s.visual >= 0 && s.visual < 25 && LETTERS.slice(0, 4).includes(s.auditory)));
    for (const channel of ['visual', 'auditory']) {
      const matches = sequence.filter((s, i) => i >= n && s[channel] === sequence[i - n][channel]).length;
      assert.ok(matches / (eventCount - n) >= 0.2 && matches / (eventCount - n) <= 0.4);
    }
  }
});

test('SQLite saves once per round, binds names safely, and sorts all columns in both directions', async () => {
  const { DatabaseSync } = await import('node:sqlite');
  const { SCORE_SCHEMA, INSERT_SCORE, scoreQuery, playerName } = await import('../src/domain/score-storage.ts');
  const db = new DatabaseSync(':memory:');
  try {
    db.exec(SCORE_SCHEMA);
    const insert = db.prepare(INSERT_SCORE);
    insert.run('a', playerName('  Zoe  '), 200, 10, '{}', '{}');
    insert.run('b', 'amy', 100, 30, '{}', '{}');
    insert.run('c', "O'Brien", 300, 20, '{}', '{}');
    insert.run('a', 'duplicate', 999, 40, '{}', '{}');
    for (const [sort, ids] of [['name', ['b', 'c', 'a']], ['score', ['b', 'a', 'c']], ['date', ['a', 'c', 'b']]]) {
      assert.deepEqual(db.prepare(scoreQuery(sort, true)).all().map(row => row.id), ids);
      assert.deepEqual(db.prepare(scoreQuery(sort, false)).all().map(row => row.id), [...ids].reverse());
    }
    assert.throws(() => playerName('   '));
    assert.throws(() => playerName('a'.repeat(31)));
    assert.equal(db.prepare(scoreQuery('date; DROP TABLE scores', true)).all().length, 3);
  } finally { db.close(); }
});
