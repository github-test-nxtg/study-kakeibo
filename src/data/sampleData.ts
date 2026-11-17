import type { Transaction, TransactionType } from '../types';
import { daysInMonth, shiftMonth, todayISO } from '../domain/dates';

/** 再現性のある乱数（同じ seed なら毎回同じサンプルになる） */
function mulberry32(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const FOOD_MEMOS = ['スーパー', 'コンビニ', 'ランチ', 'パン屋', 'ドラッグストアで食品', '外食（夕食）', 'カフェ', '八百屋'];
const DAILY_MEMOS = ['洗剤・ティッシュ', '100円ショップ', 'キッチン用品', '電球'];
const LEISURE_MEMOS = ['映画', '書籍', '動画配信サービス', 'ライブチケット', 'ボードゲーム', '美術館'];
const TRANSPORT_MEMOS = ['ICカードチャージ', 'バス', 'タクシー', '駐輪場'];

/**
 * 今月を含む直近 `months` か月分のサンプルデータを作る。
 * 今月は今日までの日付だけ。
 */
export function createSampleTransactions(months = 6, now: Date = new Date()): Transaction[] {
  const rand = mulberry32(20261116);
  const pick = <T,>(arr: readonly T[]) => arr[Math.floor(rand() * arr.length)];
  const between = (min: number, max: number, step = 10) => Math.round((min + rand() * (max - min)) / step) * step;

  const today = todayISO(now);
  const thisMonth = today.slice(0, 7);
  const items: Transaction[] = [];
  let seq = 0;

  const add = (type: TransactionType, date: string, categoryId: string, amount: number, memo: string) => {
    if (date > today) return;
    const stamp = `${date}T12:00:${String(seq % 60).padStart(2, '0')}.000Z`;
    items.push({ id: `sample-${++seq}`, type, date, categoryId, amount, memo, createdAt: stamp, updatedAt: stamp });
  };

  for (let i = months - 1; i >= 0; i--) {
    const month = shiftMonth(thisMonth, -i);
    const days = daysInMonth(month);
    const d = (day: number) => `${month}-${String(Math.min(day, days)).padStart(2, '0')}`;

    add('income', d(25), 'salary', 286_400, '月給');
    add('income', d(between(5, 12, 1)), 'side-job', between(15_000, 48_000, 1000), 'Webデザインの請負');
    if (rand() > 0.7) add('income', d(between(1, 28, 1)), 'other-income', between(1_000, 6_000, 100), 'フリマアプリの売上');

    add('expense', d(1), 'housing', 78_000, '家賃');
    add('expense', d(10), 'utility', between(4_200, 7_800), '電気代');
    add('expense', d(14), 'utility', between(2_800, 4_600), 'ガス代');
    if (Number(month.slice(5)) % 2 === 0) add('expense', d(18), 'utility', between(5_200, 6_400), '水道代（2か月分）');
    add('expense', d(27), 'telecom', 4_980, 'スマートフォン');
    add('expense', d(27), 'telecom', 5_280, '光回線');
    add('expense', d(1), 'leisure', 1_490, '動画配信サービス');

    for (let day = 1; day <= days; day++) {
      if (rand() < 0.62) add('expense', d(day), 'food', between(280, 3_600), pick(FOOD_MEMOS));
      if (rand() < 0.12) add('expense', d(day), 'transport', between(230, 2_400), pick(TRANSPORT_MEMOS));
      if (rand() < 0.08) add('expense', d(day), 'daily', between(300, 2_800), pick(DAILY_MEMOS));
      if (rand() < 0.07) add('expense', d(day), 'leisure', between(800, 7_500, 100), pick(LEISURE_MEMOS));
    }
    if (rand() > 0.5) add('expense', d(between(3, 26, 1)), 'clothing', between(2_900, 12_800, 100), pick(['シャツ', 'スニーカー', 'コート', '靴下']));
    if (rand() > 0.6) add('expense', d(between(3, 26, 1)), 'medical', between(1_200, 4_500), pick(['内科', '歯科', '処方薬']));
    if (rand() > 0.7) add('expense', d(between(3, 26, 1)), 'other-expense', between(3_000, 10_000, 500), pick(['ご祝儀の袋・切手', 'プレゼント', '町内会費']));
  }
  return items;
}
