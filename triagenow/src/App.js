import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import TriageForm from './TriageForm';
import Register from './Register';
import Login from './Login';
import PatientDashboard from './PatientDashboard';
import CareTeamDashboard from './CareTeamDashboard';
import AdminDashboard from './AdminDashboard';
import ProtectedRoute from './ProtectedRoute';
import { useAuth } from './AuthContext';


function App() {
    const { user, logout } = useAuth();
  return (
    <Router>
      <nav className="p-4 bg-gray-100 flex justify-center space-x-4">
        <Link to="/">Triage</Link>
        <Link to="/register">Register</Link>
        <Link to="/login">Login</Link>
          {user && (
            <button
                onClick={() => {
                    logout();
                    window.location.href = '/login';  // or use `useNavigate()` if you prefer
                }}
                className="bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700"
            >
                Logout
            </button>
          )}
      </nav>

      <Routes>
        <Route path="/register" element={<Register />} />
        <Route path="/login" element={<Login />} />
        <Route path="/" element={<ProtectedRoute> <TriageForm /> </ProtectedRoute>}/>
          <Route path="/dashboard" element={<ProtectedRoute><PatientDashboard /></ProtectedRoute>} />
        <Route path="/care-dashboard" element={<ProtectedRoute><CareTeamDashboard /></ProtectedRoute>} />
        <Route path="/admin-dashboard" element={<ProtectedRoute><AdminDashboard /></ProtectedRoute>} />
      </Routes>
    </Router>
  );
}

export default App;

