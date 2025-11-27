import pkg from 'pg';
const { Pool } = pkg;

const pool = new Pool({
  connectionString: 'postgresql://postgres:claude0729@localhost:5432/postgres',
});

const problems = [
  {
    title: 'Hello World 출력하기',
    description: `"Hello, World!"를 출력하는 프로그램을 작성하세요.

입력: 없음
출력: Hello, World!`,
    category: '입출력',
    difficulty: 1,
    testCases: [
      { input: '', output: 'Hello, World!', isPublic: true },
    ],
  },
  {
    title: '두 수의 합',
    description: `두 개의 정수 A와 B를 입력받아 A+B를 출력하는 프로그램을 작성하세요.

입력: 첫째 줄에 두 정수 A와 B가 주어집니다. (0 < A, B < 10)
출력: A+B를 출력합니다.`,
    category: '입출력',
    difficulty: 1,
    testCases: [
      { input: '1 2', output: '3', isPublic: true },
      { input: '3 5', output: '8', isPublic: true },
      { input: '9 1', output: '10', isPublic: false },
    ],
  },
  {
    title: 'FizzBuzz',
    description: `1부터 N까지의 수를 출력하되, 다음 규칙을 따릅니다:
- 3의 배수는 "Fizz"를 출력
- 5의 배수는 "Buzz"를 출력
- 3과 5의 공배수는 "FizzBuzz"를 출력
- 그 외의 수는 숫자를 그대로 출력

입력: 정수 N이 주어집니다. (1 ≤ N ≤ 100)
출력: 1부터 N까지 규칙에 따라 한 줄에 하나씩 출력합니다.`,
    category: '조건문',
    difficulty: 2,
    testCases: [
      { input: '15', output: '1\n2\nFizz\n4\nBuzz\nFizz\n7\n8\nFizz\nBuzz\n11\nFizz\n13\n14\nFizzBuzz', isPublic: true },
    ],
  },
  {
    title: '별 찍기',
    description: `첫째 줄에는 별 1개, 둘째 줄에는 별 2개, N번째 줄에는 별 N개를 찍는 프로그램을 작성하세요.

입력: 정수 N이 주어집니다. (1 ≤ N ≤ 100)
출력: 첫째 줄부터 N번째 줄까지 차례대로 별을 출력합니다.

예시:
입력: 5
출력:
*
**
***
****
*****`,
    category: '반복문',
    difficulty: 2,
    testCases: [
      { input: '5', output: '*\n**\n***\n****\n*****', isPublic: true },
    ],
  },
  {
    title: '리스트의 합',
    description: `N개의 정수가 주어졌을 때, 이들의 합을 구하는 프로그램을 작성하세요.

입력:
- 첫째 줄에 정수의 개수 N이 주어집니다. (1 ≤ N ≤ 100)
- 둘째 줄에 N개의 정수가 공백으로 구분되어 주어집니다.

출력: N개 정수의 합을 출력합니다.`,
    category: '리스트',
    difficulty: 1,
    testCases: [
      { input: '5\n1 2 3 4 5', output: '15', isPublic: true },
      { input: '3\n10 20 30', output: '60', isPublic: true },
    ],
  },
  {
    title: '최댓값 찾기',
    description: `N개의 정수 중에서 최댓값을 찾는 프로그램을 작성하세요.

입력:
- 첫째 줄에 정수의 개수 N이 주어집니다. (1 ≤ N ≤ 100)
- 둘째 줄에 N개의 정수가 공백으로 구분되어 주어집니다.

출력: 최댓값을 출력합니다.`,
    category: '리스트',
    difficulty: 1,
    testCases: [
      { input: '5\n3 1 4 1 5', output: '5', isPublic: true },
      { input: '3\n9 2 6', output: '9', isPublic: true },
    ],
  },
  {
    title: '문자열 뒤집기',
    description: `주어진 문자열을 뒤집어서 출력하는 프로그램을 작성하세요.

입력: 문자열이 한 줄로 주어집니다. (길이 ≤ 100)
출력: 문자열을 뒤집어서 출력합니다.

예시:
입력: Hello
출력: olleH`,
    category: '문자열',
    difficulty: 1,
    testCases: [
      { input: 'Hello', output: 'olleH', isPublic: true },
      { input: 'Python', output: 'nohtyP', isPublic: true },
    ],
  },
  {
    title: '팩토리얼',
    description: `정수 N의 팩토리얼을 구하는 프로그램을 작성하세요.
N! = N × (N-1) × (N-2) × ... × 2 × 1

입력: 정수 N이 주어집니다. (0 ≤ N ≤ 12)
출력: N!을 출력합니다.

예시:
입력: 5
출력: 120`,
    category: '함수',
    difficulty: 2,
    testCases: [
      { input: '5', output: '120', isPublic: true },
      { input: '0', output: '1', isPublic: true },
      { input: '10', output: '3628800', isPublic: false },
    ],
  },
  {
    title: '피보나치 수',
    description: `N번째 피보나치 수를 구하는 프로그램을 작성하세요.
피보나치 수는 F(0) = 0, F(1) = 1이고,
F(n) = F(n-1) + F(n-2) (n ≥ 2)로 정의됩니다.

입력: 정수 N이 주어집니다. (0 ≤ N ≤ 30)
출력: N번째 피보나치 수를 출력합니다.

예시:
입력: 10
출력: 55`,
    category: '재귀',
    difficulty: 3,
    testCases: [
      { input: '10', output: '55', isPublic: true },
      { input: '0', output: '0', isPublic: true },
      { input: '1', output: '1', isPublic: true },
    ],
  },
  {
    title: '버블 정렬',
    description: `N개의 정수를 오름차순으로 정렬하는 프로그램을 작성하세요.

입력:
- 첫째 줄에 정수의 개수 N이 주어집니다. (1 ≤ N ≤ 100)
- 둘째 줄에 N개의 정수가 공백으로 구분되어 주어집니다.

출력: N개의 정수를 오름차순으로 정렬하여 공백으로 구분하여 출력합니다.`,
    category: '정렬',
    difficulty: 2,
    testCases: [
      { input: '5\n5 4 3 2 1', output: '1 2 3 4 5', isPublic: true },
      { input: '3\n3 1 2', output: '1 2 3', isPublic: true },
    ],
  },
];

