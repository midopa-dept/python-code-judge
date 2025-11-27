import { Routes, Route } from 'react-router-dom';
import HealthCheckPage from './pages/HealthCheckPage';

function App() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-primary-100">
      <Routes>
        <Route path="/" element={<HealthCheckPage />} />
        <Route path="/health" element={<HealthCheckPage />} />
        {/* 추가적인 라우트는 여기에 추가 */}
      </Routes>
    </div>
  );
}

export default App;
