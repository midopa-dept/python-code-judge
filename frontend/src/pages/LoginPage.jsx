import React, { useState } from 'react';
import LoginForm from '../components/Auth/LoginForm';
import SignupModal from '../components/Auth/SignupModal';
import PasswordResetModal from '../components/Auth/PasswordResetModal';
import { Card, Header, Footer } from '../components/Common';

const LoginPage = () => {
  const [openSignup, setOpenSignup] = useState(false);
  const [openReset, setOpenReset] = useState(false);

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-primary-100 flex flex-col">
      <Header />
      <main className="flex-1 flex items-center justify-center p-4">
        <Card className="w-full max-w-2xl">
          <div className="text-center mb-6">
            <p className="text-sm font-semibold text-primary-700">Phase 4 · 인증</p>
            <h1 className="text-3xl font-bold text-gray-900 mt-1">Python Judge 로그인</h1>
            <p className="text-gray-600 mt-2">
              학생/관리자 탭을 선택해 로그인하거나, 새로운 계정을 생성하세요.
            </p>
          </div>

          <LoginForm
            onSignupOpen={() => setOpenSignup(true)}
            onPasswordResetOpen={() => setOpenReset(true)}
            onSuccess={() => {}}
          />
        </Card>
      </main>
      <Footer />

      <SignupModal
        open={openSignup}
        onClose={() => setOpenSignup(false)}
        onSuccess={() => setOpenSignup(false)}
      />
      <PasswordResetModal open={openReset} onClose={() => setOpenReset(false)} />
    </div>
  );
};

export default LoginPage;
