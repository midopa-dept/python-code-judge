import pg from 'pg';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const { Client } = pg;

const connectionString = 'postgresql://postgres:claude0729@localhost:5432/postgres';

async function migrate() {
  const client = new Client({ connectionString });

  try {
    await client.connect();
    console.log('데이터베이스 연결 성공');

    // 스키마 파일 읽기 (BOM 제거)
    // 통합 스키마 사용 (users 테이블 포함)
    let schemaSQL = fs.readFileSync(
      path.join(__dirname, 'schema-unified.sql'),
      'utf8'
    );

    // BOM 제거
    if (schemaSQL.charCodeAt(0) === 0xFEFF) {
      schemaSQL = schemaSQL.slice(1);
    }

    console.log('스키마 마이그레이션 시작...');
    await client.query(schemaSQL);
    console.log('스키마 마이그레이션 완료');

    // 테이블 목록 확인
    const tablesResult = await client.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      AND table_type = 'BASE TABLE'
      ORDER BY table_name;
    `);

    console.log('\n생성된 테이블 목록:');
    tablesResult.rows.forEach((row, index) => {
      console.log(`${index + 1}. ${row.table_name}`);
    });

    // 인덱스 확인
    const indexesResult = await client.query(`
      SELECT indexname
      FROM pg_indexes
      WHERE schemaname = 'public'
      AND indexname LIKE 'idx_%'
      ORDER BY indexname;
    `);

    console.log(`\n생성된 인덱스: ${indexesResult.rows.length}개`);

    // 트리거 확인
    const triggersResult = await client.query(`
      SELECT trigger_name
      FROM information_schema.triggers
      WHERE trigger_schema = 'public'
      ORDER BY trigger_name;
    `);

    console.log(`생성된 트리거: ${triggersResult.rows.length}개`);

    // 함수 확인
    const functionsResult = await client.query(`
      SELECT routine_name
      FROM information_schema.routines
      WHERE routine_schema = 'public'
      AND routine_type = 'FUNCTION'
      ORDER BY routine_name;
    `);

    console.log(`생성된 함수: ${functionsResult.rows.length}개`);

  } catch (error) {
    console.error('마이그레이션 실패:', error);
    process.exit(1);
  } finally {
    await client.end();
    console.log('\n데이터베이스 연결 종료');
  }
}

migrate();
