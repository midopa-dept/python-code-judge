import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { login } from "../../api/auth";
import useToast from "../Notification/useToast";
import { Button, Input } from "../Common";

const tabOptions = [
  { key: "student", label: "학생" },
  { key: "admin", label: "관리자" },
];

const LoginForm = ({ onSignupOpen, onPasswordResetOpen, onSuccess }) => {
  const [activeTab, setActiveTab] = useState("student");
  const [loginId, setLoginId] = useState("");
  const [password, setPassword] = useState("");
  const [rememberId, setRememberId] = useState(true);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const toast = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    const savedId = localStorage.getItem("loginId");
    if (savedId) {
      setLoginId(savedId);
      setRememberId(true);
    }
  }, []);

  const validate = () => {
    if (!loginId.trim() || !password.trim()) {
      setError("아이디와 비밀번호를 모두 입력해주세요.");
      return false;
    }
    setError("");
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    try {
      setLoading(true);
      await login(loginId.trim(), password.trim(), activeTab);
      if (rememberId) {
        localStorage.setItem("loginId", loginId.trim());
      } else {
        localStorage.removeItem("loginId");
      }
      toast.showSuccess("로그인에 성공했습니다.");
      if (onSuccess) onSuccess();
      navigate("/");
    } catch (err) {
      const message = err?.response?.data?.message || "로그인에 실패했습니다. 입력값을 확인해주세요.";
      toast.showError(message);
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex gap-2 bg-gray-100 p-1 rounded-lg" role="tablist">
        {tabOptions.map((tab) => (
          <button
            key={tab.key}
            type="button"
            role="tab"
            aria-selected={activeTab === tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`w-1/2 py-2 rounded-md text-sm font-semibold transition-colors ${
              activeTab === tab.key ? "bg-white text-primary-700 shadow" : "text-gray-600"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <form className="space-y-4" onSubmit={handleSubmit} data-testid="login-form">
        <Input
          id="loginId"
          label="아이디"
          placeholder="아이디를 입력하세요"
          value={loginId}
          onChange={(e) => setLoginId(e.target.value)}
          required
        />
        <Input
          id="password"
          label="비밀번호"
          type="password"
          placeholder="비밀번호를 입력하세요"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />

        <div className="flex items-center justify-between text-sm">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={rememberId}
              onChange={(e) => setRememberId(e.target.checked)}
            />
            아이디 저장
          </label>
          <button
            type="button"
            className="text-primary-600 hover:underline"
            onClick={onPasswordResetOpen}
          >
            비밀번호 찾기
          </button>
        </div>

        {error && (
          <p className="text-sm text-red-600" role="alert">
            {error}
          </p>
        )}

        <Button type="submit" loading={loading} className="w-full">
          로그인
        </Button>

        <div className="text-center text-sm text-gray-600">
          계정이 없다면{' '}
          <button
            type="button"
            className="text-primary-600 font-semibold hover:underline"
            onClick={onSignupOpen}
          >
            회원가입
          </button>
        </div>
      </form>
    </div>
  );
};

export default LoginForm;
