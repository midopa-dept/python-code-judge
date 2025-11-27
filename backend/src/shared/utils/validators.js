import { config } from '../../config/env.js';

// 문제 카테고리 목록 (UTF-8)
export const PROBLEM_CATEGORIES = [
  '입출력',
  '조건문',
  '반복문',
  '리스트',
  '문자열',
  '함수',
  '재귀',
  '정렬',
  '탐색',
  '동적계획법',
  '기타',
];

// 난이도 범위
export const MIN_DIFFICULTY = 1;
export const MAX_DIFFICULTY = 5;

// 시간 제한 범위
export const MIN_TIME_LIMIT = config.judging.minTimeoutSeconds;
export const MAX_TIME_LIMIT = config.judging.maxTimeoutSeconds;

// 카테고리 유효성검사
export const isValidCategory = (category) => {
  return PROBLEM_CATEGORIES.includes(category);
};

// 난이도 유효성검사
export const isValidDifficulty = (difficulty) => {
  const diff = parseInt(difficulty, 10);
  return !isNaN(diff) && diff >= MIN_DIFFICULTY && diff <= MAX_DIFFICULTY;
};

// 시간 제한 유효성검사
export const isValidTimeLimit = (timeLimit) => {
  const limit = parseInt(timeLimit, 10);
  return !isNaN(limit) && limit >= MIN_TIME_LIMIT && limit <= MAX_TIME_LIMIT;
};

// Visibility 유효성검사
export const isValidVisibility = (visibility) => {
  return ['public', 'private', 'draft'].includes(visibility);
};
