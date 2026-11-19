import { beforeEach, describe, expect, it, vi } from 'vitest';
const store = vi.hoisted(() => ({ tables: {} as Record<string, Record<string, unknown>[]>, stats: [] as Record<string, unknown>[] }));
vi.mock('../src/lib/supabase', () => ({ supabase: {
  from(table: string) {
    const filters: ((row: Record<string, unknown>) => boolean)[] = [];
    const query = {
      select: () => query,
      order: () => query,
      eq(key: string, value: unknown) { filters.push(row => row[key] === value); return query; },
      in(key: string, values: unknown[]) { filters.push(row => values.includes(row[key])); return query; },
      then(resolve: (result: {data: Record<string, unknown>[]; error: null}) => unknown) {
        return Promise.resolve(resolve({data: (store.tables[table] ?? []).filter(row => filters.every(filter => filter(row))), error: null}));
      },
    };
    return query;
  },
  rpc: vi.fn(async () => ({ data: store.stats, error: null })),
} }));
import { getVotedDemands, listDemands } from '../src/lib/demands';

beforeEach(() => {
  store.tables = {
    demands: [
      {id: 'own', user_id: 'alice', title: 'Own post', area: '水戸駅周辺', category: '飲食', description: 'Reason', created_at: '2026-11-11T00:00:00Z'},
      {id: 'other', user_id: 'bob', title: 'Other post', area: '水戸駅周辺', category: '飲食', description: 'Reason', created_at: '2026-11-10T00:00:00Z'},
    ],
    profiles: [{id: 'alice', display_name: 'Alice'}, {id: 'bob', display_name: 'Bob'}],
    votes: [{demand_id: 'other', user_id: 'alice'}],
  };
  store.stats = [{demand_id: 'own', supporter_count: 0, price_counts: {}, frequency_counts: {}}, {demand_id: 'other', supporter_count: 3, price_counts: {'〜500円': 3}, frequency_counts: {'週に1回': 3}}];
});

describe('公開一覧と個人履歴の分離', () => {
  it('ログイン中でも他の投稿者の需要を表示し、自分の賛同状態を付ける', async () => {
    const result = await listDemands({ viewerId: 'alice' });
    expect(result.map(row => row.id)).toEqual(['own', 'other']);
    expect(result.find(row => row.id === 'other')?.hasVoted).toBe(true);
  });
  it('自分の投稿一覧だけを明示的に絞り込む', async () => {
    expect((await listDemands({ authorId: 'alice', viewerId: 'alice' })).map(row => row.id)).toEqual(['own']);
  });
  it('賛同履歴に他のユーザーが投稿した需要が含まれる', async () => {
    const result = await getVotedDemands('alice');
    expect(result.map(row => row.id)).toEqual(['other']);
    expect(result[0].hasVoted).toBe(true);
  });
  it('未ログインでも人気順に表示できる', async () => {
    const result = await listDemands({ sort: 'popular' });
    expect(result.map(row => row.id)).toEqual(['other', 'own']);
    expect(result.every(row => !row.hasVoted)).toBe(true);
  });
});
