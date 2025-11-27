import { useCallback } from 'react';
import { toast } from 'react-toastify';

export const useToast = () => {
  const showSuccess = useCallback((message) => {
    toast.success(message);
  }, []);

  const showError = useCallback((message) => {
    toast.error(message);
  }, []);

  const showInfo = useCallback((message) => {
    toast.info(message);
  }, []);

  const showWarning = useCallback((message) => {
    toast.warn(message);
  }, []);

  return {
    showSuccess,
    showError,
    showInfo,
    showWarning
  };
};

export default useToast;