-- Seed Data for Python Judge (Unified Schema)
-- 테스트용 초기 데이터

BEGIN;

-- 1. 관리자 및 학생 계정 (비밀번호: admin123 / student123, bcrypt 해시)
INSERT INTO users (login_id, name, password_hash, email, group_info, role, account_status)
VALUES
    -- 슈퍼 관리자
    ('super_admin', '슈퍼 관리자', '$2a$10$rcH0fv8djSoSIMY4HvCzLedE/2YwAznqOlIiVDAaDXXb2szaRx6cK', 'super@example.com', NULL, 'super_admin', 'active'),
    -- 일반 관리자
    ('admin01', '김관리', '$2a$10$rcH0fv8djSoSIMY4HvCzLedE/2YwAznqOlIiVDAaDXXb2szaRx6cK', 'admin01@example.com', NULL, 'admin', 'active'),
    -- 학생들
    ('student01', '김철수', '$2a$10$JoP0mWDvkqio4fmwD1M7DOR1Z0b/V52EkIqquUxxQ3AR5eXFwXRcG', 'kim@example.com', '1소대', 'student', 'active'),
    ('student02', '이영희', '$2a$10$JoP0mWDvkqio4fmwD1M7DOR1Z0b/V52EkIqquUxxQ3AR5eXFwXRcG', 'lee@example.com', '1소대', 'student', 'active'),
    ('student03', '박민수', '$2a$10$JoP0mWDvkqio4fmwD1M7DOR1Z0b/V52EkIqquUxxQ3AR5eXFwXRcG', 'park@example.com', '2소대', 'student', 'active');

-- 2. 샘플 문제 3개
INSERT INTO problems (title, description, category, difficulty, time_limit, memory_limit, created_by, visibility)
VALUES
    (
        '짝수와 홀수 판별',
        '# 문제 설명
정수 n이 주어졌을 때, n이 짝수인지 홀수인지 판별하는 프로그램을 작성하세요.

## 입력
첫 번째 줄에 정수 n이 주어집니다. (1 ≤ n ≤ 1000)

## 출력
n이 짝수이면 "even"을, 홀수이면 "odd"를 출력합니다.

## 입출력 예
입력: 4
출력: even

입력: 7
출력: odd',
        '입출력',
        1,
        2,
        128,
        1,
        'public'
    ),
    (
        '두 수의 합',
        '# 문제 설명
두 정수 a와 b를 입력받아 두 수의 합을 출력하는 프로그램을 작성하세요.

## 입력
첫 번째 줄에 두 정수 a, b가 공백으로 구분되어 주어집니다. (-1000 ≤ a, b ≤ 1000)

## 출력
a + b를 출력합니다.

## 입출력 예
입력: 3 5
출력: 8

입력: -10 20
출력: 10',
        '입출력',
        1,
        2,
        128,
        1,
        'public'
    ),
    (
        '최댓값 찾기',
        '# 문제 설명
N개의 정수가 주어졌을 때, 이 중에서 가장 큰 값을 찾아 출력하는 프로그램을 작성하세요.

## 입력
첫 번째 줄에 정수의 개수 N이 주어집니다. (1 ≤ N ≤ 100)
두 번째 줄에 N개의 정수가 공백으로 구분되어 주어집니다. (-1000 ≤ 각 정수 ≤ 1000)

## 출력
가장 큰 값을 출력합니다.

## 입출력 예
입력:
5
3 7 2 9 5

출력:
9',
        '리스트',
        2,
        2,
        128,
        1,
        'public'
    );

-- 3. 테스트 케이스
-- 문제 1: 짝수와 홀수 판별
INSERT INTO test_cases (problem_id, input_data, expected_output, is_public, test_order)
VALUES
    (1, '4', 'even', TRUE, 1),
    (1, '7', 'odd', TRUE, 2),
    (1, '100', 'even', FALSE, 3),
    (1, '999', 'odd', FALSE, 4);

-- 문제 2: 두 수의 합
INSERT INTO test_cases (problem_id, input_data, expected_output, is_public, test_order)
VALUES
    (2, '3 5', '8', TRUE, 1),
    (2, '-10 20', '10', TRUE, 2),
    (2, '0 0', '0', FALSE, 3),
    (2, '-100 -200', '-300', FALSE, 4);

-- 문제 3: 최댓값 찾기
INSERT INTO test_cases (problem_id, input_data, expected_output, is_public, test_order)
VALUES
    (3, E'5\n3 7 2 9 5', '9', TRUE, 1),
    (3, E'3\n-5 -10 -3', '-3', TRUE, 2),
    (3, E'1\n42', '42', FALSE, 3);

-- 4. 교육 세션
INSERT INTO education_sessions (name, start_time, end_time, status, session_type, allow_resubmit, creator_id)
VALUES
    (
        '기초 프로그래밍 교육',
        NOW() - INTERVAL '1 day',
        NOW() + INTERVAL '6 days',
        'active',
        'regular',
        TRUE,
        1
    ),
    (
        'Python 중간고사',
        NOW() + INTERVAL '7 days',
        NOW() + INTERVAL '8 days',
        'scheduled',
        'exam',
        FALSE,
        1
    );

-- 5. 세션-학생 배정
INSERT INTO session_students (session_id, student_id)
VALUES
    (1, 3),  -- 김철수
    (1, 4),  -- 이영희
    (1, 5),  -- 박민수
    (2, 3),
    (2, 4);

-- 6. 세션-문제 배정
INSERT INTO session_problems (session_id, problem_id, problem_order)
VALUES
    (1, 1, 1),
    (1, 2, 2),
    (2, 2, 1),
    (2, 3, 2);

-- 7. 샘플 제출
INSERT INTO submissions (student_id, problem_id, session_id, code, code_size, status, python_version, execution_time, memory_usage, passed_cases, total_cases)
VALUES
    (
        3,
        1,
        1,
        E'n = int(input())\nif n % 2 == 0:\n    print("even")\nelse:\n    print("odd")',
        75,
        'AC',
        '3.11',
        10,
        10240,
        4,
        4
    ),
    (
        4,
        1,
        1,
        E'n = int(input())\nprint("even" if n % 2 == 0 else "odd")',
        57,
        'AC',
        '3.11',
        10,
        10240,
        4,
        4
    );

-- 8. 감사 로그 (테스트용)
INSERT INTO audit_logs (user_id, user_role, action_type, target_resource, ip_address, user_agent, result, error_message, performed_at)
VALUES
    (1, 'super_admin', 'login', 'POST /api/auth/login', '127.0.0.1', 'Mozilla/5.0', 'success', NULL, NOW() - INTERVAL '5 hours'),
    (1, 'super_admin', 'create', 'POST /api/sessions', '127.0.0.1', 'Mozilla/5.0', 'success', NULL, NOW() - INTERVAL '4 hours'),
    (3, 'student', 'login', 'POST /api/auth/login', '127.0.0.1', 'Mozilla/5.0', 'success', NULL, NOW() - INTERVAL '3 hours'),
    (3, 'student', 'submit', 'POST /api/submissions', '127.0.0.1', 'Mozilla/5.0', 'success', NULL, NOW() - INTERVAL '2 hours'),
    (4, 'student', 'login', 'POST /api/auth/login', '127.0.0.1', 'Mozilla/5.0', 'success', NULL, NOW() - INTERVAL '1 hour');

COMMIT;
