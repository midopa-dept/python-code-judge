-- Seed Data for Python Judge
-- 테스트용 초기 데이터

BEGIN;

-- 1. 관리자 계정 (비밀번호: admin123, bcrypt 해시)
INSERT INTO administrators (login_id, name, password_hash, role_level, account_status)
VALUES
    ('super_admin', '슈퍼 관리자', '$2b$10$rW5qYhKz.JVuX8YvN7RVj.YwQ8xVx6OxK8N2XqK3Z5M1xZ9Qz8K9K', 'super_admin', 'active');

-- 2. 테스트 학생 계정 (비밀번호: student123)
INSERT INTO students (military_id, login_id, name, password_hash, email, group_info, account_status)
VALUES
    ('24-12345', 'student01', '김철수', '$2b$10$rW5qYhKz.JVuX8YvN7RVj.YwQ8xVx6OxK8N2XqK3Z5M1xZ9Qz8K9K', 'kim@example.com', '1소대', 'active'),
    ('24-12346', 'student02', '이영희', '$2b$10$rW5qYhKz.JVuX8YvN7RVj.YwQ8xVx6OxK8N2XqK3Z5M1xZ9Qz8K9K', 'lee@example.com', '1소대', 'active'),
    ('24-12347', 'student03', '박민수', '$2b$10$rW5qYhKz.JVuX8YvN7RVj.YwQ8xVx6OxK8N2XqK3Z5M1xZ9Qz8K9K', 'park@example.com', '2소대', 'active');

-- 3. 샘플 문제 3개
INSERT INTO problems (title, description, category, difficulty, time_limit, memory_limit, author_id, visibility, accuracy_rate, submission_count)
VALUES
    (
        '짝수와 홀수 판별',
        '# 문제 설명
정수 n이 주어졌을 때, n이 짝수인지 홀수인지 판별하는 프로그램을 작성하세요.

## 입력
첫 번째 줄에 정수 n이 주어집니다. (1 ≤ n ≤ 1000)

## 출력
n이 짝수이면 "even"을, 홀수이면 "odd"를 출력합니다.

## 예제
입력:
4

출력:
even',
        '조건문',
        1,
        2,
        256,
        1,
        'public',
        0,
        0
    ),
    (
        '1부터 N까지의 합',
        '# 문제 설명
정수 N이 주어졌을 때, 1부터 N까지의 합을 구하는 프로그램을 작성하세요.

## 입력
첫 번째 줄에 정수 N이 주어집니다. (1 ≤ N ≤ 10000)

## 출력
1부터 N까지의 합을 출력합니다.

## 예제
입력:
5

출력:
15',
        '반복문',
        2,
        2,
        256,
        1,
        'public',
        0,
        0
    ),
    (
        '리스트 최댓값 찾기',
        '# 문제 설명
정수 리스트가 주어졌을 때, 리스트에서 가장 큰 값을 찾는 프로그램을 작성하세요.

## 입력
첫 번째 줄에 리스트의 크기 N이 주어집니다. (1 ≤ N ≤ 100)
두 번째 줄에 N개의 정수가 공백으로 구분되어 주어집니다. (1 ≤ 각 정수 ≤ 1000)

## 출력
리스트에서 가장 큰 값을 출력합니다.

## 예제
입력:
5
3 7 2 9 4

출력:
9',
        '리스트',
        2,
        2,
        256,
        1,
        'public',
        0,
        0
    );

-- 4. 테스트 케이스 - 문제 1: 짝수와 홀수 판별
INSERT INTO test_cases (problem_id, input_data, expected_output, is_public, "order")
VALUES
    (1, '4', 'even', true, 1),
    (1, '7', 'odd', true, 2),
    (1, '100', 'even', false, 3),
    (1, '1', 'odd', false, 4),
    (1, '999', 'odd', false, 5);

-- 5. 테스트 케이스 - 문제 2: 1부터 N까지의 합
INSERT INTO test_cases (problem_id, input_data, expected_output, is_public, "order")
VALUES
    (2, '5', '15', true, 1),
    (2, '10', '55', true, 2),
    (2, '1', '1', false, 3),
    (2, '100', '5050', false, 4),
    (2, '1000', '500500', false, 5);

-- 6. 테스트 케이스 - 문제 3: 리스트 최댓값 찾기
INSERT INTO test_cases (problem_id, input_data, expected_output, is_public, "order")
VALUES
    (3, E'5\n3 7 2 9 4', '9', true, 1),
    (3, E'3\n10 20 15', '20', true, 2),
    (3, E'1\n42', '42', false, 3),
    (3, E'7\n5 12 8 23 17 9 14', '23', false, 4),
    (3, E'10\n100 200 150 175 225 190 210 180 195 205', '225', false, 5);

-- 7. 교육 세션 예제 (현재 진행 중)
INSERT INTO education_sessions (name, start_time, end_time, status, session_type, allow_resubmit, creator_id)
VALUES
    (
        '파이썬 기초 실습',
        NOW() - INTERVAL '1 hour',
        NOW() + INTERVAL '2 hours',
        'active',
        'practice',
        true,
        1
    );

-- 8. 세션에 학생 추가
INSERT INTO session_students (session_id, student_id)
VALUES
    (1, 1),
    (1, 2),
    (1, 3);

-- 9. 세션에 문제 추가
INSERT INTO session_problems (session_id, problem_id, "order")
VALUES
    (1, 1, 1),
    (1, 2, 2),
    (1, 3, 3);

-- 10. 샘플 제출 및 채점 결과 (student01이 문제 1을 성공적으로 해결)
INSERT INTO submissions (student_id, problem_id, session_id, code, code_size, submitted_at, judging_status, python_version)
VALUES
    (
        1,
        1,
        1,
        E'n = int(input())\nif n % 2 == 0:\n    print("even")\nelse:\n    print("odd")',
        72,
        NOW() - INTERVAL '30 minutes',
        'completed',
        '3.11'
    );

INSERT INTO judging_results (submission_id, status, passed_cases, total_cases, execution_time, memory_usage, judged_at)
VALUES
    (1, 'AC', 5, 5, 45, 8192, NOW() - INTERVAL '30 minutes');

-- 11. submissions의 result_id 업데이트
UPDATE submissions SET result_id = 1 WHERE id = 1;

-- 12. 감사 로그 (관리자 로그인 기록)
INSERT INTO audit_logs (user_id, user_role, action_type, target_resource, ip_address, user_agent, performed_at, result)
VALUES
    (1, 'super_admin', 'login', 'administrators', '127.0.0.1', 'Mozilla/5.0', NOW() - INTERVAL '3 hours', 'success');

COMMIT;
