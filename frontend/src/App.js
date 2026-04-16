import { BrowserRouter, Routes, Route, useLocation, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { Toaster } from './components/ui/sonner';
import { Suspense, lazy } from 'react';
import './App.css';

// Loading component - iOS compatible
const PageLoader = () => (
  <div className="fixed inset-0 bg-[#1A1A2E] flex items-center justify-center" style={{ minHeight: '-webkit-fill-available' }}>
    <div className="text-center">
      <div className="w-16 h-16 mx-auto mb-4 animate-pulse">
        <img 
          src="/assets/logo_nati_fenua_v2.svg" 
          alt="Nati Fenua"
          className="w-full h-full drop-shadow-xl"
        />
      </div>
      <p className="text-white/60 text-sm">Chargement...</p>
    </div>
  </div>
);

// Lazy load pages for better performance
const LandingPage = lazy(() => import('./pages/LandingPage'));
const AuthPage = lazy(() => import('./pages/AuthPage'));
const AuthCallback = lazy(() => import('./pages/AuthCallback'));
const ForgotPasswordPage = lazy(() => import('./pages/ForgotPasswordPage'));
const ResetPasswordPage = lazy(() => import('./pages/ResetPasswordPage'));
const FeedPage = lazy(() => import('./pages/FeedPage'));
const ReelsPage = lazy(() => import('./pages/ReelsPage'));
const LivePage = lazy(() => import('./pages/LivePage'));
const MarketplacePage = lazy(() => import('./pages/MarketplacePage'));
const ProfilePage = lazy(() => import('./pages/ProfilePage'));
const MediaPage = lazy(() => import('./pages/MediaPage'));
const CreatePostPage = lazy(() => import('./pages/CreatePostPage'));
const CreateProductPage = lazy(() => import('./pages/CreateProductPage'));
const BusinessDashboard = lazy(() => import('./pages/BusinessDashboard'));
const SearchPage = lazy(() => import('./pages/SearchPage'));
const NotificationsPage = lazy(() => import('./pages/NotificationsPage'));
const ChatPage = lazy(() => import('./pages/ChatPage'));
const CreateAdPage = lazy(() => import('./pages/CreateAdPage'));
const SecuritySettingsPage = lazy(() => import('./pages/SecuritySettingsPage'));
const NotificationSettingsPage = lazy(() => import('./pages/NotificationSettingsPage'));
const AdvertisingPage = lazy(() => import('./pages/AdvertisingPage'));
const PaymentSuccessPage = lazy(() => import('./pages/PaymentPages').then(m => ({ default: m.PaymentSuccessPage })));
const PaymentCancelPage = lazy(() => import('./pages/PaymentPages').then(m => ({ default: m.PaymentCancelPage })));
const AdminLoginPage = lazy(() => import('./pages/AdminLoginPage'));
const AdminDashboardPage = lazy(() => import('./pages/AdminDashboardPage'));
const EditProfilePage = lazy(() => import('./pages/EditProfilePage'));
const LegalPage = lazy(() => import('./pages/LegalPage'));
const GDPRSettingsPage = lazy(() => import('./pages/GDPRSettingsPage'));
const AdminAnalyticsPage = lazy(() => import('./pages/AdminAnalyticsPage'));
const AdminMonitoringPage = lazy(() => import('./pages/AdminMonitoringPage'));
const AdminModerationPage = lazy(() => import('./pages/AdminModerationPage'));
const AdminAutoPublishPage = lazy(() => import('./pages/AdminAutoPublishPage'));
const ManaPage = lazy(() => import('./pages/ManaPage'));
const VendorDashboardPage = lazy(() => import('./pages/VendorDashboardPage'));
const LiveViewPage = lazy(() => import('./pages/LiveViewPage'));

// Components (loaded immediately as they're small)
import CookieBanner from './components/CookieBanner';
import MainLayout from './components/layout/MainLayout';
import NotificationBanner from './components/NotificationBanner';

// Protected Route Component
const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <PageLoader />;
  }

  if (!user) {
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  return children;
};

// Admin Route Component
const AdminRoute = ({ children }) => {
  const adminToken = localStorage.getItem('admin_token');
  
  if (!adminToken) {
    return <Navigate to="/admin/login" replace />;
  }

  return children;
};

