import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Doctor from './pages/Doctor';
import Patient from './pages/Patient';
import Login from './pages/login';
import Signup from './pages/signup';
import PatientHome from './pages/Patienthome';
import Hospital from './pages/Hospital';     // ← Make sure file is named Hospital.jsx

import './App.css';

function ProtectedRoute({ children, requiredRole }) {
  const token = localStorage.getItem('token');
  const user = JSON.parse(localStorage.getItem('user') || 'null');

  if (!token || !user) {
    return <Navigate to="/login" replace />;
  }

  if (requiredRole && user.role !== requiredRole) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

function App() {
  return (
    <BrowserRouter>
      <Routes>

        {/* Public routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />

        {/* Protected: Doctor only */}
        <Route path="/doctor" element={
          <ProtectedRoute requiredRole="doctor">
            <Doctor />
          </ProtectedRoute>
        } />

        {/* Protected: Patient home */}
        <Route path="/patient-home" element={
          <ProtectedRoute requiredRole="patient">
            <PatientHome />
          </ProtectedRoute>
        } />

        {/* Patient report view (public) */}
        <Route path="/patient/:id" element={<Patient />} />

        {/* NEW: Hospital / Admin Dashboard */}
        <Route path="/hospital" element={
          <ProtectedRoute requiredRole="admin">
            <Hospital />
          </ProtectedRoute>
        } />

        {/* Default → Login */}
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="*" element={<Navigate to="/login" replace />} />

      </Routes>
    </BrowserRouter>
  );
}

export default App;