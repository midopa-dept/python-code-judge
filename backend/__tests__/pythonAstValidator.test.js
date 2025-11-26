import { analyzePythonCode } from '../src/shared/utils/pythonAstValidator.js';

describe('pythonAstValidator', () => {
  test('허용 모듈만 사용한 안전한 코드는 통과한다', () => {
    const code = `
import math
def solve(x):
    return math.sqrt(x)
`;
    const result = analyzePythonCode(code, { pythonExecutables: ['python'] });
    expect(result.status).toBe('OK');
    expect(result.passed).toBe(true);
  });

  test('금지 모듈 사용 시 거부된다', () => {
    const code = `
import os
os.system('echo hi')
`;
    const result = analyzePythonCode(code, { pythonExecutables: ['python'] });
    expect(result.status).toBe('REJECTED');
    expect(result.errors.some((e) => e.type === 'BANNED_MODULE' && e.target === 'os')).toBe(
      true
    );
  });

  test('금지 함수(eval, __import__, compile) 사용을 막는다', () => {
    const code = `
def hack():
    eval('1+1')
    __import__('os')
    compile('print(1)', '', 'exec')
`;
    const result = analyzePythonCode(code, { pythonExecutables: ['python'] });
    expect(result.status).toBe('REJECTED');
    expect(result.errors.filter((e) => e.type === 'BANNED_FUNCTION')).toHaveLength(3);
  });

  test('화이트리스트에 없는 모듈은 거부된다', () => {
    const code = `
import sys
print(sys.version)
`;
    const result = analyzePythonCode(code, { pythonExecutables: ['python'] });
    expect(result.status).toBe('REJECTED');
    expect(result.errors.some((e) => e.type === 'UNAUTHORIZED_MODULE' && e.target === 'sys')).toBe(
      true
    );
  });

  test('동적 import 시도(importlib)도 차단한다', () => {
    const code = `
import importlib
module = importlib.import_module('math')
`;
    const result = analyzePythonCode(code, { pythonExecutables: ['python'] });
    expect(result.status).toBe('REJECTED');
    expect(
      result.errors.some(
        (e) => e.type === 'BANNED_MODULE' || (e.type === 'BANNED_FUNCTION' && e.target.includes('importlib'))
      )
    ).toBe(true);
  });

  test('문법 오류가 있으면 SE 상태를 반환한다', () => {
    const code = `
def broken(
    return 1
`;
    const result = analyzePythonCode(code, { pythonExecutables: ['python'] });
    expect(result.status).toBe('SE');
    expect(result.passed).toBe(false);
  });

  test('코드 크기 제한을 초과하면 거부된다', () => {
    const largeCode = 'a'.repeat(1024 * 70);
    const result = analyzePythonCode(largeCode, { maxBytes: 1024 * 64, pythonExecutables: ['python'] });
    expect(result.status).toBe('REJECTED');
    expect(result.reason).toBe('SIZE_LIMIT_EXCEEDED');
  });

  test('실행 파일 후보가 여러 개일 때 순차적으로 시도한다', () => {
    const code = 'print(1)';
    const result = analyzePythonCode(code, {
      pythonExecutables: ['definitely-not-a-real-python', 'python'],
    });
    expect(result.status).toBe('OK');
    expect(result.passed).toBe(true);
  });
});
