import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

async function testSupabaseREST() {
  console.log('=== Supabase REST API 테스트 ===\n');

  const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    }
  );

  try {
    console.log('Supabase URL:', process.env.SUPABASE_URL);
    console.log('\n1. users 테이블 조회 중...');

    const { data, error, count } = await supabase
      .from('users')
      .select('id, login_id, name, role', { count: 'exact' })
      .limit(5);

    if (error) {
      console.error('✗ 에러:', error.message);
      throw error;
    }

    console.log('✓ 성공!');
    console.log(`총 ${count}개의 사용자 중 최근 5개:`);
    console.table(data);

    console.log('\n✓ Supabase REST API 연결 성공!');
    console.log('네트워크가 HTTPS를 통한 Supabase 접속을 허용합니다.');

  } catch (error) {
    console.error('\n✗ 테스트 실패');
    console.error('에러:', error);
  }
}

testSupabaseREST();
