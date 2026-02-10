import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Wizard from './pages/Wizard';
import Demo from './pages/Demo';
import EnterpriseAccess from './pages/EnterpriseAccess';
import StudentAccess from './pages/StudentAccess';
import StudentComingSoon from './pages/StudentComingSoon';
import EnterpriseForm from './pages/EnterpriseForm';
import EnterpriseGeneration from './pages/EnterpriseGeneration';
import LandingPage from './pages/LandingPage';
import SystemDesignPlayground from './pages/SystemDesignPlayground';
import Library from './pages/Library';
import ModelSimulation from './pages/ModelSimulation';
import StudioPage from './pages/StudioPage';
import EnterpriseSRS from './pages/EnterpriseSRS';
import CurriculumPage from './pages/CurriculumPage';

const PrivateRoute = ({ children, redirectTo = "/dashboard" }) => {
  const { token, loading } = useAuth();
  if (loading) return <div className="min-h-screen bg-dark-bg text-white flex items-center justify-center"><div>Loading...</div></div>;
  return token ? children : <Navigate to={redirectTo} />;
};

function App() {
  return (
    <Router>
      <AuthProvider>
        <div className="min-h-screen bg-dark-bg text-white">
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/library" element={<Library />} />
            <Route path="/library/:modelId" element={<ModelSimulation />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/login" element={<Login />} />
            <Route path="/demo/:id" element={<Demo />} />
            <Route path="/studio" element={<Navigate to="/studio/demo" />} />
            <Route path="/studio/:id" element={<StudioPage />} />
            <Route path="/system-design" element={<SystemDesignPlayground />} />
            <Route path="/curriculum" element={<CurriculumPage />} />

            {/* Authentication Pages */}
            <Route path="/enterprise/access" element={<EnterpriseAccess />} />
            <Route path="/student/access" element={<StudentAccess />} />
            <Route path="/student/coming-soon" element={
              <PrivateRoute redirectTo="/student/access">
                <StudentComingSoon />
              </PrivateRoute>
            } />

            {/* Protected Routes - Require Authentication */}
            <Route path="/enterprise/form" element={
              <PrivateRoute redirectTo="/enterprise/access">
                <EnterpriseSRS />
              </PrivateRoute>
            } />
            <Route path="/enterprise/generation" element={
              <PrivateRoute redirectTo="/enterprise/access">
                <EnterpriseGeneration />
              </PrivateRoute>
            } />
            <Route path="/enterprise/srs" element={
              <PrivateRoute redirectTo="/enterprise/access">
                <EnterpriseSRS />
              </PrivateRoute>
            } />
            <Route path="/wizard" element={
              <PrivateRoute>
                <Wizard />
              </PrivateRoute>
            } />
          </Routes>
        </div>
      </AuthProvider>
    </Router>
  );
}

export default App;
