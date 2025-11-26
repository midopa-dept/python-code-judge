import fs from 'fs';
import path from 'path';
import { runIsolatedPython } from '../src/shared/utils/pythonExecutionEngine.js';

describe('pythonExecutionEngine', () => {
  const tempBase = path.join(process.cwd(), 'backend', 'judging-temp-test');

  afterEach(async () => {
    await fs.promises.rm(tempBase, { recursive: true, force: true });
  });

  test('표준 입력을 전달해 정상 실행되면 OK와 stdout을 반환한다', async () => {
    const code = `
n = int(input().strip())
print(n + 1)
`;
    const result = await runIsolatedPython({
      code,
      stdin: '5\n',
      timeLimitSeconds: 2,
      memoryLimitMB: 64,
      tempDir: tempBase,
      pythonExecutable: 'python',
    });

    expect(result.status).toBe('OK');
    expect(result.stdout.trim()).toBe('6');
    expect(result.timeMs).toBeGreaterThanOrEqual(0);
    expect(result.memoryBytes).toBeGreaterThanOrEqual(0);
  });

  test('무한 루프는 타임아웃(TLE)으로 종료된다', async () => {
    const code = `
while True:
    pass
`;
    const result = await runIsolatedPython({
      code,
      timeLimitSeconds: 1,
      memoryLimitMB: 64,
      tempDir: tempBase,
      pythonExecutable: 'python',
    });

    expect(result.status).toBe('TLE');
    expect(result.timeMs).toBeGreaterThanOrEqual(1000);
  });

  test('메모리 제한을 초과하면 MLE를 반환한다', async () => {
    const code = `
data = []
for _ in range(40):
    data.append('x' * 1024 * 1024)
print(len(data))
`;
    const result = await runIsolatedPython({
      code,
      timeLimitSeconds: 5,
      memoryLimitMB: 20,
      tempDir: tempBase,
      pythonExecutable: 'python',
    });

    expect(result.status).toBe('MLE');
  });

  test('임시 디렉토리는 실행 후 정리된다', async () => {
    const code = `print('cleanup')`;
    await runIsolatedPython({
      code,
      tempDir: tempBase,
      pythonExecutable: 'python',
    });

    const exists = fs.existsSync(tempBase);
    const entries = exists ? await fs.promises.readdir(tempBase) : [];
    expect(entries.length).toBe(0);
  });
});
