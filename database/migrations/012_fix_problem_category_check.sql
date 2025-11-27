-- Fix problem category check constraint to use UTF-8 categories
ALTER TABLE problems DROP CONSTRAINT IF EXISTS problems_category_check;

ALTER TABLE problems
ADD CONSTRAINT problems_category_check
CHECK (category IN ('입출력','조건문','반복문','리스트','문자열','함수','재귀','정렬','탐색','동적계획법','기타'));
