import React from 'react';

const Footer = () => {
  return (
    <footer className="bg-gray-800 text-white py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <div className="mb-4 md:mb-0">
            <h3 className="text-lg font-semibold">Python Judge</h3>
            <p className="text-gray-400 text-sm mt-1">코딩 테스트 자동 채점 플랫폼</p>
          </div>
          <div className="flex space-x-6">
            <a href="#" className="text-gray-400 hover:text-white text-sm">
              이용약관
            </a>
            <a href="#" className="text-gray-400 hover:text-white text-sm">
              개인정보처리방침
            </a>
            <a href="#" className="text-gray-400 hover:text-white text-sm">
              고객센터
            </a>
          </div>
        </div>
        <div className="mt-6 pt-6 border-t border-gray-700 text-center">
          <p className="text-gray-400 text-sm">
            © {new Date().getFullYear()} Python Judge. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;