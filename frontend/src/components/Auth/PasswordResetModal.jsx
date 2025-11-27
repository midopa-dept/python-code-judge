import React, { useState } from "react";
import { forgotPassword } from "../../api/auth";
import useToast from "../Notification/useToast";
import { Button, Input, Modal } from "../Common";

const PasswordResetModal = ({ open, onClose }) => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const toast = useToast();

  if (!open) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim()) {
      setError("이메일을 입력해주세요.");
      return;
    }
    setError("");

    try {
      setLoading(true);
      await forgotPassword(email.trim());
      toast.showSuccess("비밀번호 재설정 메일을 보냈습니다.");
      onClose();
    } catch (err) {
      const message = err?.response?.data?.message || "메일 발송에 실패했습니다. 잠시 후 다시 시도해주세요.";
      toast.showError(message);
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={open} onClose={onClose} title="비밀번호 찾기" size="sm">
      <form className="space-y-4" onSubmit={handleSubmit}>
        <Input
          id="resetEmail"
          label="이메일"
          type="email"
          placeholder="계정에 등록된 이메일을 입력하세요"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
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
            메일 보내기
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default PasswordResetModal;
