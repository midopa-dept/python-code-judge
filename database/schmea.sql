-- Schema for Python Judge
-- Generated from docs/6-erd.md

BEGIN;

SET search_path = public;

-- 1) Core entities
CREATE TABLE IF NOT EXISTS students (
    id               BIGSERIAL PRIMARY KEY,
    military_id      VARCHAR NOT NULL UNIQUE CHECK (char_length(military_id) BETWEEN 5 AND 20),
    login_id         VARCHAR NOT NULL UNIQUE CHECK (char_length(login_id) BETWEEN 4 AND 20),
    name             VARCHAR NOT NULL CHECK (char_length(name) BETWEEN 2 AND 50),
    password_hash    VARCHAR NOT NULL,
    email            VARCHAR,
    group_info       VARCHAR,
    account_status   VARCHAR NOT NULL DEFAULT 'active' CHECK (account_status IN ('active','suspended','deleted')),
    created_at       TIMESTAMP NOT NULL DEFAULT NOW(),
    last_login       TIMESTAMP
);

CREATE TABLE IF NOT EXISTS administrators (
    id               BIGSERIAL PRIMARY KEY,
    login_id         VARCHAR NOT NULL UNIQUE,
    name             VARCHAR NOT NULL,
    password_hash    VARCHAR NOT NULL,
    role_level       VARCHAR NOT NULL DEFAULT 'admin' CHECK (role_level IN ('admin','super_admin')),
    account_status   VARCHAR NOT NULL DEFAULT 'active' CHECK (account_status IN ('active','suspended','deleted')),
    created_at       TIMESTAMP NOT NULL DEFAULT NOW(),
    last_login       TIMESTAMP
);

CREATE TABLE IF NOT EXISTS education_sessions (
    id              BIGSERIAL PRIMARY KEY,
    name            VARCHAR(100) NOT NULL,
    start_time      TIMESTAMP NOT NULL,
    end_time        TIMESTAMP NOT NULL,
    status          VARCHAR(20) NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled','active','ended','cancelled')),
    session_type    VARCHAR(20) NOT NULL CHECK (session_type IN ('regular','exam','practice')),
    allow_resubmit  BOOLEAN NOT NULL DEFAULT TRUE,
    creator_id      BIGINT REFERENCES administrators(id) ON DELETE SET NULL,
    created_at      TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMP NOT NULL DEFAULT NOW(),
    CONSTRAINT chk_education_sessions_time CHECK (end_time > start_time)
);

CREATE TABLE IF NOT EXISTS problems (
    id                BIGSERIAL PRIMARY KEY,
    title             VARCHAR NOT NULL,
    description       TEXT NOT NULL,
    category          VARCHAR NOT NULL CHECK (category IN ('조건문','반복문','리스트','딕셔너리','문자열','함수','재귀','정렬','파일 I/O','예외 처리','종합')),
    difficulty        INTEGER NOT NULL CHECK (difficulty BETWEEN 1 AND 5),
    time_limit        INTEGER NOT NULL DEFAULT 2 CHECK (time_limit BETWEEN 1 AND 10),
    memory_limit      INTEGER NOT NULL DEFAULT 256 CHECK (memory_limit > 0),
    author_id         BIGINT REFERENCES administrators(id) ON DELETE SET NULL,
    created_at        TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at        TIMESTAMP NOT NULL DEFAULT NOW(),
    visibility        VARCHAR NOT NULL DEFAULT 'draft' CHECK (visibility IN ('public','private','draft')),
    accuracy_rate     NUMERIC(5,2) NOT NULL DEFAULT 0 CHECK (accuracy_rate BETWEEN 0 AND 100),
    submission_count  INTEGER NOT NULL DEFAULT 0 CHECK (submission_count >= 0)
);

