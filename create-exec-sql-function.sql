-- SQL 쿼리를 실행할 수 있는 RPC 함수 생성
-- 보안: service_role 키로만 호출 가능하도록 설정

CREATE OR REPLACE FUNCTION exec_sql(
  sql_query TEXT,
  sql_params JSONB DEFAULT '[]'::JSONB
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result JSONB;
  query_result RECORD;
  results JSONB[] := '{}';
BEGIN
  -- 파라미터가 있는 경우 동적 쿼리 실행
  IF jsonb_array_length(sql_params) > 0 THEN
    -- 파라미터화된 쿼리는 보안상 제한적으로만 지원
    -- 실제로는 각 쿼리 타입별로 별도 함수를 만드는 것이 더 안전함
    RAISE EXCEPTION 'Parameterized queries not yet implemented';
  ELSE
    -- 파라미터 없는 쿼리 실행
    FOR query_result IN EXECUTE sql_query
    LOOP
      results := array_append(results, to_jsonb(query_result));
    END LOOP;
  END IF;

  -- 결과를 JSONB 배열로 반환
  result := to_jsonb(results);
  RETURN result;
EXCEPTION
  WHEN OTHERS THEN
    RAISE EXCEPTION 'Query execution failed: %', SQLERRM;
END;
$$;

-- 함수 실행 권한 설정 (service_role만 실행 가능)
REVOKE ALL ON FUNCTION exec_sql(TEXT, JSONB) FROM PUBLIC;
REVOKE ALL ON FUNCTION exec_sql(TEXT, JSONB) FROM anon;
REVOKE ALL ON FUNCTION exec_sql(TEXT, JSONB) FROM authenticated;

-- Comment
COMMENT ON FUNCTION exec_sql IS 'Execute SQL queries - SECURITY SENSITIVE - Service role only';
