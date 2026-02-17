import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const GoogleCallback = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const { handleGoogleCallback } = useAuth();

    useEffect(() => {
        const token = searchParams.get('token');
        const name = searchParams.get('name');
        const email = searchParams.get('email');
        const id = searchParams.get('id');

        if (token) {
            handleGoogleCallback({ token, user: { id, name, email } });
            navigate('/dashboard', { replace: true });
        } else {
            navigate('/login?error=google_auth_failed', { replace: true });
        }
    }, [searchParams, navigate, handleGoogleCallback]);

    return (
        <div className="flex justify-center items-center h-screen bg-dark-bg">
            <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-neon-blue mx-auto mb-4"></div>
                <p className="text-gray-400">Completing Google sign-in...</p>
            </div>
        </div>
    );
};

export default GoogleCallback;
