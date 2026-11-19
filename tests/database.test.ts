import { readFileSync } from 'node:fs';
import { PGlite } from '@electric-sql/pglite';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

const alice = '10000000-0000-4000-8000-000000000001';
const bob = '10000000-0000-4000-8000-000000000002';
const demandId = '20000000-0000-4000-8000-000000000001';
let db: PGlite;
const migration = readFileSync(new URL('../supabase/migrations/20261111000000_hoshii_mvp.sql', import.meta.url), 'utf8');

async function asRole<T>(role: 'anon' | 'authenticated', userId: string | null, action: () => Promise<T>) {
  await db.query("select set_config('request.jwt.claim.sub', $1, false)", [userId ?? '']);
  await db.exec(`set role ${role}`);
  try { return await action(); } finally { await db.exec('reset role'); }
}

beforeAll(async () => {
  db = new PGlite();
  // Local fixture models Supabase roles/auth.uid and the existing demands columns.
  // It does not replace verification against the hosted project after deployment.
  await db.exec(`
    create role anon;
    create role authenticated;
    create schema auth;
    grant usage on schema auth, public to anon, authenticated;
    create table auth.users(id uuid primary key, raw_user_meta_data jsonb default '{}');
    create function auth.uid() returns uuid language sql stable as
      $$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
    create table public.demands(
      id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id),
      author text not null, title text not null, area text not null, category text not null, description text not null,
      created_at timestamptz default now()
    );
    alter table public.demands enable row level security;
    create policy legacy_insert on public.demands for insert with check (true);
  `);
  await db.query('insert into auth.users(id) values ($1), ($2)', [alice, bob]);
  await db.query("insert into public.demands(id,user_id,author,title,area,category,description) values ($1,$2,'Alice','既存の需要','水戸駅周辺','飲食','理由')", [demandId, alice]);
  await db.exec(migration);
}, 30000);
afterAll(async () => { await db?.close(); });

describe('実際のSQLで所有権と集計を検証（ローカルDB）', () => {
  it('既存投稿を保持し、既存ユーザーのプロフィールを作成する。再適用もできる', async () => {
    await db.exec(migration);
    expect((await db.query('select id from public.demands')).rows).toHaveLength(1);
    expect((await db.query('select id from public.profiles')).rows).toHaveLength(2);
  });
  it('匿名ユーザーは閲覧でき、投稿や賛同はできない', async () => {
    await asRole('anon', null, async () => {
      expect((await db.query('select id from public.demands')).rows).toHaveLength(1);
      await expect(db.query("insert into public.demands(user_id,author,title,area,category,description) values ($1,'x','不正','水戸駅周辺','飲食','理由')", [alice])).rejects.toThrow();
      await expect(db.query("select public.submit_vote($1,'〜500円','週に1回',null)", [demandId])).rejects.toThrow();
    });
  });
  it('他人の投稿は更新・削除できず、他人になりすました投稿もできない', async () => {
    await asRole('authenticated', bob, async () => {
      expect((await db.query("update public.demands set title='不正変更' where id=$1 returning id", [demandId])).rows).toHaveLength(0);
      expect((await db.query('delete from public.demands where id=$1 returning id', [demandId])).rows).toHaveLength(0);
      await expect(db.query("insert into public.demands(user_id,author,title,area,category,description) values ($1,'x','不正','水戸駅周辺','飲食','理由')", [alice])).rejects.toThrow();
    });
  });
  it('所有者の投稿更新とプロフィール更新を許可する', async () => {
    await asRole('authenticated', alice, async () => {
      expect((await db.query("update public.demands set title='更新した需要' where id=$1 returning id", [demandId])).rows).toHaveLength(1);
      expect((await db.query("update public.profiles set display_name='Alice' where id=$1 returning id", [alice])).rows).toHaveLength(1);
      expect((await db.query("update public.profiles set display_name='不正' where id=$1 returning id", [bob])).rows).toHaveLength(0);
    });
  });
  it('アンケートなしの直接賛同登録を拒否する', async () => {
    await asRole('authenticated', bob, async () => {
      await expect(db.query('insert into public.votes(demand_id,user_id) values ($1,$2)', [demandId, bob])).rejects.toThrow();
      await expect(db.query("select public.submit_vote($1,'無効な価格','週に1回',null)", [demandId])).rejects.toThrow();
    });
    expect((await db.query('select id from public.votes')).rows).toHaveLength(0);
  });
  it('回答と賛同を同時保存し、同じユーザーの重複賛同を拒否する', async () => {
    await asRole('authenticated', bob, async () => {
      await db.query("select public.submit_vote($1,'〜500円','週に1回','任意コメント')", [demandId]);
      await expect(db.query("select public.submit_vote($1,'〜500円','週に1回',null)", [demandId])).rejects.toThrow();
      expect((await db.query('select demand_id from public.votes')).rows).toHaveLength(1);
    });
    expect((await db.query('select id from public.vote_answers')).rows).toHaveLength(1);
  });
  it('公開集計は実レコードを数え、他人の回答本文は非公開にする', async () => {
    await asRole('anon', null, async () => {
      const result = await db.query<{supporter_count:number;price_counts:object;frequency_counts:object}>('select * from public.get_demand_stats($1::uuid[])', [[demandId]]);
      expect(Number(result.rows[0].supporter_count)).toBe(1);
      expect(result.rows[0].price_counts).toEqual({'〜500円':1});
      expect(result.rows[0].frequency_counts).toEqual({'週に1回':1});
      await expect(db.query('select * from public.vote_answers')).rejects.toThrow();
    });
    await asRole('authenticated', alice, async () => {
      expect((await db.query('select * from public.vote_answers')).rows).toHaveLength(0);
    });
  });
  it('所有者でも空白タイトルや文字数超過をDBへ保存できない', async () => {
    await asRole('authenticated', alice, async () => {
      await expect(db.query("update public.demands set title='   ' where id=$1", [demandId])).rejects.toThrow();
      await expect(db.query('update public.demands set description=$1 where id=$2', ['a'.repeat(301), demandId])).rejects.toThrow();
    });
  });
  it('所有者が投稿を削除すると賛同と回答も削除される', async () => {
    await asRole('authenticated', alice, async () => {
      expect((await db.query('delete from public.demands where id=$1 returning id', [demandId])).rows).toHaveLength(1);
    });
    expect((await db.query('select id from public.votes')).rows).toHaveLength(0);
    expect((await db.query('select id from public.vote_answers')).rows).toHaveLength(0);
  });
});