CREATE TABLE IF NOT EXISTS test_cases (
    id              BIGSERIAL PRIMARY KEY,
    problem_id      BIGINT NOT NULL REFERENCES problems(id) ON DELETE CASCADE,
    input_data      TEXT NOT NULL,
    expected_output TEXT NOT NULL,
    is_public       BOOLEAN NOT NULL DEFAULT FALSE,
    "order"        INTEGER NOT NULL,
    created_at      TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS submissions (
    id              BIGSERIAL PRIMARY KEY,
    student_id      BIGINT NOT NULL REFERENCES students(id) ON DELETE RESTRICT,
    problem_id      BIGINT NOT NULL REFERENCES problems(id) ON DELETE RESTRICT,
    session_id      BIGINT REFERENCES education_sessions(id) ON DELETE SET NULL,
    code            TEXT NOT NULL,
    code_size       INTEGER NOT NULL CHECK (code_size <= 65536),
    submitted_at    TIMESTAMP NOT NULL DEFAULT NOW(),
    judging_status  VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (judging_status IN ('pending','judging','completed','failed')),
    result_id       BIGINT,
    python_version  VARCHAR(10) NOT NULL CHECK (python_version IN ('3.8','3.9','3.10','3.11','3.12'))
);

CREATE TABLE IF NOT EXISTS judging_results (
    id              BIGSERIAL PRIMARY KEY,
    submission_id   BIGINT NOT NULL UNIQUE REFERENCES submissions(id) ON DELETE CASCADE,
    status          VARCHAR(10) NOT NULL CHECK (status IN ('AC','WA','TLE','RE','SE','MLE')),
    passed_cases    INTEGER NOT NULL CHECK (passed_cases >= 0),
    total_cases     INTEGER NOT NULL CHECK (total_cases > 0),
    execution_time  INTEGER NOT NULL CHECK (execution_time >= 0),
    memory_usage    INTEGER NOT NULL CHECK (memory_usage >= 0),
    error_message   TEXT,
    judged_at       TIMESTAMP NOT NULL DEFAULT NOW(),
    CONSTRAINT chk_judging_results_passed_total CHECK (passed_cases <= total_cases)
);

ALTER TABLE submissions
    ADD CONSTRAINT fk_submissions_result_id
    FOREIGN KEY (result_id) REFERENCES judging_results(id) ON DELETE SET NULL;

CREATE TABLE IF NOT EXISTS session_students (
    session_id  BIGINT NOT NULL REFERENCES education_sessions(id) ON DELETE CASCADE,
    student_id  BIGINT NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    joined_at   TIMESTAMP NOT NULL DEFAULT NOW(),
    PRIMARY KEY (session_id, student_id)
);

CREATE TABLE IF NOT EXISTS session_problems (
    session_id  BIGINT NOT NULL REFERENCES education_sessions(id) ON DELETE CASCADE,
    problem_id  BIGINT NOT NULL REFERENCES problems(id) ON DELETE CASCADE,
    "order"    INTEGER NOT NULL,
    PRIMARY KEY (session_id, problem_id)
);

CREATE TABLE IF NOT EXISTS scoreboards (
    session_id    BIGINT NOT NULL REFERENCES education_sessions(id) ON DELETE CASCADE,
    student_id    BIGINT NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    score         INTEGER NOT NULL DEFAULT 0 CHECK (score >= 0),
    solved_count  INTEGER NOT NULL DEFAULT 0 CHECK (solved_count >= 0),
    rank          INTEGER NOT NULL DEFAULT 1 CHECK (rank > 0),
    updated_at    TIMESTAMP NOT NULL DEFAULT NOW(),
    PRIMARY KEY (session_id, student_id)
);

CREATE TABLE IF NOT EXISTS audit_logs (
    id               BIGSERIAL PRIMARY KEY,
    user_id          BIGINT NOT NULL,
    user_role        VARCHAR(20) NOT NULL CHECK (user_role IN ('student','admin','super_admin')),
    action_type      VARCHAR(50) NOT NULL CHECK (action_type IN ('login','create','update','delete','submit','access_denied')),
    target_resource  VARCHAR(100),
    ip_address       VARCHAR(45),
    user_agent       VARCHAR(200),
    performed_at     TIMESTAMP NOT NULL DEFAULT NOW(),
    result           VARCHAR(20) NOT NULL CHECK (result IN ('success','failure')),
    error_message    TEXT
);

-- 2) Indexes
CREATE INDEX IF NOT EXISTS idx_problems_author_id ON problems(author_id);
CREATE INDEX IF NOT EXISTS idx_problems_category ON problems(category);
CREATE INDEX IF NOT EXISTS idx_problems_difficulty ON problems(difficulty);
CREATE INDEX IF NOT EXISTS idx_problems_visibility ON problems(visibility);
CREATE INDEX IF NOT EXISTS idx_test_cases_problem_id ON test_cases(problem_id);
CREATE INDEX IF NOT EXISTS idx_test_cases_problem_order ON test_cases(problem_id, "order");
CREATE INDEX IF NOT EXISTS idx_submissions_student_id ON submissions(student_id);
CREATE INDEX IF NOT EXISTS idx_submissions_problem_id ON submissions(problem_id);
CREATE INDEX IF NOT EXISTS idx_submissions_session_id ON submissions(session_id);
CREATE INDEX IF NOT EXISTS idx_submissions_submitted_at ON submissions(submitted_at DESC);
CREATE INDEX IF NOT EXISTS idx_submissions_student_problem ON submissions(student_id, problem_id, submitted_at DESC);
CREATE INDEX IF NOT EXISTS idx_submissions_session_student ON submissions(session_id, student_id, submitted_at DESC);
CREATE INDEX IF NOT EXISTS idx_judging_results_submission_id ON judging_results(submission_id);
CREATE INDEX IF NOT EXISTS idx_judging_results_status ON judging_results(status);
CREATE INDEX IF NOT EXISTS idx_education_sessions_creator_id ON education_sessions(creator_id);
CREATE INDEX IF NOT EXISTS idx_education_sessions_status ON education_sessions(status);
CREATE INDEX IF NOT EXISTS idx_education_sessions_start_time ON education_sessions(start_time);
CREATE INDEX IF NOT EXISTS idx_scoreboards_session_rank ON scoreboards(session_id, rank);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_performed_at ON audit_logs(performed_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action_type ON audit_logs(action_type);

-- 3) Trigger functions
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at := NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION increment_submission_count()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE problems
       SET submission_count = submission_count + 1
     WHERE id = NEW.problem_id;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION recalc_problem_accuracy()
