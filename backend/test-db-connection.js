import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;

async function testConnection() {
  const connectionString = process.env.DATABASE_URL;

  console.log('=== 데이터베이스 연결 테스트 ===');
  console.log('Connection String:', connectionString?.replace(/:[^:@]+@/, ':****@'));

  const isPooler = connectionString.includes('pooler.supabase.com');

  const pool = new Pool({
    connectionString,
    ...(!isPooler && {
      ssl: {
        rejectUnauthorized: false,
      },
    }),
  });

  try {
    console.log('\n연결 시도 중...');
    const client = await pool.connect();
    console.log('✓ 연결 성공!');

    const result = await client.query('SELECT current_user, current_database(), version()');
    console.log('\n데이터베이스 정보:');
    console.log('- 사용자:', result.rows[0].current_user);
    console.log('- 데이터베이스:', result.rows[0].current_database);
    console.log('- 버전:', result.rows[0].version.split('\n')[0]);

    client.release();
    await pool.end();

    console.log('\n✓ 테스트 완료');
    process.exit(0);
  } catch (error) {
    console.error('\n✗ 연결 실패');
    console.error('에러 코드:', error.code);
    console.error('에러 메시지:', error.message);

    if (error.code === '28P01') {
      console.error('\n비밀번호 인증 실패입니다.');
      console.error('Supabase 대시보드에서 다음을 확인하세요:');
      console.error('1. Settings > Database > Connection string (URI)');
      console.error('2. 비밀번호를 재설정했다면 새 connection string을 복사하세요.');
    }

    await pool.end();
    process.exit(1);
  }
}

testConnection();
