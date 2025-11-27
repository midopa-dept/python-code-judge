import { toast } from 'react-toastify';

export const useToast = () => {
  const showSuccess = (message) => {
    toast.success(message);
  };

  const showError = (message) => {
    toast.error(message);
  };

  const showInfo = (message) => {
    toast.info(message);
  };

  const showWarning = (message) => {
    toast.warn(message);
  };

  return {
    showSuccess,
    showError,
    showInfo,
    showWarning
  };
};

export default useToast;