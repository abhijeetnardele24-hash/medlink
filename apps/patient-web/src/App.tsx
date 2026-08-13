import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { Login } from './pages/Login';
import { Signup } from './pages/Signup';
import { Dashboard } from './pages/Dashboard';
import { DoctorProfile } from './pages/DoctorProfile';
import { History } from './pages/History';
import { Consents } from './pages/Consents';
import { Consultation } from './pages/Consultation';
import { PharmacyStorefront } from './pages/PharmacyStorefront';
import { PharmacyOrders } from './pages/PharmacyOrders';
import { HealthProfile } from './pages/HealthProfile';
import { MedicalRecords } from './pages/MedicalRecords';
import { Layout } from './components/Layout';
import './index.css';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          
          <Route element={<ProtectedRoute />}>
            <Route element={<Layout />}>
              <Route path="/" element={<Dashboard />} />
              <Route path="/doctor/:id" element={<DoctorProfile />} />
              <Route path="/history" element={<History />} />
              <Route path="/profile" element={<HealthProfile />} />
              <Route path="/medical-records" element={<MedicalRecords />} />
              <Route path="/consents" element={<Consents />} />
              <Route path="/pharmacy" element={<PharmacyStorefront />} />
              <Route path="/pharmacy-orders" element={<PharmacyOrders />} />
            </Route>
            {/* Consultation is full screen, no sidebar */}
            <Route path="/consultation/:id" element={<Consultation />} />
          </Route>
          
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
