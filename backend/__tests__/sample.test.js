describe('Sample Test', () => {
  test('1 + 1 should equal 2', () => {
    expect(1 + 1).toBe(2);
  });

  test('환경 변수 로드 테스트', () => {
    expect(process.env.NODE_ENV).toBeDefined();
  });
});
