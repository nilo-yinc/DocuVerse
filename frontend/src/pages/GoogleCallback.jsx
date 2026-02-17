import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const GoogleCallback = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const { handleGoogleCallback } = useAuth();
    const [status, setStatus] = useState('processing');

    useEffect(() => {
        const token = searchParams.get('token');
        const name = searchParams.get('name');
        const email = searchParams.get('email');
        const id = searchParams.get('id');

        if (token) {
            try {
                handleGoogleCallback({ token, user: { id, name, email } });
                setStatus('success');
                // Small delay for state to settle before navigating
                setTimeout(() => {
                    navigate('/dashboard', { replace: true });
                }, 500);
            } catch (err) {
                console.error('Google callback error:', err);
                setStatus('error');
                setTimeout(() => {
                    navigate('/login?error=google_auth_failed', { replace: true });
                }, 1500);
            }
        } else {
            setStatus('error');
            setTimeout(() => {
                navigate('/login?error=google_auth_failed', { replace: true });
            }, 1500);
        }

        // Safety timeout — if we're stuck for more than 5s, force redirect
        const timeout = setTimeout(() => {
            const currentToken = document.cookie.includes('token=');
            if (currentToken) {
                navigate('/dashboard', { replace: true });
            } else {
                navigate('/login?error=google_auth_failed', { replace: true });
            }
        }, 5000);

        return () => clearTimeout(timeout);
    }, [searchParams, navigate, handleGoogleCallback]);

    return (
        <div className="flex justify-center items-center h-screen bg-dark-bg">
            <div className="text-center">
                {status === 'processing' && (
                    <>
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-neon-blue mx-auto mb-4"></div>
                        <p className="text-gray-400">Completing Google sign-in...</p>
                    </>
                )}
                {status === 'success' && (
                    <>
                        <div className="text-green-400 text-4xl mb-4">✓</div>
                        <p className="text-green-400 font-medium">Sign-in successful! Redirecting...</p>
                    </>
                )}
                {status === 'error' && (
                    <>
                        <div className="text-red-400 text-4xl mb-4">✗</div>
                        <p className="text-red-400 font-medium">Sign-in failed. Redirecting to login...</p>
                    </>
                )}
            </div>
        </div>
    );
};

export default GoogleCallback;
