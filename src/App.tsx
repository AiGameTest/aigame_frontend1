import { useEffect } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { useAuthStore } from './store/authStore';
import { AppLayout } from './components/AppLayout';
import { ProtectedRoute } from './routes/ProtectedRoute';
import { HomePage } from './pages/HomePage';
import { LoginPage } from './pages/LoginPage';
import { OAuthCallbackPage } from './pages/OAuthCallbackPage';
import { CasePage } from './pages/CasePage';
import { PlayPage } from './pages/PlayPage';
import { ResultPage } from './pages/ResultPage';
import { CreatePage } from './pages/CreatePage';
import { ProfilePage } from './pages/ProfilePage';
import { AiModePage } from './pages/AiModePage';

export default function App() {
  const bootstrap = useAuthStore((s) => s.bootstrap);

  useEffect(() => {
    void bootstrap();
  }, [bootstrap]);

  return (
    <AppLayout>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/oauth/:provider/callback" element={<OAuthCallbackPage />} />
        <Route path="/ai" element={<ProtectedRoute><AiModePage /></ProtectedRoute>} />
        <Route path="/case/:id" element={<ProtectedRoute><CasePage /></ProtectedRoute>} />
        <Route path="/play/:sessionId" element={<ProtectedRoute><PlayPage /></ProtectedRoute>} />
        <Route path="/result/:sessionId" element={<ProtectedRoute><ResultPage /></ProtectedRoute>} />
        <Route path="/create" element={<ProtectedRoute><CreatePage /></ProtectedRoute>} />
        <Route path="/me" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AppLayout>
  );
}
