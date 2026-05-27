import React, { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth, API } from '../App';
import { toast } from 'sonner';

// REMINDER: DO NOT HARDCODE THE URL, OR ADD ANY FALLBACKS OR REDIRECT URLS, THIS BREAKS THE AUTH
function AuthCallback() {
  const navigate = useNavigate();
  const { setUser } = useAuth();
  const hasProcessed = useRef(false);

  useEffect(() => {
    if (hasProcessed.current) return;
    hasProcessed.current = true;

    const processSession = async () => {
      // Extract session_id from URL fragment
      const hash = window.location.hash;
      const params = new URLSearchParams(hash.substring(1));
      const sessionId = params.get('session_id');

      if (!sessionId) {
        toast.error('Brak danych autoryzacji');
        navigate('/auth');
        return;
      }

      try {
        const response = await fetch(`${API}/auth/google/session`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ session_id: sessionId }),
        });

        if (!response.ok) {
          throw new Error('Auth failed');
        }

        const userData = await response.json();
        setUser(userData);
        toast.success('Zalogowano pomyślnie!');
        
        // Clear hash from URL
        window.history.replaceState(null, '', window.location.pathname);
        navigate('/', { state: { user: userData }, replace: true });
      } catch (error) {
        console.error('Auth callback error:', error);
        toast.error('Logowanie nie powiodło się');
        navigate('/auth');
      }
    };

    processSession();
  }, [navigate, setUser]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
        <p className="text-muted-foreground font-body">Logowanie...</p>
      </div>
    </div>
  );
}

export default AuthCallback;
