import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getProblemDetail, submitCode } from '../../api/student';
import { Header, Footer, LoadingSpinner, Button } from '../../components/Common';
import useToast from '../../components/Notification/useToast';
import Editor from '@monaco-editor/react';

const ProblemDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();

  const [problem, setProblem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [code, setCode] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const fetchProblem = async () => {
      setLoading(true);
      try {
        const data = await getProblemDetail(id);
        setProblem(data);
        setCode(data.initialCode || data.boilerplate || '# 코드를 작성하세요\n');
      } catch (error) {
        toast.showError('문제를 불러오지 못했습니다.');
      } finally {
        setLoading(false);
      }
    };

    fetchProblem();
  }, [id]);

  const handleSubmit = async () => {
    if (!code.trim()) {
      toast.showWarning('코드를 입력해주세요.');
      return;
    }

    setSubmitting(true);
    try {
      await submitCode({
        problemId: parseInt(id),
        code,
      });
      toast.showSuccess('제출이 완료되었습니다. 채점 결과를 기다려주세요.');
      // 제출 이력 페이지로 이동
      setTimeout(() => navigate('/student/submissions'), 1500);
    } catch (error) {
      const message = error?.response?.data?.message || '제출에 실패했습니다.';
      toast.showError(message);
    } finally {
      setSubmitting(false);
    }
  };

  const getDifficultyStars = (difficulty) => {
    return '⭐'.repeat(difficulty || 1);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-50 to-primary-100 flex items-center justify-center">
        <LoadingSpinner label="문제 로딩 중" />
      </div>
    );
  }

  if (!problem) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-50 to-primary-100 flex items-center justify-center">
        <div className="text-center">
          <p className="text-xl text-gray-600">문제를 찾을 수 없습니다.</p>
          <Button onClick={() => navigate('/student')} className="mt-4">
            문제 목록으로 돌아가기
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-primary-100 flex flex-col">
      <Header />
      <main className="flex-1 flex">
        {/* 좌측 - 문제 설명 */}
        <div className="w-1/2 bg-white p-8 overflow-y-auto shadow-md">
          <button
            onClick={() => navigate('/student')}
            className="mb-6 text-primary-600 hover:text-primary-700 font-medium flex items-center gap-2"
          >
            ⬅️ 문제 목록으로
          </button>

          <div className="mb-6">
            <h1 className="text-3xl font-bold text-gray-900 mb-3">
              📄 {problem.title}
            </h1>
            <div className="flex items-center gap-4 text-sm text-gray-600">
              <span>난이도: {getDifficultyStars(problem.difficulty)}</span>
              {problem.successRate && <span>정답률: {problem.successRate}%</span>}
              <span className="inline-flex items-center gap-1 px-2 py-1 bg-primary-50 text-primary-700 rounded">
                🏅 점수 {problem.score ?? 1}
              </span>
              <span className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 text-gray-700 rounded">
                ⏱ {problem.timeLimit || 2}초 / 💾 {problem.memoryLimit || 256}MB
              </span>
            </div>
          </div>

          <hr className="my-6 border-gray-200" />

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-3">문제 설명</h2>
            <div className="prose max-w-none text-gray-700 whitespace-pre-wrap">
              {problem.description}
            </div>
          </section>

          {problem.inputDescription && (
            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-3">입력</h2>
              <div className="prose max-w-none text-gray-700 whitespace-pre-wrap">
                {problem.inputDescription}
              </div>
            </section>
          )}

          {problem.outputDescription && (
            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-3">출력</h2>
              <div className="prose max-w-none text-gray-700 whitespace-pre-wrap">
                {problem.outputDescription}
              </div>
            </section>
          )}

          <hr className="my-6 border-gray-200" />

          {problem.examples && problem.examples.length > 0 && (
            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-3">예제 입출력</h2>
              {problem.examples.map((example, index) => (
                <div key={index} className="mb-4 p-4 bg-gray-50 rounded-lg">
                  <h3 className="font-semibold text-gray-800 mb-2">[예제 {index + 1}]</h3>
                  <div className="mb-2">
                    <span className="font-medium text-gray-700">입력:</span>
                    <pre className="mt-1 p-2 bg-white rounded border border-gray-200 text-sm">
                      {example.input}
                    </pre>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">출력:</span>
                    <pre className="mt-1 p-2 bg-white rounded border border-gray-200 text-sm">
                      {example.output}
                    </pre>
                  </div>
                </div>
              ))}
            </section>
          )}

          {problem.publicTestCases && problem.publicTestCases.length > 0 && (
            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-3">공개 테스트 케이스</h2>
              <div className="space-y-4">
                {problem.publicTestCases.map((tc, idx) => (
                  <div key={tc.id ?? idx} className="p-4 bg-white border border-gray-200 rounded-lg shadow-sm">
                    <div className="text-sm text-gray-600 mb-2">케이스 #{idx + 1}</div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <p className="text-xs font-medium text-gray-700">입력</p>
                        <pre className="mt-1 p-2 bg-gray-50 border border-gray-200 rounded text-sm whitespace-pre-wrap">
                          {tc.input ?? tc.input_data ?? tc.inputData ?? ''}
                        </pre>
                      </div>
                      <div>
                        <p className="text-xs font-medium text-gray-700">출력</p>
                        <pre className="mt-1 p-2 bg-gray-50 border border-gray-200 rounded text-sm whitespace-pre-wrap">
                          {tc.expectedOutput ?? tc.expected_output ?? tc.output ?? ''}
                        </pre>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          <hr className="my-6 border-gray-200" />

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">제약 조건</h2>
            <ul className="list-disc list-inside text-gray-700 space-y-1">
              <li>시간 제한: {problem.timeLimit || 2}초</li>
              <li>메모리 제한: {problem.memoryLimit || 256}MB</li>
            </ul>
          </section>
        </div>

        {/* 우측 - 코드 에디터 */}
        <div className="w-1/2 bg-gray-50 p-8 flex flex-col">
          <div className="mb-4">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">코드 작성</h2>
          </div>

          <div className="flex-1 mb-4 border border-gray-300 rounded-lg overflow-hidden shadow-sm bg-white">
            <Editor
              height="100%"
              defaultLanguage="python"
              value={code}
              onChange={(val) => setCode(val ?? '')}
              theme="vs"
              options={{
                minimap: { enabled: false },
                fontSize: 14,
                lineNumbers: 'on',
                scrollBeyondLastLine: false,
                wordWrap: 'on',
                automaticLayout: true,
              }}
            />
          </div>

          <div className="flex gap-4">
            <Button
              onClick={handleSubmit}
              loading={submitting}
              className="flex-1"
            >
              코드 제출
            </Button>
            <Button
              onClick={() => navigate('/student/submissions')}
              variant="secondary"
              className="flex-1"
            >
              전체 제출 이력 보기
            </Button>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default ProblemDetailPage;
