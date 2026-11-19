import { expect, it } from 'vitest';
import { RequestVersion } from '../src/lib/requestVersion';
it('地域変更後に古い通信が完了しても、新しい地域の結果を上書きしない', async () => {
  const requests = new RequestVersion();
  let displayed = '';
  let finishOld!: () => void;
  const old = requests.next();
  const slow = new Promise<void>(resolve => { finishOld = resolve; }).then(() => { if (old()) displayed = '古い地域'; });
  const latest = requests.next();
  await Promise.resolve().then(() => { if (latest()) displayed = '新しい地域'; });
  finishOld(); await slow;
  expect(displayed).toBe('新しい地域');
});
it('画面を離れた後に完了した通信を無効化する', () => {
  const requests = new RequestVersion();
  const pending = requests.next();
  requests.cancel();
  expect(pending()).toBe(false);
  expect(requests.next()()).toBe(true);
});
