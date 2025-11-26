import http from 'http';

// HTTP 요청 헬퍼 함수
function makeRequest(path, method = 'GET', data = null, token = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 3000,
      path: path,
      method: method,
      headers: {
        'Content-Type': 'application/json',
      }
    };

    if (token) {
      options.headers['Authorization'] = `Bearer ${token}`;
    }

    const req = http.request(options, (res) => {
      let responseData = '';
      res.on('data', (chunk) => responseData += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(responseData);
          resolve({
            status: res.statusCode,
            data: parsed
          });
        } catch (e) {
          resolve({
            status: res.statusCode,
            data: responseData
          });
        }
      });
    });

    req.on('error', (e) => reject(e));

    if (data) {
      req.write(JSON.stringify(data));
    }

    req.end();
  });
}

// 추가 기능 테스트
async function runExtraTests() {
  console.log('=== Phase 2: 추가 기능 테스트 (PATCH, DELETE) ===\n');

  let adminToken = null;
  let studentId = 2; // 테스트 학생 ID

  try {
    // 1. 관리자 로그인
    console.log('1️⃣ 관리자 로그인');
    const adminLoginRes = await makeRequest('/api/auth/login', 'POST', {
      loginId: 'admin',
      password: 'admin1234'
    });

    if (adminLoginRes.status === 200) {
      adminToken = adminLoginRes.data.data.token;
      console.log('✅ 관리자 로그인 성공\n');
    } else {
      console.log('❌ 관리자 로그인 실패');
      return;
    }

    // 2. PATCH /api/users/students/:id - 학생 정보 수정
    console.log(`2️⃣ PATCH /api/users/students/${studentId} - 학생 정보 수정`);
    const updateRes = await makeRequest(
      `/api/users/students/${studentId}`,
      'PATCH',
      {
        groupInfo: '2소대',
        accountStatus: 'active'
      },
      adminToken
    );

    if (updateRes.status === 200) {
      console.log('✅ 학생 정보 수정 성공');
      console.log(`   메시지: ${updateRes.data.message}\n`);
    } else {
      console.log('❌ 학생 정보 수정 실패:', updateRes.data, '\n');
    }

    // 3. 수정된 정보 확인
    console.log(`3️⃣ GET /api/users/students/${studentId} - 수정 확인`);
    const checkRes = await makeRequest(`/api/users/students/${studentId}`, 'GET', null, adminToken);

    if (checkRes.status === 200) {
      console.log('✅ 수정 내용 확인 완료');
      console.log(`   그룹 정보: ${checkRes.data.data.groupInfo}`);
      console.log(`   계정 상태: ${checkRes.data.data.accountStatus}\n`);
    } else {
      console.log('❌ 수정 내용 확인 실패\n');
    }

    // 4. 원래대로 복구
    console.log(`4️⃣ PATCH /api/users/students/${studentId} - 원래대로 복구`);
    const restoreRes = await makeRequest(
      `/api/users/students/${studentId}`,
      'PATCH',
      {
        groupInfo: '1소대'
      },
      adminToken
    );

    if (restoreRes.status === 200) {
      console.log('✅ 정보 복구 성공\n');
    } else {
      console.log('❌ 정보 복구 실패\n');
    }

    // 5. accountStatus 필터 테스트
    console.log('5️⃣ GET /api/users/students?accountStatus=active - 상태 필터');
    const statusFilterRes = await makeRequest(
      '/api/users/students?accountStatus=active',
      'GET',
      null,
      adminToken
    );

    if (statusFilterRes.status === 200) {
      console.log('✅ 계정 상태 필터 성공');
      console.log(`   활성 학생 수: ${statusFilterRes.data.data.students.length}\n`);
    } else {
      console.log('❌ 계정 상태 필터 실패\n');
    }

    // 6. DELETE 테스트는 실제 데이터를 삭제하므로 주석 처리
    console.log('6️⃣ DELETE /api/users/students/:id - 학생 삭제 (테스트 스킵)');
    console.log('⚠️  실제 데이터 삭제를 방지하기 위해 스킵\n');

    console.log('=== 추가 기능 테스트 완료 ===');

  } catch (error) {
    console.error('\n테스트 중 오류 발생:', error);
  }
}

// 테스트 실행
runExtraTests().then(() => {
  process.exit(0);
}).catch(error => {
  console.error('실행 중 오류:', error);
  process.exit(1);
});
