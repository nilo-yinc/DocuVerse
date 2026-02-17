import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, useSearchParams } from 'react-router-dom';

import useTitle from '../hooks/useTitle';

const GoogleIcon = () => (
    <svg width="18" height="18" viewBox="0 0 48 48">
        <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
        <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
        <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
        <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
    </svg>
);

const Login = () => {
    const [isLogin, setIsLogin] = useState(true);
    useTitle(isLogin ? 'Login' : 'Register');
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const { login, register, token } = useAuth();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();

    useEffect(() => {
        if (token) {
            navigate('/dashboard');
        }
    }, [token, navigate]);

    // Show error from Google auth failure
    useEffect(() => {
        const googleError = searchParams.get('error');
        if (googleError === 'google_auth_failed') {
            setError('Google authentication failed. Please try again.');
        }
    }, [searchParams]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        if (isLogin) {
            const res = await login(email, password);
            if (res.success) {
                navigate('/dashboard');
            } else {
                setError(res.msg);
            }
        } else {
            const res = await register(name, email, password);
            if (res.success) {
                setError('');
                alert(res.msg);
                setIsLogin(true);
            } else {
                setError(res.msg);
            }
        }
    };

    const handleGoogleLogin = () => {
        const authBaseUrl = import.meta.env.VITE_API_BASE_URL || '/api/v1';
        // For relative URLs, build full URL from current origin
        const fullUrl = authBaseUrl.startsWith('http')
            ? authBaseUrl
            : `${window.location.origin}${authBaseUrl}`;
        window.location.href = `${fullUrl}/users/google/login`;
    };

    return (
        <div className="flex justify-center items-center h-screen bg-dark-bg">
            <form onSubmit={handleSubmit} className="bg-dark-card p-8 rounded border border-neon-purple shadow-lg w-96">
                <h2 className="text-2xl mb-6 text-neon-blue font-bold text-center">
                    {isLogin ? 'DocuVerse Login' : 'Create Account'}
                </h2>

                {error && (
                    <div className={`mb-4 p-3 rounded text-sm ${error.includes('successful') ? 'bg-green-500/10 text-green-400 border-green-500/20' : 'bg-red-500/10 text-red-400 border-red-500/20'} border`}>
                        {error}
                    </div>
                )}

                {!isLogin && (
                    <div className="mb-4">
                        <label className="block mb-2 text-gray-400">Full Name</label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="w-full p-2 bg-dark-input rounded text-white border border-gray-700 focus:border-neon-blue outline-none"
                            required={!isLogin}
                        />
                    </div>
                )}

                <div className="mb-4">
                    <label className="block mb-2 text-gray-400">Email</label>
                    <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full p-2 bg-dark-input rounded text-white border border-gray-700 focus:border-neon-blue outline-none"
                        required
                    />
                </div>
                <div className="mb-6">
                    <label className="block mb-2 text-gray-400">Password</label>
                    <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full p-2 bg-dark-input rounded text-white border border-gray-700 focus:border-neon-blue outline-none"
                        required
                    />
                </div>
                <button type="submit" className="w-full bg-neon-purple text-white p-2 rounded hover:bg-purple-700 transition font-bold mb-4">
                    {isLogin ? 'Enter System' : 'Register'}
                </button>

                {/* Divider */}
                <div className="flex items-center gap-3 my-4">
                    <div className="flex-1 h-px bg-gray-700"></div>
                    <span className="text-xs text-gray-500 uppercase tracking-wider">or</span>
                    <div className="flex-1 h-px bg-gray-700"></div>
                </div>

                {/* Google Sign In */}
                <button
                    type="button"
                    onClick={handleGoogleLogin}
                    className="w-full flex items-center justify-center gap-3 bg-white hover:bg-gray-100 text-gray-800 font-medium py-2.5 px-4 rounded transition shadow-sm border border-gray-300"
                >
                    <GoogleIcon />
                    <span>{isLogin ? 'Sign in with Google' : 'Sign up with Google'}</span>
                </button>

                <div className="text-center text-sm text-gray-500 cursor-pointer hover:text-white mt-4" onClick={() => { setIsLogin(!isLogin); setError(''); }}>
                    {isLogin ? "Need an account? Register" : "Already have an account? Login"}
                </div>
            </form>
        </div>
    );
};

export default Login;
