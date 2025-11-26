import { query } from './src/config/database.js';
import bcrypt from 'bcryptjs';

async function testPassword() {
  try {
    // admin 계정 확인
    const result = await query('SELECT login_id, password_hash FROM users WHERE login_id = $1', ['admin']);

    if (result.rows.length === 0) {
      console.log('admin 사용자를 찾을 수 없습니다.');
      return;
    }

    const user = result.rows[0];
    console.log('사용자:', user.login_id);
    console.log('저장된 해시:', user.password_hash);

    // 비밀번호 검증
    const password = 'admin123!';
    const isMatch = await bcrypt.compare(password, user.password_hash);
    console.log(`\n비밀번호 "${password}" 검증 결과:`, isMatch);

    // 새로운 해시 생성해서 비교
    const newHash = await bcrypt.hash(password, 10);
    console.log('\n새로 생성한 해시:', newHash);
    const newMatch = await bcrypt.compare(password, newHash);
    console.log('새 해시 검증 결과:', newMatch);

  } catch (error) {
    console.error('오류:', error);
  } finally {
    process.exit(0);
  }
}

testPassword();
