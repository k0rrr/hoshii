import { expect, it } from 'vitest';
import { validateDemand, validateDisplayName } from '../src/lib/validation';
const valid = {title:'ジムが欲しい', area:'水戸駅周辺', category:'ジム', description:'夜に運動したい'};
it('新規投稿と編集で共通の入力制限を適用する', () => {
  expect(validateDemand({...valid, title:'  ジムが欲しい  '}).title).toBe(valid.title);
  for (const title of ['  ', 'a'.repeat(81)]) expect(() => validateDemand({...valid, title})).toThrow();
  for (const description of ['', 'a'.repeat(301)]) expect(() => validateDemand({...valid, description})).toThrow();
  expect(() => validateDemand({...valid, category:'無効'})).toThrow();
});
it('表示名は空白のみを許可しない', () => {
  expect(() => validateDisplayName('   ')).toThrow();
  expect(() => validateDisplayName('a'.repeat(41))).toThrow();
  expect(validateDisplayName('  みとさん  ')).toBe('みとさん');
});
