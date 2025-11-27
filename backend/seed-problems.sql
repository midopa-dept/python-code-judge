-- 기본 문제 데이터 삽입

-- 1. Hello World 출력하기 (입출력, 난이도 1)
INSERT INTO problems (title, description, category, difficulty, time_limit, memory_limit, visibility, created_by, created_at, updated_at)
VALUES
('Hello World 출력하기',
'"Hello, World!"를 출력하는 프로그램을 작성하세요.

입력: 없음
출력: Hello, World!',
'입출력', 1, 2, 256, 'public', NULL, NOW(), NOW());

-- 2. 두 수의 합 (입출력, 난이도 1)
INSERT INTO problems (title, description, category, difficulty, time_limit, memory_limit, visibility, created_by, created_at, updated_at)
VALUES
('두 수의 합',
'두 개의 정수 A와 B를 입력받아 A+B를 출력하는 프로그램을 작성하세요.

입력: 첫째 줄에 두 정수 A와 B가 주어집니다. (0 < A, B < 10)
출력: A+B를 출력합니다.',
'입출력', 1, 2, 256, 'public', NULL, NOW(), NOW());

-- 3. FizzBuzz (조건문, 난이도 2)
INSERT INTO problems (title, description, category, difficulty, time_limit, memory_limit, visibility, created_by, created_at, updated_at)
VALUES
('FizzBuzz',
'1부터 N까지의 수를 출력하되, 다음 규칙을 따릅니다:
- 3의 배수는 "Fizz"를 출력
- 5의 배수는 "Buzz"를 출력
- 3과 5의 공배수는 "FizzBuzz"를 출력
- 그 외의 수는 숫자를 그대로 출력

입력: 정수 N이 주어집니다. (1 ≤ N ≤ 100)
출력: 1부터 N까지 규칙에 따라 한 줄에 하나씩 출력합니다.',
'조건문', 2, 2, 256, 'public', NULL, NOW(), NOW());

-- 4. 별 찍기 (반복문, 난이도 2)
INSERT INTO problems (title, description, category, difficulty, time_limit, memory_limit, visibility, created_by, created_at, updated_at)
VALUES
('별 찍기',
'첫째 줄에는 별 1개, 둘째 줄에는 별 2개, N번째 줄에는 별 N개를 찍는 프로그램을 작성하세요.

입력: 정수 N이 주어집니다. (1 ≤ N ≤ 100)
출력: 첫째 줄부터 N번째 줄까지 차례대로 별을 출력합니다.

예시:
입력: 5
출력:
*
**
***
****
*****',
'반복문', 2, 2, 256, 'public', NULL, NOW(), NOW());

-- 5. 리스트의 합 (리스트, 난이도 1)
INSERT INTO problems (title, description, category, difficulty, time_limit, memory_limit, visibility, created_by, created_at, updated_at)
VALUES
('리스트의 합',
'N개의 정수가 주어졌을 때, 이들의 합을 구하는 프로그램을 작성하세요.

입력:
- 첫째 줄에 정수의 개수 N이 주어집니다. (1 ≤ N ≤ 100)
- 둘째 줄에 N개의 정수가 공백으로 구분되어 주어집니다.

출력: N개 정수의 합을 출력합니다.',
'리스트', 1, 2, 256, 'public', NULL, NOW(), NOW());

-- 6. 최댓값 찾기 (리스트, 난이도 1)
INSERT INTO problems (title, description, category, difficulty, time_limit, memory_limit, visibility, created_by, created_at, updated_at)
VALUES
('최댓값 찾기',
'N개의 정수 중에서 최댓값을 찾는 프로그램을 작성하세요.

입력:
- 첫째 줄에 정수의 개수 N이 주어집니다. (1 ≤ N ≤ 100)
- 둘째 줄에 N개의 정수가 공백으로 구분되어 주어집니다.

출력: 최댓값을 출력합니다.',
'리스트', 1, 2, 256, 'public', NULL, NOW(), NOW());

-- 7. 문자열 뒤집기 (문자열, 난이도 1)
INSERT INTO problems (title, description, category, difficulty, time_limit, memory_limit, visibility, created_by, created_at, updated_at)
VALUES
('문자열 뒤집기',
'주어진 문자열을 뒤집어서 출력하는 프로그램을 작성하세요.

입력: 문자열이 한 줄로 주어집니다. (길이 ≤ 100)
출력: 문자열을 뒤집어서 출력합니다.

예시:
입력: Hello
출력: olleH',
'문자열', 1, 2, 256, 'public', NULL, NOW(), NOW());

