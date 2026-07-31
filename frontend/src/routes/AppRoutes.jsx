import { Routes, Route } from 'react-router-dom';
import { Layout } from '../components/layout/Layout';
import { Home } from '../pages/Home';
import { SystemStatus } from '../pages/SystemStatus';
import { Login } from '../pages/Login';
import { Register } from '../pages/Register';
import { VerifyOTP } from '../pages/VerifyOTP';
import { Dashboard } from '../pages/Dashboard';
import { SharedFile } from '../pages/SharedFile';
import { AdminDashboard } from '../pages/AdminDashboard';
import { Subscription } from '../pages/Subscription';
import { ShareDashboard } from '../pages/ShareDashboard';
import { SharedByMe } from '../pages/SharedByMe';
import { SharedWithMe } from '../pages/SharedWithMe';
import { ManagePermissions } from '../pages/ManagePermissions';
import { Settings } from '../pages/Settings';
import { NotFound } from '../pages/NotFound';
import { ProtectedRoute } from './ProtectedRoute';
import { AdminRoute } from './AdminRoute';
import { GuestRoute } from './GuestRoute';

export const AppRoutes = () => {
  return (
    <Routes>
      {/* Standalone Public Shared File Preview Route */}
      <Route path="guest/access/:shareToken" element={<SharedFile />} />
      <Route path="share-preview/:shareToken" element={<SharedFile />} />
      <Route path="share/:shareToken" element={<SharedFile />} />

      <Route path="/" element={<Layout />}>
        {/* Public Routes */}
        <Route index element={<Home />} />
        <Route path="status" element={<SystemStatus />} />
        <Route path="verify-otp" element={<VerifyOTP />} />

        {/* Guest Only Routes (Redirect if logged in) */}
        <Route element={<GuestRoute />}>
          <Route path="login" element={<Login />} />
          <Route path="register" element={<Register />} />
        </Route>

        {/* Protected Routes */}
        <Route element={<ProtectedRoute />}>
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="subscription" element={<Subscription />} />
          <Route path="share" element={<ShareDashboard />} />
          <Route path="share/shared-by-me" element={<SharedByMe />} />
          <Route path="share/shared-with-me" element={<SharedWithMe />} />
          <Route path="share/manage/:fileId" element={<ManagePermissions />} />
          <Route path="settings" element={<Settings />} />
        </Route>

        {/* Admin Protected Routes */}
        <Route element={<AdminRoute />}>
          <Route path="admin" element={<AdminDashboard />} />
        </Route>

        {/* 404 Catch-all */}
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  );
};
