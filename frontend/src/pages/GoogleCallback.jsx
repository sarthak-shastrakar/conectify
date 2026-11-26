import React, { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../contexts/AuthContext';

export default function GoogleCallback() {
  const navigate = useNavigate();
  const { handleTokenLogin } = React.useContext(AuthContext);
  const handledRef = useRef(false);

  useEffect(() => {
    if (handledRef.current) return;

    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');
    const error = params.get('error');

    if (error || !token) {
      navigate('/auth?error=google_failed', { replace: true });
      return;
    }

    handledRef.current = true;

    // Call the auth context logic to store token and fetch profile
    handleTokenLogin(token).catch((err) => {
      console.error('Google callback error:', err);
      navigate('/auth?error=google_failed', { replace: true });
    });
  }, [navigate, handleTokenLogin]);

  // Show a loading spinner while processing
  return (
    <div style={{
      minHeight: '100vh',
      background: '#050810',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 16,
      fontFamily: 'Inter, sans-serif',
    }}>
      <div style={{
        width: 48, height: 48, borderRadius: '50%',
        border: '3px solid rgba(124,58,237,0.2)',
        borderTop: '3px solid #7C3AED',
        animation: 'spin 0.8s linear infinite',
      }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 14 }}>
        Signing you in with Google...
      </p>
    </div>
  );
}
