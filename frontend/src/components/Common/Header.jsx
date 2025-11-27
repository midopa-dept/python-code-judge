import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { getCurrentUser, logout } from "../../api/auth";
import { useToast } from "../Notification/useToast";

const Header = () => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const toast = useToast();

  useEffect(() => {
    const fetchCurrentUser = async () => {
      try {
        const user = await getCurrentUser();
        setCurrentUser(user);
      } catch (error) {
        setCurrentUser(null);
      } finally {
        setLoading(false);
      }
    };

    fetchCurrentUser();
  }, []);

  const handleLogout = async () => {
    try {
      logout();
      setCurrentUser(null);
      toast.showSuccess("로그아웃 했습니다.");
      navigate("/");
    } catch (error) {
      toast.showError("로그아웃에 실패했습니다.");
    }
  };

  if (loading) {
    return (
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <div className="animate-pulse bg-gray-200 rounded w-24 h-6"></div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="animate-pulse bg-gray-200 rounded w-16 h-8"></div>
            </div>
          </div>
        </div>
      </header>
    );
  }

  return (
    <header className="bg-white shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <Link to="/" className="text-xl font-bold text-primary-600">
              Python Judge
            </Link>
          </div>

          {currentUser && (
            <nav className="hidden md:block">
              <div className="ml-10 flex items-center space-x-8">
                <Link
                  to="/problems"
                  className="text-gray-700 hover:text-primary-600 px-3 py-2 rounded-md text-sm font-medium"
                >
                  문제
                </Link>
                <Link
                  to="/submissions"
                  className="text-gray-700 hover:text-primary-600 px-3 py-2 rounded-md text-sm font-medium"
                >
                  제출 이력
                </Link>
                {currentUser.role === "admin" && (
                  <Link
                    to="/admin"
                    className="text-gray-700 hover:text-primary-600 px-3 py-2 rounded-md text-sm font-medium"
                  >
                    관리자
                  </Link>
                )}
              </div>
            </nav>
          )}

          <div className="flex items-center">
            {currentUser ? (
              <div className="flex items-center space-x-4">
                <div className="text-sm text-gray-700">
                  <span className="hidden md:inline">안녕하세요 </span>
                  <span className="font-medium">{currentUser.name}</span>
                  {currentUser.role && (
                    <span className="ml-1 text-xs bg-gray-100 text-gray-800 px-2 py-0.5 rounded-full">
                      {currentUser.role === "admin" ? "관리자" : "학생"}
                    </span>
                  )}
                </div>
                <button
                  onClick={handleLogout}
                  className="text-sm text-gray-700 hover:text-primary-600 font-medium"
                >
                  로그아웃
                </button>
              </div>
            ) : (
              <div className="flex items-center" aria-hidden>
                {/* 비로그인 상태에서는 상단 액션을 노출하지 않습니다. */}
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
