import { readFileSync } from 'fs';
import { getPool } from './src/config/database.js';

async function setupDatabase() {
  console.log('데이터베이스 스키마 설정 시작...\n');

  const pool = getPool();

  try {
    // 스키마 파일 읽기
    const schemaSQL = readFileSync('../database/schema-unified.sql', 'utf-8');

    // 스키마 실행
    await pool.query(schemaSQL);

    console.log('✓ 데이터베이스 스키마 적용 완료\n');

    // 테이블 확인
    const tableCheck = await pool.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      ORDER BY table_name
    `);

    console.log('생성된 테이블:');
    tableCheck.rows.forEach(row => {
      console.log(`  - ${row.table_name}`);
    });

    console.log('\n데이터베이스 설정 완료!');

  } catch (error) {
    console.error('데이터베이스 설정 중 오류:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

setupDatabase()
  .then(() => {
    console.log('\n스크립트 실행 완료');
    process.exit(0);
  })
  .catch(error => {
    console.error('실행 중 오류:', error);
    process.exit(1);
  });
