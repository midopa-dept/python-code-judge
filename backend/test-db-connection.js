import { testDatabaseConnection, query } from './src/config/database.js';

async function testConnection() {
  console.log('데이터베이스 연결 테스트 시작...\n');

  try {
    // 1. 기본 연결 테스트
    const connected = await testDatabaseConnection();
    console.log('연결 테스트 결과:', connected ? '성공' : '실패');

    if (!connected) {
      process.exit(1);
    }

    // 2. 테이블 목록 조회
    console.log('\n테이블 목록 조회:');
    const tablesResult = await query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      AND table_type = 'BASE TABLE'
      ORDER BY table_name
    `);
    console.log(`  총 ${tablesResult.rows.length}개 테이블`);
    tablesResult.rows.forEach(row => console.log(`  - ${row.table_name}`));

    // 3. 데이터 카운트
    console.log('\n데이터 카운트:');
    const counts = {
      administrators: await query('SELECT COUNT(*) FROM administrators'),
      students: await query('SELECT COUNT(*) FROM students'),
      problems: await query('SELECT COUNT(*) FROM problems'),
      test_cases: await query('SELECT COUNT(*) FROM test_cases'),
      education_sessions: await query('SELECT COUNT(*) FROM education_sessions'),
      submissions: await query('SELECT COUNT(*) FROM submissions'),
      judging_results: await query('SELECT COUNT(*) FROM judging_results'),
      scoreboards: await query('SELECT COUNT(*) FROM scoreboards'),
    };

    for (const [table, result] of Object.entries(counts)) {
      console.log(`  - ${table}: ${result.rows[0].count}개`);
    }

    console.log('\n모든 테스트 통과!');
    process.exit(0);

  } catch (error) {
    console.error('테스트 실패:', error);
    process.exit(1);
  }
}

testConnection();
