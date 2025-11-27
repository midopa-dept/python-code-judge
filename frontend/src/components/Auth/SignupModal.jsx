import React, { useState } from "react";
import { signup } from "../../api/auth";
import useToast from "../Notification/useToast";
import { Button, Input, Modal } from "../Common";

const SignupModal = ({ open, onClose, onSuccess }) => {
  const [form, setForm] = useState({
    loginId: "",
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const toast = useToast();

  if (!open) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const validate = () => {
    if (
      !form.loginId ||
      !form.name ||
      !form.email ||
      !form.password ||
      !form.confirmPassword
    ) {
      setError("모든 필드를 입력해주세요.");
      return false;
    }

    if (!/\S+@\S+\.\S+/.test(form.email)) {
      setError("올바른 이메일 형식을 입력해주세요.");
      return false;
    }

    if (form.password.length < 8 || form.password.length > 100) {
      setError("비밀번호는 8-100자 사이여야 합니다.");
      return false;
    }

    if (form.password !== form.confirmPassword) {
      setError("비밀번호가 일치하지 않습니다.");
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
      await signup({
        username: form.loginId.trim(),
        name: form.name.trim(),
        rank: null,
        email: form.email.trim(),
        password: form.password,
      });
      toast.showSuccess("회원가입이 완료되었습니다. 로그인해주세요.");
      if (onSuccess) onSuccess();
      onClose();
    } catch (err) {
      const message =
        err?.response?.data?.errors?.[0]?.message ||
        err?.response?.data?.message ||
        "회원가입에 실패했습니다. 잠시 후 다시 시도해주세요.";
      toast.showError(message);
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={open} onClose={onClose} title="회원가입" size="md">
      <form className="space-y-4" onSubmit={handleSubmit} data-testid="signup-form">
        <Input
          id="signupId"
          name="loginId"
          label="아이디"
          placeholder="아이디를 입력하세요"
          value={form.loginId}
          onChange={handleChange}
          required
        />
        <Input
          id="signupName"
          name="name"
          label="이름"
          placeholder="이름을 입력하세요"
          value={form.name}
          onChange={handleChange}
          required
        />
        <Input
          id="signupEmail"
          name="email"
          label="이메일"
          type="email"
          placeholder="이메일을 입력하세요"
          value={form.email}
          onChange={handleChange}
          required
        />
        <Input
          id="signupPassword"
          name="password"
          label="비밀번호"
          type="password"
          placeholder="비밀번호를 입력하세요"
          value={form.password}
          onChange={handleChange}
          required
        />
        <Input
          id="signupConfirm"
          name="confirmPassword"
          label="비밀번호 확인"
          type="password"
          placeholder="비밀번호를 다시 입력하세요"
          value={form.confirmPassword}
          onChange={handleChange}
          required
        />

        {error && (
          <p className="text-sm text-red-600" role="alert">
            {error}
          </p>
        )}

        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            취소
          </Button>
          <Button type="submit" loading={loading}>
            회원가입
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default SignupModal;
