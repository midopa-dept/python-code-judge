-- Unified Schema for Python Judge
-- 통합된 users 테이블 사용

BEGIN;

SET search_path = public;

-- Drop existing tables if they exist (for fresh install)
DROP TABLE IF EXISTS audit_logs CASCADE;
DROP TABLE IF EXISTS scoreboards CASCADE;
DROP TABLE IF EXISTS session_problems CASCADE;
DROP TABLE IF EXISTS session_students CASCADE;
DROP TABLE IF EXISTS judging_results CASCADE;
DROP TABLE IF EXISTS submissions CASCADE;
DROP TABLE IF EXISTS test_cases CASCADE;
DROP TABLE IF EXISTS problems CASCADE;
DROP TABLE IF EXISTS education_sessions CASCADE;
DROP TABLE IF EXISTS administrators CASCADE;
DROP TABLE IF EXISTS students CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- 1) 통합 사용자 테이블
CREATE TABLE users (
    id               BIGSERIAL PRIMARY KEY,
    login_id         VARCHAR NOT NULL UNIQUE CHECK (char_length(login_id) BETWEEN 4 AND 20),
    name             VARCHAR NOT NULL CHECK (char_length(name) BETWEEN 2 AND 50),
    password_hash    VARCHAR NOT NULL,
    email            VARCHAR,
    group_info       VARCHAR,
    role             VARCHAR NOT NULL DEFAULT 'student' CHECK (role IN ('student','admin','super_admin')),
    account_status   VARCHAR NOT NULL DEFAULT 'active' CHECK (account_status IN ('active','suspended','deleted')),
    created_at       TIMESTAMP NOT NULL DEFAULT NOW(),
    last_login       TIMESTAMP,
    updated_at       TIMESTAMP NOT NULL DEFAULT NOW()
);

-- 2) 교육 세션
CREATE TABLE education_sessions (
    id              BIGSERIAL PRIMARY KEY,
    name            VARCHAR(100) NOT NULL,
    start_time      TIMESTAMP NOT NULL,
    end_time        TIMESTAMP NOT NULL,
    status          VARCHAR(20) NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled','active','ended','cancelled')),
    session_type    VARCHAR(20) NOT NULL CHECK (session_type IN ('regular','exam','practice')),
    allow_resubmit  BOOLEAN NOT NULL DEFAULT TRUE,
    creator_id      BIGINT REFERENCES users(id) ON DELETE SET NULL,
    created_at      TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMP NOT NULL DEFAULT NOW(),
    CONSTRAINT chk_education_sessions_time CHECK (end_time > start_time)
);

-- 3) 문제
CREATE TABLE problems (
    id                BIGSERIAL PRIMARY KEY,
    title             VARCHAR NOT NULL UNIQUE,
    description       TEXT NOT NULL,
    category          VARCHAR NOT NULL CHECK (category IN ('입출력','조건문','반복문','리스트','문자열','함수','재귀','정렬','탐색','동적계획법','기타')),
    difficulty        INTEGER NOT NULL CHECK (difficulty BETWEEN 1 AND 5),
    time_limit        INTEGER NOT NULL DEFAULT 2 CHECK (time_limit BETWEEN 1 AND 10),
    memory_limit      INTEGER NOT NULL DEFAULT 256 CHECK (memory_limit > 0),
    visibility        VARCHAR NOT NULL DEFAULT 'draft' CHECK (visibility IN ('public','private','draft')),
    judge_config      JSONB,
    created_by        BIGINT REFERENCES users(id) ON DELETE SET NULL,
    created_at        TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at        TIMESTAMP NOT NULL DEFAULT NOW()
);

-- 4) 테스트 케이스
CREATE TABLE test_cases (
    id              BIGSERIAL PRIMARY KEY,
    problem_id      BIGINT NOT NULL REFERENCES problems(id) ON DELETE CASCADE,
    input_data      TEXT NOT NULL,
    expected_output TEXT NOT NULL,
    is_public       BOOLEAN NOT NULL DEFAULT FALSE,
    test_order      INTEGER NOT NULL DEFAULT 0,
    created_at      TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMP NOT NULL DEFAULT NOW()
);

-- 5) 제출
CREATE TABLE submissions (
    id              BIGSERIAL PRIMARY KEY,
    student_id      BIGINT NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    problem_id      BIGINT NOT NULL REFERENCES problems(id) ON DELETE RESTRICT,
    session_id      BIGINT REFERENCES education_sessions(id) ON DELETE SET NULL,
    code            TEXT NOT NULL,
    code_size       INTEGER NOT NULL CHECK (code_size <= 65536),
    submitted_at    TIMESTAMP NOT NULL DEFAULT NOW(),
    status          VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','judging','AC','WA','TLE','RE','SE','MLE','cancelled')),
    python_version  VARCHAR(10) NOT NULL CHECK (python_version IN ('3.8','3.9','3.10','3.11','3.12')),
    execution_time  INTEGER,
    memory_usage    INTEGER,
    error_message   TEXT,
    passed_cases    INTEGER,
    total_cases     INTEGER,
    judged_at       TIMESTAMP
);

