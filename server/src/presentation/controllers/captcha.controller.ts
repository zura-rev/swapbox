import { Request, Response } from 'express';
import { randomUUID } from 'crypto';

const CATEGORIES = [
  { target: '🍎', pool: ['🍊','🍋','🍇','🍓','🍑','🫐','🍒','🥝','🍌','🍉'] },
  { target: '🚗', pool: ['🚕','🚙','🚌','🚎','🚑','🚓','✈️','🚢','🚲','🛵'] },
  { target: '⭐', pool: ['🌙','☀️','🌈','⚡','❄️','🌊','🔥','💨','🌀','🌤️'] },
  { target: '🐶', pool: ['🐱','🐭','🐹','🦊','🐻','🐼','🐨','🐯','🦁','🐸'] },
  { target: '🌸', pool: ['🌺','🌻','🌹','🌷','🌼','🪷','🌿','🍀','🍁','🌾'] },
  { target: '🎵', pool: ['🎸','🥁','🎹','🎺','🎻','🎤','🎧','🎼','🪗','🎷'] },
  { target: '🏠', pool: ['🏢','🏫','🏪','🏰','🏯','🗼','🏟️','🕌','🛖','🏕️'] },
  { target: '⚽', pool: ['🏀','🏈','⚾','🎾','🏐','🏉','🎱','🏓','🏸','🥊'] },
];

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

interface Entry { targetIndices: number[]; expiresAt: number; }
const store = new Map<string, Entry>();

function cleanup() {
  const now = Date.now();
  for (const [id, e] of store) { if (e.expiresAt < now) store.delete(id); }
}

export class CaptchaController {
  generate(_req: Request, res: Response) {
    cleanup();
    const cat = CATEGORIES[Math.floor(Math.random() * CATEGORIES.length)];
    // 3 targets + 6 distractors in 9 cells
    const distractors = shuffle(cat.pool).slice(0, 6);
    const cells = shuffle([cat.target, cat.target, cat.target, ...distractors]);
    const targetIndices = cells.reduce<number[]>((acc, c, i) => { if (c === cat.target) acc.push(i); return acc; }, []);

    const id = randomUUID();
    store.set(id, { targetIndices, expiresAt: Date.now() + 5 * 60 * 1000 });
    res.json({ id, target: cat.target, grid: cells });
  }

  validate(id: string, answer: string): boolean {
    const entry = store.get(id);
    if (!entry || entry.expiresAt < Date.now()) return false;
    try {
      const selected: number[] = JSON.parse(answer);
      const expected = entry.targetIndices.sort((a, b) => a - b);
      const got = [...selected].sort((a, b) => a - b);
      const valid = JSON.stringify(expected) === JSON.stringify(got);
      if (valid) store.delete(id);
      return valid;
    } catch { return false; }
  }
}
