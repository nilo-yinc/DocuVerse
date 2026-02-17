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

        const token = searchParams.get('token');
        const name = searchParams.get('name');
        const email = searchParams.get('email');
        const id = searchParams.get('id');

        if (token) {
            processed.current = true;
            handleGoogleCallback({ token, user: { id, name, email } });
            // Navigate after a short delay to let state settle
            setTimeout(() => {
                window.location.href = '/dashboard';
            }, 300);
        } else {
            processed.current = true;
            window.location.href = '/login?error=google_auth_failed';
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []); // Run once on mount only

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