RETURNS TRIGGER AS $$
DECLARE
    v_problem_id BIGINT;
BEGIN
    SELECT problem_id INTO v_problem_id
      FROM submissions
     WHERE id = NEW.submission_id;

    IF v_problem_id IS NULL THEN
        RETURN NULL;
    END IF;

    UPDATE problems p
       SET accuracy_rate = COALESCE(
                (
                    SELECT ROUND(
                        (COUNT(*) FILTER (WHERE jr.status = 'AC')::numeric
                         / NULLIF(COUNT(*), 0)::numeric) * 100, 2)
                    FROM judging_results jr
                    JOIN submissions s ON s.id = jr.submission_id
                   WHERE s.problem_id = v_problem_id
                ), 0),
           submission_count = (
                SELECT COUNT(*) FROM submissions s WHERE s.problem_id = v_problem_id
           )
     WHERE p.id = v_problem_id;

    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION upsert_scoreboard()
RETURNS TRIGGER AS $$
DECLARE
    v_session_id BIGINT;
    v_student_id BIGINT;
    v_solved INTEGER;
BEGIN
    SELECT session_id, student_id INTO v_session_id, v_student_id
      FROM submissions
     WHERE id = NEW.submission_id;

    IF v_session_id IS NULL THEN
        RETURN NULL;
    END IF;

    SELECT COUNT(DISTINCT s.problem_id) INTO v_solved
      FROM submissions s
      JOIN judging_results jr ON jr.submission_id = s.id
     WHERE s.session_id = v_session_id
       AND s.student_id = v_student_id
       AND jr.status = 'AC';

    INSERT INTO scoreboards (session_id, student_id, score, solved_count, rank, updated_at)
    VALUES (v_session_id, v_student_id, v_solved * 100, v_solved, 1, NOW())
    ON CONFLICT (session_id, student_id)
    DO UPDATE SET
        score = EXCLUDED.score,
        solved_count = EXCLUDED.solved_count,
        updated_at = NOW();

    -- 재계산된 랭크 적용 (score DESC, updated_at ASC, student_id ASC)
    WITH ranked AS (
        SELECT session_id, student_id,
               RANK() OVER (PARTITION BY session_id
                             ORDER BY score DESC, updated_at ASC, student_id ASC) AS r
        FROM scoreboards
        WHERE session_id = v_session_id
    )
    UPDATE scoreboards sb
       SET rank = r
      FROM ranked r
     WHERE sb.session_id = r.session_id
       AND sb.student_id = r.student_id
       AND sb.session_id = v_session_id;

    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- 4) Triggers
CREATE TRIGGER trg_problems_updated_at
BEFORE UPDATE ON problems
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_test_cases_updated_at
BEFORE UPDATE ON test_cases
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_education_sessions_updated_at
BEFORE UPDATE ON education_sessions
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_increment_submission_count
AFTER INSERT ON submissions
FOR EACH ROW EXECUTE FUNCTION increment_submission_count();

CREATE TRIGGER trg_recalc_problem_accuracy
AFTER INSERT OR UPDATE ON judging_results
FOR EACH ROW EXECUTE FUNCTION recalc_problem_accuracy();

CREATE TRIGGER trg_upsert_scoreboard
AFTER INSERT OR UPDATE ON judging_results
FOR EACH ROW EXECUTE FUNCTION upsert_scoreboard();

COMMIT;
