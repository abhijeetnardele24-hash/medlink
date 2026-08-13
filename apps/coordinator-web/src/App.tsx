import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { Login } from './pages/Login';
import { Layout } from './components/Layout';
import { VerificationQueue } from './pages/VerificationQueue';
import { DoctorsDirectory } from './pages/DoctorsDirectory';
import { PatientsDirectory } from './pages/PatientsDirectory';
import { AppointmentsOverview } from './pages/AppointmentsOverview';
import { Tasks } from './pages/Tasks';
import { Settings } from './pages/Settings';
import { Analytics } from './pages/Analytics';
import './index.css';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          
          <Route element={<ProtectedRoute />}>
            <Route element={<Layout />}>
              <Route path="/" element={<VerificationQueue />} />
              <Route path="/analytics" element={<Analytics />} />
              <Route path="/doctors" element={<DoctorsDirectory />} />
              <Route path="/patients" element={<PatientsDirectory />} />
              <Route path="/appointments" element={<AppointmentsOverview />} />
              <Route path="/tasks" element={<Tasks />} />
              <Route path="/settings" element={<Settings />} />
            </Route>
          </Route>
          
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
