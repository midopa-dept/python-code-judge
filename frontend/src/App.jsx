import { Routes, Route, Navigate } from 'react-router-dom';
import HealthCheckPage from './pages/HealthCheckPage';
import ComponentsDemoPage from './pages/ComponentsDemoPage';
import LoginPage from './pages/LoginPage';
import ProblemListPage from './pages/student/ProblemListPage';
import ProblemDetailPage from './pages/student/ProblemDetailPage';
import SubmissionsPage from './pages/student/SubmissionsPage';
import ScoreboardPage from './pages/student/ScoreboardPage';
import AdminHomePage from './pages/admin/AdminHomePage';
import ProblemCreatePage from './pages/admin/ProblemCreatePage';
import ProblemEditPage from './pages/admin/ProblemEditPage';
import SessionManagePage from './pages/admin/SessionManagePage';
import ProtectedRoute from './components/Common/ProtectedRoute';

function App() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-primary-100">
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/health" element={<HealthCheckPage />} />
        <Route path="/components" element={<ComponentsDemoPage />} />

        <Route
          path="/student"
          element={
            <ProtectedRoute allowedRoles={['student']}>
              <ProblemListPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/student/problems/:id"
          element={
            <ProtectedRoute allowedRoles={['student']}>
              <ProblemDetailPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/student/submissions"
          element={
            <ProtectedRoute allowedRoles={['student']}>
              <SubmissionsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/student/scoreboard"
          element={
            <ProtectedRoute allowedRoles={['student']}>
              <ScoreboardPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin"
          element={
            <ProtectedRoute allowedRoles={['admin', 'super_admin']}>
              <AdminHomePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/problems/new"
          element={
            <ProtectedRoute allowedRoles={['admin', 'super_admin']}>
              <ProblemCreatePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/problems"
          element={
            <ProtectedRoute allowedRoles={['admin', 'super_admin']}>
              <ProblemEditPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/problems/:id/edit"
          element={
            <ProtectedRoute allowedRoles={['admin', 'super_admin']}>
              <ProblemEditPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/sessions"
          element={
            <ProtectedRoute allowedRoles={['admin', 'super_admin']}>
              <SessionManagePage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Navigate to="/student" replace />
            </ProtectedRoute>
          }
        />
      </Routes>
    </div>
  );
}

export default App;
