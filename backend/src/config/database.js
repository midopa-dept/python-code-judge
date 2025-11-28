import { createClient } from '@supabase/supabase-js';
import { config } from './env.js';

let supabaseClient = null;

export const getSupabaseClient = () => {
  if (!supabaseClient) {
    supabaseClient = createClient(
      config.supabase.url,
      config.supabase.serviceRoleKey,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );
    console.log('Supabase client created');
  }
  return supabaseClient;
};

// --- Query Handlers ---

const handlers = [
  // 1. Users Handlers
  {
    // Find User by Login ID
    match: (text) => /SELECT.*FROM\s+users\s+WHERE\s+login_id\s*=\s*\$1/is.test(text),
    execute: async (client, text, params) => {
      const { data, error } = await client.from('users').select('*').eq('login_id', params[0]).limit(1);
      if (error) throw error;
      return { rows: data || [] };
    }
  },
  {
    // Find User by ID
    match: (text) => /SELECT.*FROM\s+users\s+WHERE\s+id\s*=\s*\$1/is.test(text),
    execute: async (client, text, params) => {
      const { data, error } = await client.from('users').select('*').eq('id', params[0]).limit(1);
      if (error) throw error;
      return { rows: data || [] };
    }
  },
  {
    // Insert User
    match: (text) => /INSERT\s+INTO\s+users/is.test(text),
    execute: async (client, text, params) => {
      const insertData = {
        login_id: params[0],
        name: params[1],
        password_hash: params[2],
        email: params[3] || null,
        group_info: params[4] || null,
        role: text.includes("'student'") ? 'student' : 'admin',
        account_status: 'active'
      };
      const { data, error } = await client.from('users').insert(insertData).select().single();
      if (error) throw error;
      return { rows: [data] };
    }
  },
  {
    // Update Last Login
    match: (text) => /UPDATE\s+users\s+SET\s+last_login/is.test(text),
    execute: async (client, text, params) => {
      const { data, error } = await client.from('users').update({ last_login: new Date().toISOString() }).eq('id', params[0]).select();
      if (error) throw error;
      return { rows: data || [] };
    }
  },
  {
    // Update Password
    match: (text) => /UPDATE\s+users\s+SET\s+password_hash/is.test(text),
    execute: async (client, text, params) => {
      const { data, error } = await client.from('users').update({ password_hash: params[0], updated_at: new Date().toISOString() }).eq('id', params[1]).select();
      if (error) throw error;
      return { rows: data || [] };
    }
  },

  // 2. Problems Handlers
  {
    // Problem Detail (WHERE p.id = $1)
    match: (text) => /FROM\s+problems\s+p.*WHERE\s+p\.id\s*=\s*\$1/is.test(text),
    execute: async (client, text, params) => {
      const problemId = params[0];
      const { data, error } = await client
        .from('problems')
        .select(`
          id, title, score, description, category, difficulty, time_limit, memory_limit, visibility, judge_config, created_at,
          created_by ( name )
        `)
        .eq('id', problemId)
        .single();

      if (error) { console.error('Problem Detail Error:', error); return { rows: [] }; }
      if (!data) return { rows: [] };

      const processed = { ...data, author_name: data.created_by?.name, accuracy_rate: 0, submission_count: 0, is_solved: false };
      delete processed.created_by;
      return { rows: [processed] };
    }
  },
  {
    // Problem List (Complex Join)
    match: (text) => /FROM\s+problems\s+p.*LEFT\s+JOIN/is.test(text),
    execute: async (client, text, params) => {
      // 기본 쿼리: 문제 정보만 가져오기 (통계는 0으로 설정)
      let query = client.from('problems').select('id, title, score, category, difficulty, visibility, created_at').order('created_at', { ascending: false });

      const sqlUpper = text.toUpperCase();
      let paramIdx = 0;

      // 카테고리 필터
      if (sqlUpper.includes('P.CATEGORY = $')) {
        if (params[paramIdx]) query = query.eq('category', params[paramIdx]);
        paramIdx++;
      }

      // 난이도 필터
      if (sqlUpper.includes('P.DIFFICULTY = $')) {
        if (params[paramIdx]) query = query.eq('difficulty', params[paramIdx]);
        paramIdx++;
      }

      // 검색어 필터
      if (sqlUpper.includes('P.TITLE ILIKE') || sqlUpper.includes('P.DESCRIPTION ILIKE')) {
        if (params[paramIdx]) {
          const term = params[paramIdx].replace(/%/g, '');
          query = query.or(`title.ilike.%${term}%,description.ilike.%${term}%`);
        }
        paramIdx++;
      }

      // Visibility 필터 (학생용)
      if (sqlUpper.includes("P.VISIBILITY = 'PUBLIC'")) {
        query = query.eq('visibility', 'public');
      }

      // 페이지네이션 (마지막 2개 파라미터)
      const limit = params[params.length - 2];
      const offset = params[params.length - 1];

      if (limit && offset !== undefined) {
        query = query.range(offset, offset + limit - 1);
      }

      const { data, error } = await query;
      if (error) { console.error('Problem List Error:', error); return { rows: [] }; }

      // ProblemModel.toListDTO가 기대하는 snake_case 필드명으로 반환
      const processed = data.map(p => ({
        ...p,
        accuracy_rate: 0,
        submission_count: 0,
        is_solved: false,
        last_status: null
      }));
      return { rows: processed };
    }
  },
  {
    // Problem Count
    match: (text) => /SELECT\s+COUNT\(\*\)\s+as\s+total\s+FROM\s+problems/is.test(text),
    execute: async (client, text, params) => {
      const { count, error } = await client.from('problems').select('*', { count: 'exact', head: true });
      if (error) throw error;
      return { rows: [{ total: count || 0 }] };
    }
  },
  {
    // Find Basic Problem by ID (id, visibility만 조회)
    match: (text) => /SELECT\s+id,\s*visibility\s+FROM\s+problems\s+WHERE\s+id\s*=\s*\$1/is.test(text),
    execute: async (client, text, params) => {
      const { data, error } = await client.from('problems').select('id, visibility').eq('id', params[0]).single();
      if (error) {
        if (error.code === 'PGRST116') return { rows: [] }; // Not found
        throw error;
      }
      return { rows: data ? [data] : [] };
    }
  },
  {
    // Find Problem for Submission (제출용 문제 정보 조회)
    match: (text) => /SELECT\s+id,\s*title,\s*visibility,\s*time_limit,\s*memory_limit,\s*score\s+FROM\s+problems\s+WHERE\s+id\s*=\s*\$1/is.test(text),
    execute: async (client, text, params) => {
      const { data, error } = await client.from('problems').select('id, title, visibility, time_limit, memory_limit, score').eq('id', params[0]).single();
      if (error) {
        if (error.code === 'PGRST116') return { rows: [] }; // Not found
        throw error;
      }
      return { rows: data ? [data] : [] };
    }
  },
  {
    // Insert Problem
    match: (text) => /INSERT\s+INTO\s+problems/is.test(text),
    execute: async (client, text, params) => {
      const insertData = {
        title: params[0],
        description: params[1],
        category: params[2],
        difficulty: params[3],
        time_limit: params[4],
        memory_limit: params[5],
        visibility: params[6],
        judge_config: params[7],
        created_by: params[8]
      };
      const { data, error } = await client.from('problems').insert(insertData).select('id').single();
      if (error) throw error;
      return { rows: [data] };
    }
  },
  {
    // Update Problem
    match: (text) => /UPDATE\s+problems\s+SET.*WHERE\s+id\s*=\s*\$/is.test(text),
    execute: async (client, text, params) => {
      // 마지막 파라미터가 problemId
      const problemId = params[params.length - 1];
      const updateData = {};

      // SET 절 파싱 (간단한 방식)
      if (text.includes('title =')) updateData.title = params[0];
      if (text.includes('description =')) updateData.description = params[text.includes('title =') ? 1 : 0];
      if (text.includes('category =')) updateData.category = params.find(p => typeof p === 'string' && ['입출력', '조건문', '반복문', '배열', '문자열', '함수', '알고리즘'].includes(p));
      if (text.includes('difficulty =')) updateData.difficulty = params.find(p => typeof p === 'number' && p >= 1 && p <= 5);
      if (text.includes('time_limit =')) updateData.time_limit = params.find(p => typeof p === 'number' && p > 0);
      if (text.includes('memory_limit =')) updateData.memory_limit = params.find(p => typeof p === 'number' && p >= 128);
      if (text.includes('score =')) updateData.score = params.find(p => typeof p === 'number' && p >= 1);
      if (text.includes('visibility =')) updateData.visibility = params.find(p => ['public', 'private', 'draft'].includes(p));
      if (text.includes('judge_config =')) updateData.judge_config = params.find(p => typeof p === 'string' && p.startsWith('{'));

      updateData.updated_at = new Date().toISOString();

      const { data, error } = await client.from('problems').update(updateData).eq('id', problemId).select('id').single();
      if (error) throw error;
      return { rows: data ? [data] : [] };
    }
  },
  {
    // Delete Problem
    match: (text) => /DELETE\s+FROM\s+problems\s+WHERE\s+id\s*=\s*\$1/is.test(text),
    execute: async (client, text, params) => {
      const { data, error } = await client.from('problems').delete().eq('id', params[0]).select('id');
      if (error) throw error;
      return { rows: data || [] };
    }
  },

  // 3. Test Cases Handlers
  {
    // Get Test Cases by Problem ID
    match: (text) => /SELECT.*FROM\s+test_cases\s+WHERE\s+problem_id\s*=\s*\$1/is.test(text),
    execute: async (client, text, params) => {
      let query = client.from('test_cases').select('id, input_data, expected_output, is_public, test_order').eq('problem_id', params[0]);

      if (text.toUpperCase().includes('IS_PUBLIC = TRUE')) {
        query = query.eq('is_public', true);
      }

      query = query.order('test_order', { ascending: true }).order('id', { ascending: true });

      const { data, error } = await query;
      if (error) throw error;
      return { rows: data || [] };
    }
  },
  {
    // Insert Test Case
    match: (text) => /INSERT\s+INTO\s+test_cases/is.test(text),
    execute: async (client, text, params) => {
      const insertData = {
        problem_id: params[0],
        input_data: params[1],
        expected_output: params[2],
        is_public: params[3],
        test_order: params[4] || 0
      };
      const { data, error } = await client.from('test_cases').insert(insertData).select('id').single();
      if (error) throw error;
      return { rows: [data] };
    }
  },
  {
    // Update Test Case
    match: (text) => /UPDATE\s+test_cases\s+SET.*WHERE\s+problem_id\s*=\s*\$/is.test(text),
    execute: async (client, text, params) => {
      // 마지막 2개 파라미터가 problemId, testCaseId
      const testCaseId = params[params.length - 1];
      const problemId = params[params.length - 2];
      const updateData = {};

      // 파라미터 순서에 따라 매핑 (간단한 방식)
      let idx = 0;
      if (text.includes('input_data =')) updateData.input_data = params[idx++];
      if (text.includes('expected_output =')) updateData.expected_output = params[idx++];
      if (text.includes('is_public =')) updateData.is_public = params[idx++];
      if (text.includes('test_order =')) updateData.test_order = params[idx++];

      const { data, error } = await client.from('test_cases').update(updateData).eq('problem_id', problemId).eq('id', testCaseId).select('id').single();
      if (error) throw error;
      return { rows: data ? [data] : [] };
    }
  },
  {
    // Delete Test Case
    match: (text) => /DELETE\s+FROM\s+test_cases\s+WHERE\s+problem_id\s*=\s*\$1\s+AND\s+id\s*=\s*\$2/is.test(text),
    execute: async (client, text, params) => {
      const { data, error } = await client.from('test_cases').delete().eq('problem_id', params[0]).eq('id', params[1]).select('id');
      if (error) throw error;
      return { rows: data || [] };
    }
  },
  {
    // Delete All Test Cases by Problem ID
    match: (text) => /DELETE\s+FROM\s+test_cases\s+WHERE\s+problem_id\s*=\s*\$1/is.test(text),
    execute: async (client, text, params) => {
      const { data, error } = await client.from('test_cases').delete().eq('problem_id', params[0]).select('id');
      if (error) throw error;
      return { rowCount: data?.length || 0, rows: data || [] };
    }
  },

  // 4. Education Sessions Handlers
  {
    // Insert Education Session
    match: (text) => /INSERT\s+INTO\s+education_sessions/is.test(text),
    execute: async (client, text, params) => {
      const insertData = {
        name: params[0],
        start_time: params[1],
        end_time: params[2],
        status: params[3],
        session_type: params[4],
        allow_resubmit: params[5],
        creator_id: params[6]
      };
      const { data, error } = await client.from('education_sessions').insert(insertData).select('id').single();
      if (error) throw error;
      return { rows: [data] };
    }
  },

  // 5. Submissions Handlers (기본적인 것만)
  {
    // Check Duplicate Submission (중복 제출 체크)
    match: (text) => /SELECT\s+1\s+FROM\s+submissions\s+WHERE\s+student_id\s*=\s*\$1\s+AND\s+problem_id\s*=\s*\$2\s+AND\s+submitted_at\s+>=\s+NOW\(\)/is.test(text),
    execute: async (client, text, params) => {
      // 5초 이내 중복 제출 체크 - Supabase에서는 서버 시간을 직접 확인할 수 없으므로 클라이언트 시간 사용
      const fiveSecondsAgo = new Date(Date.now() - 5000).toISOString();
      const { data, error } = await client
        .from('submissions')
        .select('id')
        .eq('student_id', params[0])
        .eq('problem_id', params[1])
        .gte('submitted_at', fiveSecondsAgo)
        .limit(1);
      if (error) throw error;
      return { rows: data || [] };
    }
  },
  {
    // Count Submissions (제출 개수 조회)
    match: (text) => /SELECT\s+COUNT\(\*\)\s+as\s+(count|total)\s+FROM\s+submissions\s+s/is.test(text),
    execute: async (client, text, params) => {
      let query = client.from('submissions').select('*', { count: 'exact', head: true });
      
      // WHERE 조건 처리
      if (params.length > 0 && text.includes('student_id')) {
        query = query.eq('student_id', params[0]);
      } else if (params.length > 0 && text.includes('problem_id')) {
        query = query.eq('problem_id', params[0]);
      }
      
      const { count, error } = await query;
      if (error) throw error;
      return { rows: [{ total: count || 0, count: count || 0 }] };
    }
  },
  {
    // Get Submissions List (제출 목록 조회)
    match: (text) => /SELECT\s+s\.id,\s*s\.student_id.*FROM\s+submissions\s+s\s+JOIN\s+users\s+u.*JOIN\s+problems\s+p.*ORDER BY\s+s\.submitted_at/is.test(text),
    execute: async (client, text, params) => {
      // 파라미터 파싱: 마지막 2개는 limit, offset
      const limit = params[params.length - 2];
      const offset = params[params.length - 1];
      const studentId = params[0];
      
      const { data, error } = await client
        .from('submissions')
        .select(`
          id,
          student_id,
          problem_id,
          status,
          execution_time,
          memory_usage,
          submitted_at,
          users!student_id(name),
          problems!problem_id(title)
        `)
        .eq('student_id', studentId)
        .order('submitted_at', { ascending: false })
        .range(offset, offset + limit - 1);
      
      if (error) throw error;
      
      // 결과 변환
      const rows = (data || []).map(row => ({
        id: row.id,
        student_id: row.student_id,
        student_name: row.users?.name || '',
        problem_id: row.problem_id,
        problem_title: row.problems?.title || '',
        status: row.status,
        execution_time: row.execution_time,
        memory_usage: row.memory_usage,
        submitted_at: row.submitted_at
      }));
      
      return { rows };
    }
  },
  {
    // Get Submission Result (제출 결과 상세 조회)
    match: (text) => /SELECT\s+s\.id,\s*s\.student_id.*s\.passed_cases,\s*s\.total_cases.*FROM\s+submissions\s+s\s+JOIN\s+users.*WHERE\s+s\.id\s*=\s*\$1/is.test(text),
    execute: async (client, text, params) => {
      const submissionId = params[0];
      
      const { data, error } = await client
        .from('submissions')
        .select(`
          id,
          student_id,
          problem_id,
          status,
          passed_cases,
          total_cases,
          execution_time,
          memory_usage,
          error_message,
          submitted_at,
          judged_at,
          users!student_id(name),
          problems!problem_id(title)
        `)
        .eq('id', submissionId)
        .single();
      
      if (error) {
        if (error.code === 'PGRST116') return { rows: [] };
        throw error;
      }
      
      // 결과 변환
      const row = {
        id: data.id,
        student_id: data.student_id,
        student_name: data.users?.name || '',
        problem_id: data.problem_id,
        problem_title: data.problems?.title || '',
        status: data.status,
        passed_cases: data.passed_cases,
        total_cases: data.total_cases,
        execution_time: data.execution_time,
        memory_usage: data.memory_usage,
        error_message: data.error_message,
        submitted_at: data.submitted_at,
        judged_at: data.judged_at
      };
      
      return { rows: [row] };
    }
  },

  // 5. Submissions Handlers
  {
    // Insert Submission
    match: (text) => /INSERT\s+INTO\s+submissions/is.test(text),
    execute: async (client, text, params) => {
      const insertData = {
        student_id: params[0],
        problem_id: params[1],
        session_id: params[2] || null,
        code: params[3],
        code_size: params[4] || (params[3]?.length || 0),
        status: params[5] || 'pending',
        python_version: params[6] || '3.11',
        error_message: params[7] || null,
        execution_time: params[8] || null,
        memory_usage: params[9] || null,
        passed_cases: params[10] || null,
        total_cases: params[11] || null
      };
      const { data, error } = await client.from('submissions').insert(insertData).select('id').single();
      if (error) throw error;
      return { rows: [data] };
    }
  },
  {
    // Update Submission Result (채점 결과 업데이트)
    match: (text) => /UPDATE\s+submissions\s+SET\s+status\s*=\s*\$1.*execution_time.*judged_at\s*=\s*NOW\(\)/is.test(text),
    execute: async (client, text, params) => {
      const updateData = {
        status: params[0],
        execution_time: params[1],
        memory_usage: params[2],
        error_message: params[3],
        passed_cases: params[4],
        total_cases: params[5],
        judged_at: new Date().toISOString()
      };
      const submissionId = params[6];
      
      const { data, error } = await client
        .from('submissions')
        .update(updateData)
        .eq('id', submissionId)
        .select();
      
      if (error) throw error;
      return { rows: data || [] };
    }
  },
  {
    // Update Submission Status (제출 상태 업데이트 - 취소 등)
    match: (text) => /UPDATE\s+submissions\s+SET\s+status\s*=\s*'cancelled'/is.test(text),
    execute: async (client, text, params) => {
      const submissionId = params[0];
      
      const { data, error } = await client
        .from('submissions')
        .update({ 
          status: 'cancelled', 
          error_message: '사용자에 의해 취소됨' 
        })
        .eq('id', submissionId)
        .select();
      
      if (error) throw error;
      return { rows: data || [] };
    }
  },
  {
    // Get Submission Meta (제출 메타 정보 조회 - 스코어보드 업데이트용)
    match: (text) => /SELECT\s+id,\s*student_id,\s*session_id,\s*problem_id,\s*submitted_at\s+FROM\s+submissions\s+WHERE\s+id\s*=\s*\$1/is.test(text),
    execute: async (client, text, params) => {
      const { data, error } = await client
        .from('submissions')
        .select('id, student_id, session_id, problem_id, submitted_at')
        .eq('id', params[0])
        .single();
      
      if (error) {
        if (error.code === 'PGRST116') return { rows: [] };
        throw error;
      }
      
      return { rows: data ? [data] : [] };
    }
  },
  {
    // Check if Problem Solved Before (이전 정답 확인)
    match: (text) => /SELECT\s+1\s+FROM\s+submissions\s+WHERE\s+student_id.*AND\s+status\s*=\s*'AC'/is.test(text),
    execute: async (client, text, params) => {
      const { data, error } = await client
        .from('submissions')
        .select('id')
        .eq('student_id', params[0])
        .eq('problem_id', params[1])
        .eq('session_id', params[2])
        .eq('status', 'AC')
        .neq('id', params[3])
        .limit(1);
      
      if (error) throw error;
      return { rows: data || [] };
    }
  },
  {
    // Get Test Cases for Judging (채점용 테스트 케이스 조회)
    match: (text) => /SELECT\s+id,\s*input_data,\s*expected_output.*FROM\s+test_cases\s+WHERE\s+problem_id\s*=\s*\$1\s+ORDER BY\s+test_order/is.test(text),
    execute: async (client, text, params) => {
      const { data, error } = await client
        .from('test_cases')
        .select('id, input_data, expected_output, is_public, test_order')
        .eq('problem_id', params[0])
        .order('test_order', { ascending: true })
        .order('id', { ascending: true });
      
      if (error) throw error;
      return { rows: data || [] };
    }
  },
  {
    // Delete Submissions by Session ID
    match: (text) => /DELETE\s+FROM\s+submissions\s+WHERE\s+session_id\s*=\s*\$1/is.test(text),
    execute: async (client, text, params) => {
      const { data, error } = await client.from('submissions').delete().eq('session_id', params[0]).select('id');
      if (error) throw error;
      return { rowCount: data?.length || 0, rows: data || [] };
    }
  },

  // 6. Scoreboards Handlers
  {
    // Get Problem Score (문제 점수 조회)
    match: (text) => /SELECT\s+score\s+FROM\s+problems\s+WHERE\s+id\s*=\s*\$1\s+LIMIT\s+1/is.test(text),
    execute: async (client, text, params) => {
      const { data, error } = await client
        .from('problems')
        .select('score')
        .eq('id', params[0])
        .single();
      
      if (error) {
        if (error.code === 'PGRST116') return { rows: [] };
        throw error;
      }
      
      return { rows: data ? [data] : [] };
    }
  },
  {
    // Insert/Upsert Scoreboard (AC 시 스코어 업데이트)
    match: (text) => /INSERT\s+INTO\s+scoreboards\s+AS\s+sb.*ON\s+CONFLICT/is.test(text),
    execute: async (client, text, params) => {
      const sessionId = params[0];
      const studentId = params[1];
      const scoreToAdd = params[2];
      
      // 기존 스코어보드 조회
      const { data: existing, error: selectError } = await client
        .from('scoreboards')
        .select('id, score, solved_count')
        .eq('session_id', sessionId)
        .eq('student_id', studentId)
        .single();
      
      if (selectError && selectError.code !== 'PGRST116') throw selectError;
      
      let result;
      if (existing) {
        // 기존 데이터 업데이트
        const { data, error } = await client
          .from('scoreboards')
          .update({
            score: existing.score + scoreToAdd,
            solved_count: existing.solved_count + 1,
            updated_at: new Date().toISOString()
          })
          .eq('id', existing.id)
          .select();
        if (error) throw error;
        result = data;
      } else {
        // 새 데이터 삽입
        const { data, error } = await client
          .from('scoreboards')
          .insert({
            session_id: sessionId,
            student_id: studentId,
            score: scoreToAdd,
            solved_count: 1,
            rank: 1,
            updated_at: new Date().toISOString()
          })
          .select();
        if (error) throw error;
        result = data;
      }
      
      return { rows: result || [] };
    }
  },
  {
    // Get Scoreboard Ranking (랭킹 계산을 위한 스코어보드 조회)
    match: (text) => /SELECT\s+sb\.student_id.*COALESCE\(ac\.first_ac_time.*FROM\s+scoreboards\s+sb.*WHERE\s+sb\.session_id\s*=\s*\$1.*ORDER BY\s+sb\.score/is.test(text),
    execute: async (client, text, params) => {
      const sessionId = params[0];
      
      // 스코어보드와 최초 정답 시간 조회
      const { data: scoreboards, error: sbError } = await client
        .from('scoreboards')
        .select('student_id, score')
        .eq('session_id', sessionId);
      
      if (sbError) throw sbError;
      
      // 각 학생의 최초 정답 시간 조회
      const { data: submissions, error: subError } = await client
        .from('submissions')
        .select('student_id, submitted_at')
        .eq('session_id', sessionId)
        .eq('status', 'AC')
        .order('submitted_at', { ascending: true });
      
      if (subError) throw subError;
      
      // 학생별 최초 정답 시간 계산
      const firstAcMap = {};
      submissions?.forEach(sub => {
        if (!firstAcMap[sub.student_id]) {
          firstAcMap[sub.student_id] = sub.submitted_at;
        }
      });
      
      // 결과 생성 및 정렬
      const rows = (scoreboards || []).map(sb => ({
        student_id: sb.student_id,
        score: sb.score,
        first_ac_time: firstAcMap[sb.student_id] || new Date().toISOString()
      })).sort((a, b) => {
        if (b.score !== a.score) return b.score - a.score;
        return new Date(a.first_ac_time) - new Date(b.first_ac_time);
      });
      
      return { rows };
    }
  },
  {
    // Update Scoreboard Rank (랭킹 업데이트)
    match: (text) => /UPDATE\s+scoreboards\s+SET\s+rank\s*=\s*\$1.*WHERE\s+session_id\s*=\s*\$2\s+AND\s+student_id\s*=\s*\$3/is.test(text),
    execute: async (client, text, params) => {
      const rank = params[0];
      const sessionId = params[1];
      const studentId = params[2];
      
      const { data, error } = await client
        .from('scoreboards')
        .update({ 
          rank: rank,
          updated_at: new Date().toISOString()
        })
        .eq('session_id', sessionId)
        .eq('student_id', studentId)
        .select();
      
      if (error) throw error;
      return { rows: data || [] };
    }
  },
  {
    // Delete Scoreboards by Session ID
    match: (text) => /DELETE\s+FROM\s+scoreboards\s+WHERE\s+session_id\s*=\s*\$1/is.test(text),
    execute: async (client, text, params) => {
      const { data, error } = await client.from('scoreboards').delete().eq('session_id', params[0]).select('id');
      if (error) throw error;
      return { rowCount: data?.length || 0, rows: data || [] };
    }
  },

  // 7. Education Sessions Handlers
  {
    // Get Sessions List (세션 목록 조회 with subqueries)
    match: (text) => /SELECT\s+es\.\*,\s*u\.name\s+as\s+creator_name.*student_count.*problem_count.*FROM\s+education_sessions\s+es/is.test(text),
    execute: async (client, text, params) => {
      // 기본 세션 목록 조회
      let query = client
        .from('education_sessions')
        .select('*, users!creator_id(name)')
        .order('start_time', { ascending: false });
      
      // 필터 처리
      if (params.length > 0) {
        let paramIdx = 0;
        if (text.includes('status =')) {
          query = query.eq('status', params[paramIdx++]);
        }
        if (text.includes('session_type =')) {
          query = query.eq('session_type', params[paramIdx++]);
        }
        if (text.includes('creator_id =')) {
          query = query.eq('creator_id', params[paramIdx++]);
        }
        
        // WHERE es.id = $1 (상세 조회)
        if (text.includes('WHERE es.id =')) {
          query = query.eq('id', params[0]).single();
        }
      }
      
      const { data, error } = await query;
      if (error) {
        if (error.code === 'PGRST116') return { rows: [] };
        throw error;
      }
      
      // 단일 세션인 경우
      if (!Array.isArray(data)) {
        const sessions = [data];
        const result = await Promise.all(sessions.map(async session => {
          // student_count 조회
          const { count: studentCount } = await client
            .from('session_students')
            .select('*', { count: 'exact', head: true })
            .eq('session_id', session.id);
          
          // problem_count 조회
          const { count: problemCount } = await client
            .from('session_problems')
            .select('*', { count: 'exact', head: true })
            .eq('session_id', session.id);
          
          return {
            ...session,
            creator_name: session.users?.name || null,
            student_count: studentCount || 0,
            problem_count: problemCount || 0
          };
        }));
        
        delete result[0].users;
        return { rows: result };
      }
      
      // 여러 세션인 경우
      const sessions = data || [];
      const result = await Promise.all(sessions.map(async session => {
        // student_count 조회
        const { count: studentCount } = await client
          .from('session_students')
          .select('*', { count: 'exact', head: true })
          .eq('session_id', session.id);
        
        // problem_count 조회
        const { count: problemCount } = await client
          .from('session_problems')
          .select('*', { count: 'exact', head: true })
          .eq('session_id', session.id);
        
        return {
          ...session,
          creator_name: session.users?.name || null,
          student_count: studentCount || 0,
          problem_count: problemCount || 0
        };
      }));
      
      // users 필드 제거
      result.forEach(r => delete r.users);
      
      return { rows: result };
    }
  },
  
  // 7. Education Sessions (추가 쿼리)
  {
    // Find Active Session for Student (활성 세션 조회)
    match: (text) => /SELECT\s+es\.id\s+FROM\s+education_sessions\s+es\s+JOIN\s+session_students\s+ss.*WHERE\s+ss\.student_id\s*=\s*\$1\s+AND\s+es\.status\s*=/is.test(text),
    execute: async (client, text, params) => {
      // 학생의 활성 세션 모두 가져오기
      const { data, error } = await client
        .from('session_students')
        .select('session_id, education_sessions!inner(id, status, session_type, start_time)')
        .eq('student_id', params[0])
        .eq('education_sessions.status', 'active');
      
      if (error) throw error;
      
      // JavaScript에서 정렬: exam 우선, 그 다음 최신 시작 시간
      if (data && data.length > 0) {
        const sorted = data.sort((a, b) => {
          const typeOrder = { exam: 1, practice: 2, regular: 3 };
          const aType = typeOrder[a.education_sessions.session_type] || 99;
          const bType = typeOrder[b.education_sessions.session_type] || 99;
          if (aType !== bType) return aType - bType;
          return new Date(b.education_sessions.start_time) - new Date(a.education_sessions.start_time);
        });
        return { rows: [{ id: sorted[0].education_sessions.id }] };
      }
      return { rows: [] };
    }
  },
  {
    // Find Latest Session for Student (최신 세션 조회)
    match: (text) => /SELECT\s+es\.id\s+FROM\s+education_sessions\s+es\s+JOIN\s+session_students\s+ss.*WHERE\s+ss\.student_id\s*=\s*\$1.*ORDER BY\s+es/is.test(text),
    execute: async (client, text, params) => {
      // 학생의 모든 세션 가져오기
      const { data, error } = await client
        .from('session_students')
        .select('session_id, education_sessions!inner(id, start_time)')
        .eq('student_id', params[0]);
      
      if (error) throw error;
      
      // JavaScript에서 정렬: 최신 시작 시간
      if (data && data.length > 0) {
        const sorted = data.sort((a, b) => 
          new Date(b.education_sessions.start_time) - new Date(a.education_sessions.start_time)
        );
        return { rows: [{ id: sorted[0].education_sessions.id }] };
      }
      return { rows: [] };
    }
  },
  {
    // Select Education Session by ID
    match: (text) => /SELECT\s+id\s+FROM\s+education_sessions\s+WHERE\s+id\s*=\s*\$1/is.test(text),
    execute: async (client, text, params) => {
      const { data, error } = await client.from('education_sessions').select('id').eq('id', params[0]).single();
      if (error) {
        if (error.code === 'PGRST116') return { rows: [] };
        throw error;
      }
      return { rows: data ? [data] : [] };
    }
  },
  {
    // Delete Education Session
    match: (text) => /DELETE\s+FROM\s+education_sessions\s+WHERE\s+id\s*=\s*\$1/is.test(text),
    execute: async (client, text, params) => {
      const { data, error } = await client.from('education_sessions').delete().eq('id', params[0]).select();
      if (error) throw error;
      return { rows: data || [] };
    }
  },
  {
    // Update Education Session
    match: (text) => /UPDATE\s+education_sessions\s+SET/is.test(text),
    execute: async (client, text, params) => {
      const sessionId = params[params.length - 1];
      const updateData = {};

      let idx = 0;
      if (text.includes('name =')) updateData.name = params[idx++];
      if (text.includes('start_time =')) updateData.start_time = params[idx++];
      if (text.includes('end_time =')) updateData.end_time = params[idx++];
      if (text.includes('status =')) updateData.status = params[idx++];
      if (text.includes('session_type =')) updateData.session_type = params[idx++];
      if (text.includes('allow_resubmit =')) updateData.allow_resubmit = params[idx++];

      updateData.updated_at = new Date().toISOString();

      const { data, error } = await client.from('education_sessions').update(updateData).eq('id', sessionId).select();
      if (error) throw error;
      return { rows: data || [] };
    }
  },

  // 8. Session Students Handlers
  {
    // Get Session Students (세션 학생 목록 조회)
    match: (text) => /SELECT\s+s\.id,\s*s\.login_id,\s*s\.name.*FROM\s+session_students\s+ss\s+JOIN\s+users\s+s.*WHERE\s+ss\.session_id/is.test(text),
    execute: async (client, text, params) => {
      const sessionId = params[0];
      
      const { data, error } = await client
        .from('session_students')
        .select('student_id, joined_at, users!student_id(id, login_id, name, email, group_info)')
        .eq('session_id', sessionId)
        .order('joined_at', { ascending: true });
      
      if (error) throw error;
      
      const rows = (data || []).map(item => ({
        id: item.users?.id,
        login_id: item.users?.login_id,
        name: item.users?.name,
        email: item.users?.email,
        group_info: item.users?.group_info,
        joined_at: item.joined_at
      }));
      
      return { rows };
    }
  },
  {
    // Insert Session Student (ON CONFLICT)
    match: (text) => /INSERT\s+INTO\s+session_students.*ON\s+CONFLICT/is.test(text),
    execute: async (client, text, params) => {
      const sessionId = params[0];
      const studentId = params[1];
      
      // 기존 데이터 확인
      const { data: existing, error: selectError } = await client
        .from('session_students')
        .select('id')
        .eq('session_id', sessionId)
        .eq('student_id', studentId)
        .single();
      
      if (selectError && selectError.code !== 'PGRST116') throw selectError;
      
      if (existing) {
        // 이미 존재하면 빈 배열 반환 (DO NOTHING)
        return { rows: [] };
      }
      
      // 새로 삽입
      const { data, error } = await client
        .from('session_students')
        .insert({ session_id: sessionId, student_id: studentId })
        .select();
      
      if (error) throw error;
      return { rows: data || [] };
    }
  },
  {
    // Insert Session Student
    match: (text) => /INSERT\s+INTO\s+session_students/is.test(text),
    execute: async (client, text, params) => {
      const students = [];
      // VALUES ($1, $2), ($1, $3), ... 형태 처리
      for (let i = 1; i < params.length; i++) {
        students.push({
          session_id: params[0],
          student_id: params[i]
        });
      }
      const { data, error } = await client.from('session_students').insert(students).select('id');
      if (error) throw error;
      return { rows: data || [] };
    }
  },
  {
    // Remove Session Student
    match: (text) => /DELETE\s+FROM\s+session_students\s+WHERE\s+session_id\s*=\s*\$1\s+AND\s+student_id\s*=\s*\$2/is.test(text),
    execute: async (client, text, params) => {
      const { data, error } = await client
        .from('session_students')
        .delete()
        .eq('session_id', params[0])
        .eq('student_id', params[1])
        .select();
      if (error) throw error;
      return { rows: data || [] };
    }
  },
  {
    // Delete Session Students
    match: (text) => /DELETE\s+FROM\s+session_students/is.test(text),
    execute: async (client, text, params) => {
      const { data, error } = await client.from('session_students').delete().eq('session_id', params[0]).select('id');
      if (error) throw error;
      return { rowCount: data?.length || 0, rows: data || [] };
    }
  },

  // 9. Session Problems Handlers
  {
    // Get Session Problems (세션 문제 목록 조회)
    match: (text) => /SELECT\s+p\.id,\s*p\.title.*sp\.problem_order.*FROM\s+session_problems\s+sp\s+JOIN\s+problems\s+p.*WHERE\s+sp\.session_id/is.test(text),
    execute: async (client, text, params) => {
      const sessionId = params[0];
      
      const { data, error } = await client
        .from('session_problems')
        .select(`
          problem_id,
          problem_order,
          problems!problem_id(id, title, category, difficulty, time_limit, memory_limit, visibility)
        `)
        .eq('session_id', sessionId)
        .order('problem_order', { ascending: true });
      
      if (error) throw error;
      
      const rows = (data || []).map(item => ({
        id: item.problems?.id,
        title: item.problems?.title,
        category: item.problems?.category,
        difficulty: item.problems?.difficulty,
        time_limit: item.problems?.time_limit,
        memory_limit: item.problems?.memory_limit,
        visibility: item.problems?.visibility,
        order: item.problem_order
      }));
      
      return { rows };
    }
  },
  {
    // Insert Session Problem (ON CONFLICT)
    match: (text) => /INSERT\s+INTO\s+session_problems.*ON\s+CONFLICT.*DO\s+UPDATE/is.test(text),
    execute: async (client, text, params) => {
      const sessionId = params[0];
      const problemId = params[1];
      const problemOrder = params[2];
      
      // UPSERT 처리
      const { data, error } = await client
        .from('session_problems')
        .upsert(
          {
            session_id: sessionId,
            problem_id: problemId,
            problem_order: problemOrder
          },
          { onConflict: 'session_id,problem_id' }
        )
        .select();
      
      if (error) throw error;
      return { rows: data || [] };
    }
  },
  {
    // Insert Session Problems
    match: (text) => /INSERT\s+INTO\s+session_problems/is.test(text),
    execute: async (client, text, params) => {
      const problems = [];
      // VALUES ($1, $2, $3), ($1, $4, $5), ... 형태 처리
      const sessionId = params[0];
      for (let i = 1; i < params.length; i += 2) {
        problems.push({
          session_id: sessionId,
          problem_id: params[i],
          problem_order: params[i + 1] || 0
        });
      }
      const { data, error } = await client.from('session_problems').insert(problems).select('id');
      if (error) throw error;
      return { rows: data || [] };
    }
  },
  {
    // Remove Session Problem
    match: (text) => /DELETE\s+FROM\s+session_problems\s+WHERE\s+session_id\s*=\s*\$1\s+AND\s+problem_id\s*=\s*\$2/is.test(text),
    execute: async (client, text, params) => {
      const { data, error } = await client
        .from('session_problems')
        .delete()
        .eq('session_id', params[0])
        .eq('problem_id', params[1])
        .select();
      if (error) throw error;
      return { rows: data || [] };
    }
  },
  {
    // Delete Session Problems
    match: (text) => /DELETE\s+FROM\s+session_problems/is.test(text),
    execute: async (client, text, params) => {
      const { data, error } = await client.from('session_problems').delete().eq('session_id', params[0]).select('id');
      if (error) throw error;
      return { rowCount: data?.length || 0, rows: data || [] };
    }
  },

  // 10. Audit Logs Handlers
  {
    // Insert Audit Log
    match: (text) => /INSERT\s+INTO\s+audit_logs/i.test(text),
    execute: async (client, text, params) => {
      const insertData = {
        user_id: params[0] || null,
        user_role: params[1] || null,
        action_type: params[2],
        target_resource: params[3] || null,
        ip_address: params[4] || null,
        user_agent: params[5] || null,
        result: params[6],
        error_message: params[7] || null
      };
      const { data, error } = await client.from('audit_logs').insert(insertData).select().single();
      if (error) throw error;
      return { rows: [data] };
    }
  },

  // 11. Misc / Fallback
  {
    match: (text) => /SELECT\s+NOW\(\)/i.test(text),
    execute: async () => ({ rows: [{ current_time: new Date().toISOString() }] })
  },
  {
    // BEGIN - 트랜잭션 시작 (Supabase는 자동 처리하므로 무시)
    match: (text) => /^BEGIN$/i.test(text.trim()),
    execute: async () => ({ rows: [] })
  },
  {
    // COMMIT - 트랜잭션 커밋 (Supabase는 자동 처리하므로 무시)
    match: (text) => /^COMMIT$/i.test(text.trim()),
    execute: async () => ({ rows: [] })
  },
  {
    // ROLLBACK - 트랜잭션 롤백 (Supabase는 자동 처리하므로 무시)
    match: (text) => /^ROLLBACK$/i.test(text.trim()),
    execute: async () => ({ rows: [] })
  }
];

const parseAndExecuteQuery = async (client, text, params) => {
  const trimmedText = text.trim();

  console.log('🔍 [DB Query] Received query:', trimmedText.substring(0, 150) + '...');
  console.log('📊 [DB Query] Params:', params);

  for (const handler of handlers) {
    if (handler.match(trimmedText)) {
      console.log('✅ [DB Query] Handler matched!');
      try {
        const result = await handler.execute(client, trimmedText, params);
        console.log('📤 [DB Query] Result rows count:', result.rows?.length || 0);
        if (result.rows?.length > 0) {
          console.log('📄 [DB Query] First row sample:', JSON.stringify(result.rows[0]).substring(0, 200));
        }
        return result;
      } catch (err) {
        console.error(`❌ [DB Query] Error executing handler:`, err);
        throw err;
      }
    }
  }

  console.warn(`⚠️  [DB Query] No handler found for query: ${trimmedText.substring(0, 100)}`);
  return { rows: [] };
};

export const query = async (text, params) => {
  const client = getSupabaseClient();
  try {
    return await parseAndExecuteQuery(client, text, params || []);
  } catch (error) {
    console.error('Query error:', error.message);
    throw error;
  }
};

export const getClient = async () => {
  const client = getSupabaseClient();
  return {
    query: async (text, params) => query(text, params),
    release: () => { },
  };
};

export const testDatabaseConnection = async () => {
  try {
    const client = getSupabaseClient();
    const { error } = await client.from('users').select('count').limit(1);
    if (error && error.code !== 'PGRST116') throw error;
    console.log('Database connection test successful');
    return true;
  } catch (error) {
    console.error('Database connection test failed:', error);
    return false;
  }
};

export const closePool = async () => { };
