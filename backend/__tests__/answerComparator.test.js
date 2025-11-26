import {
  normalizeOutput,
  floatsClose,
  compareOutputs,
  assertOutputsMatch,
} from '../src/shared/utils/answerComparator.js';

describe('answerComparator', () => {
  test('trailing whitespace와 빈 줄을 제거하고 줄바꿈을 통일한다', () => {
    const input = '1 2  \r\n\r\n3  \n';
    const normalized = normalizeOutput(input);
    expect(normalized).toBe('1 2\n3');
  });

  test('부동소수점이 상대 오차 1e-9 이내면 일치로 본다', () => {
    expect(floatsClose(1.0, 1.0 + 5e-10)).toBe(true);
    expect(floatsClose(1.0, 1.0 + 2e-8)).toBe(false);
  });

  test('0 근처 값은 절대 오차 1e-9 기준으로 비교한다', () => {
    expect(floatsClose(0, 5e-10)).toBe(true);
    expect(floatsClose(0, 2e-9)).toBe(false);
  });

  test('출력 토큰 개수가 다르면 불일치 처리한다', () => {
    const result = compareOutputs('1 2', '1 2 3');
    expect(result.matched).toBe(false);
  });

  test('숫자 토큰은 허용 오차 내에서 비교하고 문자열은 정확히 비교한다', () => {
    const a = '1.0000000005 hello';
    const b = '1.0000000004 hello';
    const result = compareOutputs(a, b);
    expect(result.matched).toBe(true);
  });

  test('허용 오차를 넘는 숫자 차이는 불일치', () => {
    const result = compareOutputs('1.0', '1.1');
    expect(result.matched).toBe(false);
  });

  test('assertOutputsMatch는 불일치 시 예외를 던진다', () => {
    expect(() => assertOutputsMatch('a', 'b')).toThrow('출력이 일치하지 않습니다.');
  });

  test('CRLF/LF 차이와 trailing whitespace가 달라도 일치로 처리한다', () => {
    const expected = 'hello\r\nworld  ';
    const actual = 'hello\nworld';
    const result = compareOutputs(expected, actual);
    expect(result.matched).toBe(true);
  });
});
