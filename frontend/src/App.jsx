import { Routes, Route, Navigate } from 'react-router-dom';
import HealthCheckPage from './pages/HealthCheckPage';
import ComponentsDemoPage from './pages/ComponentsDemoPage';
import LoginPage from './pages/LoginPage';

function App() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-primary-100">
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/health" element={<HealthCheckPage />} />
        <Route path="/components" element={<ComponentsDemoPage />} />
        <Route path="/" element={<Navigate to="/login" replace />} />
      </Routes>
    </div>
  );
}

export default App;
