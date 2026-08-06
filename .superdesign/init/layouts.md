# Layouts

No dedicated shared layout components exist in `apps/coordinator-web` yet. The app shell will be implemented directly in `apps/coordinator-web/src/App.tsx`.

Doctor web currently uses route-level layouts inside page components rather than a separate shell component.

Relevant files:

```tsx
// apps/doctor-web/src/App.tsx
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { Availability } from './pages/Availability';
import { Consultation } from './pages/Consultation';
import './index.css';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route element={<ProtectedRoute />}>
            <Route path="/" element={<Dashboard />} />
            <Route path="/availability" element={<Availability />} />
            <Route path="/consultation/:id" element={<Consultation />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
```