function AppContent() {
  const location = useLocation();
  const isLandingPage = location.pathname === '/';
  const isAuthPage = location.pathname === '/auth' || location.pathname.startsWith('/forgot-password') || location.pathname.startsWith('/reset-password');
  const isAdminPage = location.pathname.startsWith('/admin');
  const isLegalPage = location.pathname.startsWith('/legal');

  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/auth" element={<AuthPage />} />
        <Route path="/auth/callback" element={<AuthCallback />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
        <Route path="/legal/*" element={<LegalPage />} />
        
        {/* Admin Routes */}
        <Route path="/admin/login" element={<AdminLoginPage />} />
        <Route path="/admin/dashboard" element={<AdminRoute><AdminDashboardPage /></AdminRoute>} />
        <Route path="/admin/analytics" element={<AdminRoute><AdminAnalyticsPage /></AdminRoute>} />
        <Route path="/admin/monitoring" element={<AdminRoute><AdminMonitoringPage /></AdminRoute>} />
        <Route path="/admin/moderation" element={<AdminRoute><AdminModerationPage /></AdminRoute>} />
        <Route path="/admin/auto-publish" element={<AdminRoute><AdminAutoPublishPage /></AdminRoute>} />
        
        {/* Protected Routes with Layout */}
        <Route path="/feed" element={<ProtectedRoute><MainLayout><FeedPage /></MainLayout></ProtectedRoute>} />
        <Route path="/reels" element={<ProtectedRoute><MainLayout><ReelsPage /></MainLayout></ProtectedRoute>} />
        <Route path="/live" element={<ProtectedRoute><MainLayout><LivePage /></MainLayout></ProtectedRoute>} />
        <Route path="/live/:liveId" element={<ProtectedRoute><MainLayout><LiveViewPage /></MainLayout></ProtectedRoute>} />
        <Route path="/marketplace" element={<ProtectedRoute><MainLayout><MarketplacePage /></MainLayout></ProtectedRoute>} />
        <Route path="/profile" element={<ProtectedRoute><MainLayout><ProfilePage /></MainLayout></ProtectedRoute>} />
        <Route path="/profile/edit" element={<ProtectedRoute><MainLayout><EditProfilePage /></MainLayout></ProtectedRoute>} />
        <Route path="/profile/:userId" element={<ProtectedRoute><MainLayout><ProfilePage /></MainLayout></ProtectedRoute>} />
        <Route path="/media/:mediaId" element={<ProtectedRoute><MainLayout><MediaPage /></MainLayout></ProtectedRoute>} />
        <Route path="/create" element={<ProtectedRoute><MainLayout><CreatePostPage /></MainLayout></ProtectedRoute>} />
        <Route path="/create-product" element={<ProtectedRoute><MainLayout><CreateProductPage /></MainLayout></ProtectedRoute>} />
        <Route path="/business" element={<ProtectedRoute><MainLayout><BusinessDashboard /></MainLayout></ProtectedRoute>} />
        <Route path="/search" element={<ProtectedRoute><MainLayout><SearchPage /></MainLayout></ProtectedRoute>} />
        <Route path="/notifications" element={<ProtectedRoute><MainLayout><NotificationsPage /></MainLayout></ProtectedRoute>} />
        <Route path="/chat" element={<ProtectedRoute><MainLayout><ChatPage /></MainLayout></ProtectedRoute>} />
        <Route path="/chat/:conversationId" element={<ProtectedRoute><MainLayout><ChatPage /></MainLayout></ProtectedRoute>} />
        <Route path="/create-ad" element={<ProtectedRoute><MainLayout><CreateAdPage /></MainLayout></ProtectedRoute>} />
        <Route path="/settings/security" element={<ProtectedRoute><MainLayout><SecuritySettingsPage /></MainLayout></ProtectedRoute>} />
        <Route path="/settings/notifications" element={<ProtectedRoute><MainLayout><NotificationSettingsPage /></MainLayout></ProtectedRoute>} />
        <Route path="/settings/privacy" element={<ProtectedRoute><MainLayout><GDPRSettingsPage /></MainLayout></ProtectedRoute>} />
        <Route path="/advertising" element={<ProtectedRoute><MainLayout><AdvertisingPage /></MainLayout></ProtectedRoute>} />
        <Route path="/payment/success" element={<PaymentSuccessPage />} />
        <Route path="/payment/cancel" element={<PaymentCancelPage />} />
        <Route path="/mana" element={<ProtectedRoute><MainLayout><ManaPage /></MainLayout></ProtectedRoute>} />
        <Route path="/pulse" element={<Navigate to="/mana" replace />} />
        <Route path="/vendor/dashboard" element={<ProtectedRoute><MainLayout><VendorDashboardPage /></MainLayout></ProtectedRoute>} />
        
        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      
      {/* Cookie Banner - shown on all pages except auth */}
      {!isAuthPage && !isAdminPage && <CookieBanner />}
      
      {/* Notification Permission Banner */}
      {!isAuthPage && !isAdminPage && <NotificationBanner />}
      
      {/* Toast notifications */}
      <Toaster position="top-center" richColors />
    </Suspense>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
