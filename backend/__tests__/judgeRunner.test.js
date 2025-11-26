import { judgeSubmission } from '../src/shared/utils/judgeRunner.js';

const PY = 'python';
const baseOptions = {
  defaultTimeLimitSeconds: 2,
  defaultMemoryLimitMB: 64,
  pythonExecutable: PY,
};

describe('judgeRunner', () => {
  test('모든 테스트 케이스가 통과하면 AC를 반환한다', async () => {
    const code = `
n = int(input().strip())
print(n * 2)
`;
    const testCases = [
      { input: '2\n', expectedOutput: '4' },
      { input: '3\n', expectedOutput: '6   ' }, // trailing 공백 무시
    ];

    const result = await judgeSubmission({
      code,
      testCases,
      ...baseOptions,
    });

    expect(result.status).toBe('AC');
    expect(result.passedCount).toBe(2);
    expect(result.totalCount).toBe(2);
    expect(result.maxTimeMs).toBeGreaterThanOrEqual(0);
  });

  test('출력 불일치 시 WA를 반환하고 failFast로 중단한다', async () => {
    const code = `
print("hello")
`;
    const testCases = [
      { input: '', expectedOutput: 'hello' },
      { input: '', expectedOutput: 'world' },
    ];

    const result = await judgeSubmission({
      code,
      testCases,
      ...baseOptions,
      failFast: true,
    });

    expect(result.status).toBe('WA');
    expect(result.passedCount).toBe(1);
    expect(result.caseResults.length).toBe(2); // 두 번째도 실행 (WA 판정 후 종료)
  });

  test('failFast를 끄면 모든 케이스를 실행한다', async () => {
    const code = `
print("hello")
`;
    const testCases = [
      { expectedOutput: 'hello' },
      { expectedOutput: 'bye' },
    ];

    const result = await judgeSubmission({
      code,
      testCases,
      ...baseOptions,
      failFast: false,
    });

    expect(result.caseResults.length).toBe(2);
    expect(result.status).toBe('WA');
  });

  test('무한 루프는 TLE를 반환한다', async () => {
    const code = `
while True:
    pass
`;
    const testCases = [{ input: '', expectedOutput: '' }];

    const result = await judgeSubmission({
      code,
      testCases,
      ...baseOptions,
      defaultTimeLimitSeconds: 1,
    });

    expect(result.status).toBe('TLE');
  });

  test('메모리 초과 시 MLE를 반환한다', async () => {
    const code = `
data = []
for _ in range(200):
    data.append('x' * 1024 * 1024)
print(len(data))
`;
    const testCases = [{ expectedOutput: '200' }];

    const result = await judgeSubmission({
      code,
      testCases,
      ...baseOptions,
      defaultMemoryLimitMB: 20,
    });

    expect(result.status).toBe('MLE');
  });

  test('런타임 에러는 RE를 반환한다', async () => {
    const code = `
raise Exception("boom")
`;
    const testCases = [{ expectedOutput: '' }];

    const result = await judgeSubmission({
      code,
      testCases,
      ...baseOptions,
    });

    expect(result.status).toBe('RE');
    expect(result.errorMessage).toBeTruthy();
  });

  test('AST 위반 시 SE를 반환한다', async () => {
    const code = `
import os
print(1)
`;
    const testCases = [{ expectedOutput: '1' }];

    const result = await judgeSubmission({
      code,
      testCases,
      ...baseOptions,
    });

    expect(result.status).toBe('SE');
    expect(result.passedCount).toBe(0);
  });
});
