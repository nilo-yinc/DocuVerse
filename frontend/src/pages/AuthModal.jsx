import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { X, User, Mail, Lock, LogIn, UserPlus, Loader } from 'lucide-react';

const GoogleIcon = () => (
    <svg width="18" height="18" viewBox="0 0 48 48">
        <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
        <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
        <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
        <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
    </svg>
);

const AuthModal = ({ onClose }) => {
    const [isLogin, setIsLogin] = useState(true);
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const { login, register } = useAuth();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            if (isLogin) {
                const res = await login(email, password);
                if (res.success) {
                    onClose();
                } else {
                    setError(res.msg || 'Login failed');
                }
            } else {
                const res = await register(name, email, password);
                if (res.success) {
                    setIsLogin(true);
                    setError('Registration successful! Please login.');
                } else {
                    setError(res.msg || 'Registration failed');
                }
            }
        } catch (err) {
            setError('An error occurred. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleLogin = () => {
        const authBaseUrl = import.meta.env.VITE_API_BASE_URL || '/api/v1';
        const fullUrl = authBaseUrl.startsWith('http')
            ? authBaseUrl
            : `${window.location.origin}${authBaseUrl}`;
        window.location.href = `${fullUrl}/users/google/login`;
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fadeIn">
            <div className="bg-dark-card border border-gray-700 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden relative">

                {/* Header */}
                <div className="bg-gray-900/50 p-6 border-b border-gray-700 flex justify-between items-center">
                    <h2 className="text-xl font-bold text-white flex items-center gap-2">
                        {isLogin ? <LogIn className="text-neon-blue" /> : <UserPlus className="text-neon-purple" />}
                        {isLogin ? 'Login Required' : 'Create Account'}
                    </h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-white transition">
                        <X size={20} />
                    </button>
                </div>

                <div className="p-8">
                    {error && (
                        <div className={`mb-6 p-3 rounded text-sm ${error.includes('successful') ? 'bg-green-500/10 text-green-400 border-green-500/20' : 'bg-red-500/10 text-red-400 border-red-500/20'} border`}>
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-4">
                        {!isLogin && (
                            <div>
                                <label className="text-sm text-gray-400 mb-1 block">Full Name</label>
                                <div className="flex items-center bg-dark-input rounded border border-gray-700 focus-within:border-neon-purple px-3 py-2">
                                    <User size={18} className="text-gray-500 mr-2" />
                                    <input
                                        type="text"
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        className="bg-transparent w-full text-white focus:outline-none placeholder-gray-600"
                                        placeholder="John Doe"
                                        required={!isLogin}
                                    />
                                </div>
                            </div>
                        )}

                        <div>
                            <label className="text-sm text-gray-400 mb-1 block">Email Address</label>
                            <div className="flex items-center bg-dark-input rounded border border-gray-700 focus-within:border-neon-blue px-3 py-2">
                                <Mail size={18} className="text-gray-500 mr-2" />
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="bg-transparent w-full text-white focus:outline-none placeholder-gray-600"
                                    placeholder="name@example.com"
                                    required
                                />
                            </div>
                        </div>

                        <div>
                            <label className="text-sm text-gray-400 mb-1 block">Password</label>
                            <div className="flex items-center bg-dark-input rounded border border-gray-700 focus-within:border-neon-blue px-3 py-2">
                                <Lock size={18} className="text-gray-500 mr-2" />
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="bg-transparent w-full text-white focus:outline-none placeholder-gray-600"
                                    placeholder="••••••••"
                                    required
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className={`w-full py-3 rounded font-bold text-white transition flex justify-center items-center gap-2 mt-2 ${isLogin ? 'bg-neon-blue hover:bg-blue-600 shadow-[0_0_15px_rgba(0,243,255,0.3)]' : 'bg-neon-purple hover:bg-purple-700 shadow-[0_0_15px_rgba(188,19,254,0.3)]'}`}
                        >
                            {loading && <Loader className="animate-spin" size={18} />}
                            {isLogin ? 'Enter Dashboard' : 'Create Account'}
                        </button>
                    </form>

                    {/* Divider */}
                    <div className="flex items-center gap-3 my-5">
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

                    <div className="mt-6 text-center text-sm">
                        <span className="text-gray-500">{isLogin ? "Don't have an account?" : "Already have an account?"}</span>
                        <button
                            onClick={() => { setIsLogin(!isLogin); setError(''); }}
                            className={`ml-2 font-medium hover:underline ${isLogin ? 'text-neon-purple' : 'text-neon-blue'}`}
                        >
                            {isLogin ? 'Register now' : 'Login here'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AuthModal;

