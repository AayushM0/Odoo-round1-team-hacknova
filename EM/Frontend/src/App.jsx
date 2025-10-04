import './App.css'
import { Routes , Route } from 'react-router-dom'
import Register from './pages/SignUp.jsx'
import Login from './pages/login.jsx'
import EmployeeDashboard from './pages/Employee.jsx'
import AdminDashboard from './pages/Admin.jsx'  
import ManagerDashboard from './pages/Manager.jsx'
import Dashboard from './pages/Dashboard.jsx'
function App() {
  return (
    <>
    <Routes>
      <Route path="/register" element={<Register />} />
      <Route path="/login" element={<Login />} />
      <Route path="/employee" element={<EmployeeDashboard />} />
      <Route path="/admin" element={<AdminDashboard />} />
      <Route path="/manager" element={<ManagerDashboard />} />
      <Route path="/" element={<Dashboard />} />
    </Routes>
    </>
  )
}

export default App
