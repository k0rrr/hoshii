export type DemandInput = { title: string; area: string; category: string; description: string };
export function validateDemand(input: DemandInput): DemandInput {
  const value = Object.fromEntries(Object.entries(input).map(([key, text]) => [key, text.trim()])) as DemandInput;
  if (!value.title || value.title.length > 80) throw new Error('タイトルは1〜80文字で入力してください。');
  if (!value.description || value.description.length > 300) throw new Error('欲しい理由は1〜300文字で入力してください。');
  if (!value.area || value.area.length > 80) throw new Error('地域を選択してください。');
  if (!['飲食', 'カフェ', 'ジム', '買い物', 'その他'].includes(value.category)) throw new Error('カテゴリを選択してください。');
  return value;
}
export function validateDisplayName(input: string): string {
  const value = input.trim();
  if (!value || value.length > 40) throw new Error('表示名は1〜40文字で入力してください。');
  return value;
}