-- 6) 세션-학생 매핑
CREATE TABLE session_students (
    session_id  BIGINT NOT NULL REFERENCES education_sessions(id) ON DELETE CASCADE,
    student_id  BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    joined_at   TIMESTAMP NOT NULL DEFAULT NOW(),
    PRIMARY KEY (session_id, student_id)
);

-- 7) 세션-문제 매핑
CREATE TABLE session_problems (
    session_id  BIGINT NOT NULL REFERENCES education_sessions(id) ON DELETE CASCADE,
    problem_id  BIGINT NOT NULL REFERENCES problems(id) ON DELETE CASCADE,
    problem_order INTEGER NOT NULL DEFAULT 0,
    PRIMARY KEY (session_id, problem_id)
);

-- 8) 스코어보드
CREATE TABLE scoreboards (
    session_id    BIGINT NOT NULL REFERENCES education_sessions(id) ON DELETE CASCADE,
    student_id    BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    score         INTEGER NOT NULL DEFAULT 0 CHECK (score >= 0),
    solved_count  INTEGER NOT NULL DEFAULT 0 CHECK (solved_count >= 0),
    rank          INTEGER NOT NULL DEFAULT 1 CHECK (rank > 0),
    updated_at    TIMESTAMP NOT NULL DEFAULT NOW(),
    PRIMARY KEY (session_id, student_id)
);

-- 9) 감사 로그
CREATE TABLE audit_logs (
    id               BIGSERIAL PRIMARY KEY,
    user_id          BIGINT,
    user_role        VARCHAR(20) CHECK (user_role IN ('student','admin','super_admin','unknown')),
    action_type      VARCHAR(50) NOT NULL CHECK (action_type IN ('login','signup','create','update','delete','submit','reset_password','change_password','access_denied')),
    target_resource  VARCHAR(100),
    ip_address       VARCHAR(45),
    user_agent       VARCHAR(200),
    performed_at     TIMESTAMP NOT NULL DEFAULT NOW(),
    result           VARCHAR(20) NOT NULL CHECK (result IN ('success','failure')),
    error_message    TEXT
);

-- 인덱스
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_account_status ON users(account_status);
CREATE INDEX idx_users_login_id ON users(login_id);

CREATE INDEX idx_problems_created_by ON problems(created_by);
CREATE INDEX idx_problems_category ON problems(category);
CREATE INDEX idx_problems_difficulty ON problems(difficulty);
CREATE INDEX idx_problems_visibility ON problems(visibility);

CREATE INDEX idx_test_cases_problem_id ON test_cases(problem_id);
CREATE INDEX idx_test_cases_problem_order ON test_cases(problem_id, test_order);

CREATE INDEX idx_submissions_student_id ON submissions(student_id);
CREATE INDEX idx_submissions_problem_id ON submissions(problem_id);
CREATE INDEX idx_submissions_session_id ON submissions(session_id);
CREATE INDEX idx_submissions_status ON submissions(status);
CREATE INDEX idx_submissions_submitted_at ON submissions(submitted_at DESC);
CREATE INDEX idx_submissions_student_problem ON submissions(student_id, problem_id, submitted_at DESC);

CREATE INDEX idx_education_sessions_creator_id ON education_sessions(creator_id);
CREATE INDEX idx_education_sessions_status ON education_sessions(status);
CREATE INDEX idx_education_sessions_start_time ON education_sessions(start_time);

CREATE INDEX idx_scoreboards_session_rank ON scoreboards(session_id, rank);

CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_performed_at ON audit_logs(performed_at DESC);
CREATE INDEX idx_audit_logs_action_type ON audit_logs(action_type);

-- 세션별 학생 제출 이력 조회 최적화 (추가)
CREATE INDEX idx_submissions_session_student ON submissions(session_id, student_id, submitted_at DESC);

-- 트리거 함수
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at := NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 트리거
CREATE TRIGGER trg_users_updated_at
BEFORE UPDATE ON users
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_problems_updated_at
BEFORE UPDATE ON problems
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_test_cases_updated_at
BEFORE UPDATE ON test_cases
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_education_sessions_updated_at
BEFORE UPDATE ON education_sessions
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

COMMIT;