-- 8. 팩토리얼 (함수, 난이도 2)
INSERT INTO problems (title, description, category, difficulty, time_limit, memory_limit, visibility, created_by, created_at, updated_at)
VALUES
('팩토리얼',
'정수 N의 팩토리얼을 구하는 프로그램을 작성하세요.
N! = N × (N-1) × (N-2) × ... × 2 × 1

입력: 정수 N이 주어집니다. (0 ≤ N ≤ 12)
출력: N!을 출력합니다.

예시:
입력: 5
출력: 120',
'함수', 2, 2, 256, 'public', NULL, NOW(), NOW());

-- 9. 피보나치 수 (재귀, 난이도 3)
INSERT INTO problems (title, description, category, difficulty, time_limit, memory_limit, visibility, created_by, created_at, updated_at)
VALUES
('피보나치 수',
'N번째 피보나치 수를 구하는 프로그램을 작성하세요.
피보나치 수는 F(0) = 0, F(1) = 1이고,
F(n) = F(n-1) + F(n-2) (n ≥ 2)로 정의됩니다.

입력: 정수 N이 주어집니다. (0 ≤ N ≤ 30)
출력: N번째 피보나치 수를 출력합니다.

예시:
입력: 10
출력: 55',
'재귀', 3, 2, 256, 'public', NULL, NOW(), NOW());

-- 10. 버블 정렬 (정렬, 난이도 2)
INSERT INTO problems (title, description, category, difficulty, time_limit, memory_limit, visibility, created_by, created_at, updated_at)
VALUES
('버블 정렬',
'N개의 정수를 오름차순으로 정렬하는 프로그램을 작성하세요.

입력:
- 첫째 줄에 정수의 개수 N이 주어집니다. (1 ≤ N ≤ 100)
- 둘째 줄에 N개의 정수가 공백으로 구분되어 주어집니다.

출력: N개의 정수를 오름차순으로 정렬하여 공백으로 구분하여 출력합니다.',
'정렬', 2, 2, 256, 'public', NULL, NOW(), NOW());

-- 테스트 케이스 추가 (문제 ID 1번 - Hello World)
INSERT INTO test_cases (problem_id, input_data, expected_output, is_public, test_order, created_at, updated_at)
VALUES
(1, '', 'Hello, World!', true, 1, NOW(), NOW());

-- 테스트 케이스 추가 (문제 ID 2번 - 두 수의 합)
INSERT INTO test_cases (problem_id, input_data, expected_output, is_public, test_order, created_at, updated_at)
VALUES
(2, '1 2', '3', true, 1, NOW(), NOW()),
(2, '3 5', '8', true, 2, NOW(), NOW()),
(2, '9 1', '10', false, 3, NOW(), NOW());

-- 테스트 케이스 추가 (문제 ID 5번 - 리스트의 합)
INSERT INTO test_cases (problem_id, input_data, expected_output, is_public, test_order, created_at, updated_at)
VALUES
(5, E'5\n1 2 3 4 5', '15', true, 1, NOW(), NOW()),
(5, E'3\n10 20 30', '60', true, 2, NOW(), NOW());

-- 테스트 케이스 추가 (문제 ID 6번 - 최댓값 찾기)
INSERT INTO test_cases (problem_id, input_data, expected_output, is_public, test_order, created_at, updated_at)
VALUES
(6, E'5\n3 1 4 1 5', '5', true, 1, NOW(), NOW()),
(6, E'3\n9 2 6', '9', true, 2, NOW(), NOW());

-- 테스트 케이스 추가 (문제 ID 7번 - 문자열 뒤집기)
INSERT INTO test_cases (problem_id, input_data, expected_output, is_public, test_order, created_at, updated_at)
VALUES
(7, 'Hello', 'olleH', true, 1, NOW(), NOW()),
(7, 'Python', 'nohtyP', true, 2, NOW(), NOW());

-- 테스트 케이스 추가 (문제 ID 8번 - 팩토리얼)
INSERT INTO test_cases (problem_id, input_data, expected_output, is_public, test_order, created_at, updated_at)
VALUES
(8, '5', '120', true, 1, NOW(), NOW()),
(8, '0', '1', true, 2, NOW(), NOW()),
(8, '10', '3628800', false, 3, NOW(), NOW());
