import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './AuthContext';
import Login from './Login';
import Register from './Register';
import ForgotPassword from './ForgotPassword';
import ResetPassword from './ResetPassword';
import Dashboard from './Dashboard';
import TemplateGallery from './TemplateGallery';
import WebsiteBuilder from './WebsiteBuilder';
import PageManagement from './PageManagement';
import Settings from './Settings';
import Billing from './Billing';
import PaymentHistory from './PaymentHistory';
import Invoices from './Invoices';
import SelectPlan from './SelectPlan';
import MediaManager from './MediaManager';
import AnalyticsDashboard from './AnalyticsDashboard';
import BlogManagement from './BlogManagement';
import Storefront from './Storefront';
import FormsContactPage from './pages/FormsContactPage';
import LandingPage from './LandingPage';
import Layout from './Layout';
import VerifyEmail from './VerifyEmail';
import OAuthCallback from './OAuthCallback';
import Publish from './Publish';
import DomainManagement from './DomainManagement';

const PlanProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
   
  if (loading) {
    return <div style={{ textAlign: 'center', padding: 40 }}>Loading...</div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }

  const hasSelectedPlan = localStorage.getItem('has_selected_plan') === 'true';
  if (!hasSelectedPlan) {
    return <Navigate to="/select-plan" />;
  }

  return (
    <Layout>
      {children}
    </Layout>
  );
};

function AppRoutes() {
  const { isAuthenticated } = useAuth();

  return (
    <Routes>
      <Route path="/" element={!isAuthenticated ? <LandingPage /> : <Navigate to="/dashboard" />} />
      <Route path="/login" element={!isAuthenticated ? <Login /> : <Navigate to="/dashboard" />} />
      <Route path="/register" element={!isAuthenticated ? <Register /> : <Navigate to="/dashboard" />} />
      <Route path="/forgot-password" element={!isAuthenticated ? <ForgotPassword /> : <Navigate to="/dashboard" />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route path="/verify-email" element={<VerifyEmail />} />
      <Route path="/oauth/callback" element={<OAuthCallback />} />
      <Route path="/select-plan" element={isAuthenticated ? <SelectPlan /> : <Navigate to="/login" />} />
      <Route path="/dashboard" element={<PlanProtectedRoute><Dashboard /></PlanProtectedRoute>} />
      <Route path="/gallery" element={<PlanProtectedRoute><TemplateGallery /></PlanProtectedRoute>} />
      <Route path="/builder" element={<PlanProtectedRoute><WebsiteBuilder /></PlanProtectedRoute>} />
      <Route path="/pages" element={<PlanProtectedRoute><PageManagement /></PlanProtectedRoute>} />
      <Route path="/settings" element={<PlanProtectedRoute><Settings /></PlanProtectedRoute>} />
      <Route path="/billing" element={<PlanProtectedRoute><Billing /></PlanProtectedRoute>} />
      <Route path="/media" element={<PlanProtectedRoute><MediaManager /></PlanProtectedRoute>} />
      <Route path="/analytics" element={<PlanProtectedRoute><AnalyticsDashboard /></PlanProtectedRoute>} />
      <Route path="/blog" element={<PlanProtectedRoute><BlogManagement /></PlanProtectedRoute>} />
      <Route path="/store" element={<PlanProtectedRoute><Storefront /></PlanProtectedRoute>} />
      <Route path="/forms" element={<PlanProtectedRoute><FormsContactPage /></PlanProtectedRoute>} />
<Route path="/domains" element={<PlanProtectedRoute><DomainManagement /></PlanProtectedRoute>} />
          <Route path="/publish/:id?" element={<PlanProtectedRoute><Publish /></PlanProtectedRoute>} />
          <Route path="/billing/history" element={<PlanProtectedRoute><PaymentHistory /></PlanProtectedRoute>} />
          <Route path="/billing/invoices" element={<PlanProtectedRoute><Invoices /></PlanProtectedRoute>} />
          <Route path="*" element={<Navigate to={isAuthenticated ? "/dashboard" : "/"} />} />
    </Routes>
  );
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <AppRoutes />
      </Router>
    </AuthProvider>
  );
}

export default App;