async function seedProblems() {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    console.log('기존 문제 데이터 삭제 중...');
    await client.query('DELETE FROM test_cases');
    await client.query('DELETE FROM problems');
    await client.query('ALTER SEQUENCE problems_id_seq RESTART WITH 1');
    await client.query('ALTER SEQUENCE test_cases_id_seq RESTART WITH 1');

    console.log('문제 데이터 삽입 중...');

    for (const problem of problems) {
      // 문제 삽입
      const problemResult = await client.query(
        `INSERT INTO problems (title, description, category, difficulty, time_limit, memory_limit, visibility, created_at, updated_at)
         VALUES ($1, $2, $3, $4, 2, 256, 'public', NOW(), NOW())
         RETURNING id`,
        [problem.title, problem.description, problem.category, problem.difficulty]
      );

      const problemId = problemResult.rows[0].id;
      console.log(`  ✓ ${problem.title} (ID: ${problemId})`);

      // 테스트 케이스 삽입
      for (let i = 0; i < problem.testCases.length; i++) {
        const testCase = problem.testCases[i];
        await client.query(
          `INSERT INTO test_cases (problem_id, input_data, expected_output, is_public, test_order, created_at, updated_at)
           VALUES ($1, $2, $3, $4, $5, NOW(), NOW())`,
          [problemId, testCase.input, testCase.output, testCase.isPublic, i + 1]
        );
      }
    }

    await client.query('COMMIT');
    console.log(`\n✅ 총 ${problems.length}개의 문제가 성공적으로 삽입되었습니다!`);
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ 오류 발생:', error.message);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

seedProblems().catch(console.error);
