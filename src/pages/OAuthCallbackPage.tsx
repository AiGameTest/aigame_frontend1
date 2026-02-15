import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';

export function OAuthCallbackPage() {
  const { provider } = useParams<{ provider: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const doOAuthLogin = useAuthStore((s) => s.oauthLogin);
  const [error, setError] = useState<string | null>(null);
  const calledRef = useRef(false);

  useEffect(() => {
    if (calledRef.current) return;
    calledRef.current = true;

    const code = searchParams.get('code');
    if (!code || !provider) {
      setError('Invalid OAuth callback');
      return;
    }

    doOAuthLogin(provider, code)
      .then(() => navigate('/', { replace: true }))
      .catch(() => setError('Login failed. Please try again.'));
  }, [provider, searchParams, doOAuthLogin, navigate]);

  if (error) {
    return (
      <div className="card max-w-md mx-auto text-center space-y-3">
        <p className="text-red-400">{error}</p>
        <a href="/login" className="btn inline-block">Back to Login</a>
      </div>
    );
  }

  return (
    <div className="card max-w-md mx-auto text-center">
      <p>Logging in...</p>
    </div>
  );
}
