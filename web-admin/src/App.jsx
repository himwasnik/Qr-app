import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardLayout from './components/DashboardLayout';
import DashboardHome from './pages/DashboardHome';
import MenuManager from './pages/MenuManager';
import Categories from './pages/Categories';
import QRCodePage from './pages/QRCodePage';
import SubscriptionPage from './pages/SubscriptionPage';
import RestaurantSettings from './pages/RestaurantSettings';
import CustomerMenu from './pages/CustomerMenu';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <DashboardLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<DashboardHome />} />
            <Route path="menu" element={<MenuManager />} />
            <Route path="categories" element={<Categories />} />
            <Route path="qr-code" element={<QRCodePage />} />
            <Route path="subscription" element={<SubscriptionPage />} />
            <Route path="settings" element={<RestaurantSettings />} />
          </Route>

          {/* Public customer menu route */}
          <Route path="/menu/:slug" element={<CustomerMenu />} />

          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
