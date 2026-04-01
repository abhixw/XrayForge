import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Doctor from './pages/Doctor';
import Patient from './pages/Patient';
import './App.css';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/doctor" element={<Doctor />} />
        <Route path="/patient/:id" element={<Patient />} />
        {/* Default redirect to doctor for demo ease */}
        <Route path="/" element={<Navigate to="/doctor" />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
