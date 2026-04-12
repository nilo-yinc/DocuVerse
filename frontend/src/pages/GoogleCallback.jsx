import { useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const GoogleCallback = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const { handleGoogleCallback } = useAuth();
    const processed = useRef(false);

    useEffect(() => {
        // Prevent re-processing on re-renders
        if (processed.current) return;

        const token = (searchParams.get('token') || '').trim();
        const name = searchParams.get('name');
        const email = searchParams.get('email');
        const id = searchParams.get('id');
        const isLikelyJwt = token.split('.').length === 3;

        if (token && isLikelyJwt) {
            processed.current = true;
            handleGoogleCallback({ token, user: { id, name, email } });

            // Navigate to stored redirect URL if exists, else dashboard
            const target = sessionStorage.getItem('oauth_redirect_target') || '/dashboard';
            sessionStorage.removeItem('oauth_redirect_target');

            // SPA navigation avoids a full reload race where auth state is still settling.
            navigate(target, { replace: true });
        } else {
            processed.current = true;
            navigate('/login?error=google_auth_failed', { replace: true });
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [searchParams, handleGoogleCallback, navigate]);

    return (
        <div className="flex justify-center items-center h-screen bg-dark-bg">
            <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-neon-blue mx-auto mb-4"></div>
                <p className="text-green-400 font-medium">Sign-in successful! Redirecting...</p>
            </div>
        </div>
    );
};

export default GoogleCallback;
