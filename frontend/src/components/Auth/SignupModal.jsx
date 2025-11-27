import React, { useState } from 'react';
import { signup } from '../../api/auth';
import useToast from '../Notification/useToast';
import { Button, Input, Modal } from '../Common';

const SignupModal = ({ open, onClose, onSuccess }) => {
  const [form, setForm] = useState({
    loginId: '',
    militaryNumber: '',
    name: '',
    rank: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [error, setError] = useState('');
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
      !form.militaryNumber ||
      !form.name ||
      !form.rank ||
      !form.email ||
      !form.password ||
      !form.confirmPassword
    ) {
      setError('모든 필드를 입력해주세요.');
      return false;
    }
    if (!/\S+@\S+\.\S+/.test(form.email)) {
      setError('올바른 이메일을 입력해주세요.');
      return false;
    }
    if (form.password.length < 8) {
      setError('비밀번호는 8자 이상이어야 합니다.');
      return false;
    }
    if (form.password !== form.confirmPassword) {
      setError('비밀번호가 일치하지 않습니다.');
      return false;
    }
    setError('');
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    try {
      setLoading(true);
      await signup({
        username: form.loginId.trim(),
        military_number: form.militaryNumber.trim(),
        name: form.name.trim(),
        rank: form.rank,
        email: form.email.trim(), // 백엔드에서 사용하지 않아도 추후 확장 대비
        password: form.password
      });
      toast.showSuccess('회원가입이 완료되었습니다. 로그인 해주세요.');
      if (onSuccess) onSuccess();
      onClose();
    } catch (err) {
      const message =
        err?.response?.data?.message || '회원가입에 실패했습니다. 잠시 후 다시 시도해주세요.';
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
          id="signupMilitary"
          name="militaryNumber"
          label="군번"
          placeholder="군번을 입력하세요"
          value={form.militaryNumber}
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
        <div className="w-full">
          <label htmlFor="signupRank" className="block text-sm font-medium text-gray-700 mb-1">
            계급 <span className="text-red-500">*</span>
          </label>
          <select
            id="signupRank"
            name="rank"
            value={form.rank}
            onChange={handleChange}
            required
            className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent border-gray-300"
          >
            <option value="">계급을 선택하세요</option>
            <option value="이병">이병</option>
            <option value="일병">일병</option>
            <option value="상병">상병</option>
            <option value="병장">병장</option>
            <option value="하사">하사</option>
          </select>
        </div>
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

        {error && <p className="text-sm text-red-600" role="alert">{error}</p>}

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
