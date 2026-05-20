import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Login from "./assets/components/Login";
import Register from "./assets/components/Register";
import ManagerDashboard from "./assets/components/ManagerDashboard";
import EmployeeDashboard from "./assets/components/EmployeeDashboard";
import ProtectedRoute from "./assets/components/ProtectedRoute";
import ForgotPassword from "./assets/components/ForgotPassword";


function App() {
  return (
    <BrowserRouter>
      <Routes>

        {/* redirect home to login */}
        <Route path="/" element={<Navigate to="/login" />} />
        <Route path="/Register" element={<Register />} />

        <Route path="/login" element={<Login />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route
          path="/manager-dashboard"
          element={
            <ProtectedRoute allowedRole="manager">
              <ManagerDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/employee-dashboard"
          element={
            <ProtectedRoute allowedRole="employee">
              <EmployeeDashboard />
            </ProtectedRoute>
          }
        />
      </Routes>

    </BrowserRouter>
  );
}

export default App;
