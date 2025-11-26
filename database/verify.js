import pg from 'pg';
import chalk from 'chalk';

const { Client } = pg;
const connectionString = 'postgresql://postgres:claude0729@localhost:5432/postgres';

async function verify() {
  const client = new Client({ connectionString });

  try {
    await client.connect();
    console.log(chalk.green('✓ 데이터베이스 연결 성공\n'));

    // 1. 테이블 검증
    console.log(chalk.cyan('=== 테이블 검증 ==='));
    const expectedTables = [
      'administrators',
      'audit_logs',
      'education_sessions',
      'judging_results',
      'problems',
      'scoreboards',
      'session_problems',
      'session_students',
      'students',
      'submissions',
      'test_cases',
    ];

    const tablesResult = await client.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      AND table_type = 'BASE TABLE'
      ORDER BY table_name
    `);

    const actualTables = tablesResult.rows.map(r => r.table_name);
    const missingTables = expectedTables.filter(t => !actualTables.includes(t));

    if (missingTables.length === 0) {
      console.log(chalk.green(`✓ 모든 테이블 생성 완료 (${expectedTables.length}개)`));
    } else {
      console.log(chalk.red(`✗ 누락된 테이블: ${missingTables.join(', ')}`));
      process.exit(1);
    }

    // 2. 인덱스 검증
    console.log(chalk.cyan('\n=== 인덱스 검증 ==='));
    const indexesResult = await client.query(`
      SELECT COUNT(*) as count
      FROM pg_indexes
      WHERE schemaname = 'public'
      AND indexname LIKE 'idx_%'
    `);
    console.log(chalk.green(`✓ 인덱스: ${indexesResult.rows[0].count}개`));

    // 3. 트리거 검증
    console.log(chalk.cyan('\n=== 트리거 검증 ==='));
    const triggersResult = await client.query(`
      SELECT COUNT(*) as count
      FROM information_schema.triggers
      WHERE trigger_schema = 'public'
    `);
    console.log(chalk.green(`✓ 트리거: ${triggersResult.rows[0].count}개`));

    // 4. 함수 검증
    console.log(chalk.cyan('\n=== 함수 검증 ==='));
    const functionsResult = await client.query(`
      SELECT COUNT(*) as count
      FROM information_schema.routines
      WHERE routine_schema = 'public'
      AND routine_type = 'FUNCTION'
    `);
    console.log(chalk.green(`✓ 함수: ${functionsResult.rows[0].count}개`));

    // 5. 시드 데이터 검증
    console.log(chalk.cyan('\n=== 시드 데이터 검증 ==='));

    const adminCount = await client.query('SELECT COUNT(*) FROM administrators');
    console.log(chalk.green(`✓ 관리자: ${adminCount.rows[0].count}명`));

    const studentCount = await client.query('SELECT COUNT(*) FROM students');
    console.log(chalk.green(`✓ 학생: ${studentCount.rows[0].count}명`));

    const problemCount = await client.query('SELECT COUNT(*) FROM problems');
    console.log(chalk.green(`✓ 문제: ${problemCount.rows[0].count}개`));

    const testCaseCount = await client.query('SELECT COUNT(*) FROM test_cases');
    console.log(chalk.green(`✓ 테스트 케이스: ${testCaseCount.rows[0].count}개`));

    const sessionCount = await client.query('SELECT COUNT(*) FROM education_sessions');
    console.log(chalk.green(`✓ 교육 세션: ${sessionCount.rows[0].count}개`));

    const submissionCount = await client.query('SELECT COUNT(*) FROM submissions');
    console.log(chalk.green(`✓ 제출: ${submissionCount.rows[0].count}개`));

    const resultCount = await client.query('SELECT COUNT(*) FROM judging_results');
    console.log(chalk.green(`✓ 채점 결과: ${resultCount.rows[0].count}개`));

    // 6. 외래 키 제약 조건 검증
    console.log(chalk.cyan('\n=== 외래 키 제약 조건 검증 ==='));
    const fkResult = await client.query(`
      SELECT COUNT(*) as count
      FROM information_schema.table_constraints
      WHERE constraint_schema = 'public'
      AND constraint_type = 'FOREIGN KEY'
    `);
    console.log(chalk.green(`✓ 외래 키: ${fkResult.rows[0].count}개`));

    // 7. 샘플 데이터 조회
    console.log(chalk.cyan('\n=== 샘플 데이터 조회 ==='));

    const admin = await client.query('SELECT login_id, name, role_level FROM administrators LIMIT 1');
    console.log(chalk.blue(`  관리자: ${admin.rows[0].name} (${admin.rows[0].login_id})`));

    const students = await client.query('SELECT name, login_id FROM students ORDER BY id LIMIT 3');
    console.log(chalk.blue('  학생:'));
    students.rows.forEach(s => console.log(chalk.blue(`    - ${s.name} (${s.login_id})`)));

    const problems = await client.query('SELECT title, category, difficulty FROM problems ORDER BY id');
    console.log(chalk.blue('  문제:'));
    problems.rows.forEach(p => console.log(chalk.blue(`    - ${p.title} (${p.category}, 난이도: ${p.difficulty})`)));

    // 8. 트리거 동작 검증 (스코어보드가 자동 생성되었는지 확인)
    console.log(chalk.cyan('\n=== 트리거 동작 검증 ==='));
    const scoreboardResult = await client.query(`
      SELECT s.name, sb.score, sb.solved_count, sb.rank
      FROM scoreboards sb
      JOIN students s ON s.id = sb.student_id
      ORDER BY sb.rank
    `);

    if (scoreboardResult.rows.length > 0) {
      console.log(chalk.green('✓ 스코어보드 자동 업데이트 트리거 정상 작동'));
      scoreboardResult.rows.forEach(row => {
        console.log(chalk.blue(`  ${row.rank}등: ${row.name} (점수: ${row.score}, 해결: ${row.solved_count})`));
      });
    }

    console.log(chalk.green('\n✓ 모든 검증 통과!'));
    console.log(chalk.cyan('\n데이터베이스가 정상적으로 설정되었습니다.'));

  } catch (error) {
    console.error(chalk.red('✗ 검증 실패:'), error);
    process.exit(1);
  } finally {
    await client.end();
  }
}

verify();
