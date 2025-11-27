import React from 'react';
import { Link } from 'react-router-dom';
import { Header, Footer, Card, Button } from '../../components/Common';

const AdminHomePage = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-primary-100 flex flex-col">
      <Header />
      <main className="flex-1 max-w-6xl mx-auto w-full px-4 py-8 space-y-6">
        <div>
          <p className="text-sm text-primary-700 font-semibold">관리자 대시보드</p>
          <h1 className="text-3xl font-bold text-gray-900">관리자 홈</h1>
          <p className="text-sm text-gray-600">
            문제 등록·수정, 테스트 케이스 관리, 세션 운영을 각각의 페이지에서 처리할 수 있습니다.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="space-y-3">
            <h3 className="text-lg font-semibold text-gray-900">문제 등록</h3>
            <p className="text-sm text-gray-600">새 문제를 만들고 문제 설명과 스코어, 테스트 케이스를 준비하세요.</p>
            <Link to="/admin/problems/new">
              <Button className="w-full">문제 등록 페이지</Button>
            </Link>
          </Card>

          <Card className="space-y-3">
            <h3 className="text-lg font-semibold text-gray-900">문제 수정</h3>
            <p className="text-sm text-gray-600">기존 문제를 선택해 내용, 점수, 테스트 케이스를 수정하세요.</p>
            <Link to="/admin/problems">
              <Button className="w-full" variant="secondary">
                문제 수정 페이지
              </Button>
            </Link>
          </Card>

          <Card className="space-y-3">
            <h3 className="text-lg font-semibold text-gray-900">세션 관리</h3>
            <p className="text-sm text-gray-600">세션 생성, 시작/종료, 초기화와 문제/학생 배정을 관리합니다.</p>
            <Link to="/admin/sessions">
              <Button className="w-full" variant="secondary">
                세션 관리 페이지
              </Button>
            </Link>
          </Card>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default AdminHomePage;
