import { Routes, Route } from 'react-router-dom';
import HealthCheckPage from './pages/HealthCheckPage';
import ComponentsDemoPage from './pages/ComponentsDemoPage';

function App() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-primary-100">
      <Routes>
        <Route path="/" element={<HealthCheckPage />} />
        <Route path="/health" element={<HealthCheckPage />} />
        <Route path="/components" element={<ComponentsDemoPage />} />
      </Routes>
    </div>
  );
}

export default App;
