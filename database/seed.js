import pg from 'pg';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const { Client } = pg;

const connectionString = 'postgresql://postgres:claude0729@localhost:5432/postgres';

async function seed() {
  const client = new Client({ connectionString });

  try {
    await client.connect();
    console.log('데이터베이스 연결 성공');

    // 시드 파일 읽기
    let seedSQL = fs.readFileSync(
      path.join(__dirname, 'seeds.sql'),
      'utf8'
    );

    // BOM 제거
    if (seedSQL.charCodeAt(0) === 0xFEFF) {
      seedSQL = seedSQL.slice(1);
    }

    console.log('시드 데이터 삽입 시작...');
    await client.query(seedSQL);
    console.log('시드 데이터 삽입 완료');

    // 삽입된 데이터 확인
    console.log('\n=== 삽입된 데이터 요약 ===\n');

    // 관리자
    const admins = await client.query('SELECT id, login_id, name, role_level FROM administrators');
    console.log(`관리자: ${admins.rows.length}명`);
    admins.rows.forEach(row => {
      console.log(`  - ${row.name} (${row.login_id}) [${row.role_level}]`);
    });

    // 학생
    const students = await client.query('SELECT id, login_id, name, group_info FROM students');
    console.log(`\n학생: ${students.rows.length}명`);
    students.rows.forEach(row => {
      console.log(`  - ${row.name} (${row.login_id}) [${row.group_info}]`);
    });

    // 문제
    const problems = await client.query('SELECT id, title, category, difficulty, visibility FROM problems');
    console.log(`\n문제: ${problems.rows.length}개`);
    problems.rows.forEach(row => {
      console.log(`  - [${row.id}] ${row.title} (${row.category}, 난이도: ${row.difficulty}, ${row.visibility})`);
    });

    // 테스트 케이스
    const testCases = await client.query(`
      SELECT problem_id, COUNT(*) as count,
             COUNT(*) FILTER (WHERE is_public = true) as public_count,
             COUNT(*) FILTER (WHERE is_public = false) as private_count
      FROM test_cases
      GROUP BY problem_id
      ORDER BY problem_id
    `);
    console.log(`\n테스트 케이스:`);
    testCases.rows.forEach(row => {
      console.log(`  - 문제 ${row.problem_id}: 총 ${row.count}개 (공개: ${row.public_count}, 비공개: ${row.private_count})`);
    });

    // 교육 세션
    const sessions = await client.query('SELECT id, name, status, session_type FROM education_sessions');
    console.log(`\n교육 세션: ${sessions.rows.length}개`);
    sessions.rows.forEach(row => {
      console.log(`  - [${row.id}] ${row.name} (${row.status}, ${row.session_type})`);
    });

    // 제출
    const submissions = await client.query(`
      SELECT s.id, st.name as student_name, p.title as problem_title, jr.status
      FROM submissions s
      JOIN students st ON st.id = s.student_id
      JOIN problems p ON p.id = s.problem_id
      LEFT JOIN judging_results jr ON jr.submission_id = s.id
    `);
    console.log(`\n제출: ${submissions.rows.length}개`);
    submissions.rows.forEach(row => {
      console.log(`  - ${row.student_name} → "${row.problem_title}" [${row.status || 'N/A'}]`);
    });

    // 스코어보드
    const scoreboards = await client.query(`
      SELECT sb.session_id, s.name as student_name, sb.score, sb.solved_count, sb.rank
      FROM scoreboards sb
      JOIN students s ON s.id = sb.student_id
      ORDER BY sb.session_id, sb.rank
    `);
    console.log(`\n스코어보드: ${scoreboards.rows.length}개 엔트리`);
    scoreboards.rows.forEach(row => {
      console.log(`  - 세션 ${row.session_id}, ${row.rank}등: ${row.student_name} (점수: ${row.score}, 해결: ${row.solved_count})`);
    });

  } catch (error) {
    console.error('시드 데이터 삽입 실패:', error);
    process.exit(1);
  } finally {
    await client.end();
    console.log('\n데이터베이스 연결 종료');
  }
}

seed();
