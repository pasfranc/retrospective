import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import useRetroStore from '../store/retroStore';

export function useAuth() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { token, user, setAuth, clearAuth } = useRetroStore();

  useEffect(() => {
    const tokenFromUrl = searchParams.get('token');

    if (tokenFromUrl && !token) {
      // Verify token with backend
      fetch('/api/auth/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: tokenFromUrl })
      })
        .then(res => res.json())
        .then(data => {
          if (data.valid) {
            setAuth(tokenFromUrl, data.data);
          } else {
            alert('Invalid or expired token');
            navigate('/');
          }
        })
        .catch(err => {
          console.error('Token verification failed:', err);
          alert('Failed to verify token');
          navigate('/');
        });
    }
  }, [searchParams, token, setAuth, navigate]);

  return { token, user, clearAuth };
}
