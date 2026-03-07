import { BrowserRouter, Routes, Route, useLocation, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { Toaster } from './components/ui/sonner';
import './App.css';

// Pages
import LandingPage from './pages/LandingPage';
import AuthPage from './pages/AuthPage';
import AuthCallback from './pages/AuthCallback';
import FeedPage from './pages/FeedPage';
import ReelsPage from './pages/ReelsPage';
import LivePage from './pages/LivePage';
import MarketplacePage from './pages/MarketplacePage';
import ProfilePage from './pages/ProfilePage';
import CreatePostPage from './pages/CreatePostPage';
import CreateProductPage from './pages/CreateProductPage';
import BusinessDashboard from './pages/BusinessDashboard';
import SearchPage from './pages/SearchPage';
import NotificationsPage from './pages/NotificationsPage';
import ChatPage from './pages/ChatPage';
import CreateAdPage from './pages/CreateAdPage';
import SecuritySettingsPage from './pages/SecuritySettingsPage';

// Layout
import MainLayout from './components/layout/MainLayout';

// Protected Route Component
const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#FFF5E6] to-white">
        <div className="text-center">
          <div className="w-20 h-20 mx-auto mb-6 relative">
            <div className="absolute inset-0 rounded-full bg-gradient-to-r from-[#FF6B35] to-[#00CED1] animate-spin"></div>
            <div className="absolute inset-1 rounded-full bg-white flex items-center justify-center">
              <span className="text-3xl font-bold gradient-text">F</span>
            </div>
          </div>
          <p className="text-[#1A1A2E] font-semibold text-lg">Chargement...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  return children;
};

// App Router Component
function AppRouter() {
  const location = useLocation();

  // Check URL fragment for session_id (OAuth callback)
  if (location.hash?.includes('session_id=')) {
    return <AuthCallback />;
  }

  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/auth" element={<AuthPage />} />
      
      {/* Protected Routes */}
      <Route path="/feed" element={
        <ProtectedRoute>
          <MainLayout>
            <FeedPage />
          </MainLayout>
        </ProtectedRoute>
      } />
      
      <Route path="/reels" element={
        <ProtectedRoute>
          <MainLayout hideNav>
            <ReelsPage />
          </MainLayout>
        </ProtectedRoute>
      } />
      
      <Route path="/live" element={
        <ProtectedRoute>
          <MainLayout>
            <LivePage />
          </MainLayout>
        </ProtectedRoute>
      } />
      
      <Route path="/marketplace" element={
        <ProtectedRoute>
          <MainLayout>
            <MarketplacePage />
          </MainLayout>
        </ProtectedRoute>
      } />
      
      <Route path="/profile" element={
        <ProtectedRoute>
          <MainLayout>
            <ProfilePage />
          </MainLayout>
        </ProtectedRoute>
      } />
      
      <Route path="/profile/:userId" element={
        <ProtectedRoute>
          <MainLayout>
            <ProfilePage />
          </MainLayout>
        </ProtectedRoute>
      } />
      
      <Route path="/create" element={
        <ProtectedRoute>
          <MainLayout>
            <CreatePostPage />
          </MainLayout>
        </ProtectedRoute>
      } />
      
      <Route path="/create-product" element={
        <ProtectedRoute>
          <MainLayout>
            <CreateProductPage />
          </MainLayout>
        </ProtectedRoute>
      } />
      
      <Route path="/business" element={
        <ProtectedRoute>
          <MainLayout>
            <BusinessDashboard />
          </MainLayout>
        </ProtectedRoute>
      } />
      
      <Route path="/create-ad" element={
        <ProtectedRoute>
          <MainLayout>
            <CreateAdPage />
          </MainLayout>
        </ProtectedRoute>
      } />
      
      <Route path="/search" element={
        <ProtectedRoute>
          <MainLayout>
            <SearchPage />
          </MainLayout>
        </ProtectedRoute>
      } />
      
      <Route path="/notifications" element={
        <ProtectedRoute>
          <MainLayout>
            <NotificationsPage />
          </MainLayout>
        </ProtectedRoute>
      } />
      
      <Route path="/chat" element={
        <ProtectedRoute>
          <MainLayout>
            <ChatPage />
          </MainLayout>
        </ProtectedRoute>
      } />
      
      <Route path="/security" element={
        <ProtectedRoute>
          <MainLayout>
            <SecuritySettingsPage />
          </MainLayout>
        </ProtectedRoute>
      } />
      
      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRouter />
        <Toaster position="top-center" richColors />
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
