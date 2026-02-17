import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../api/client';
import { Eye, EyeOff, CheckCircle, GraduationCap, ArrowLeft, KeyRound } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import useTitle from '../hooks/useTitle';

const GoogleIcon = () => (
    <svg width="18" height="18" viewBox="0 0 48 48">
        <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
        <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
        <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
        <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
    </svg>
);

const StudentAccess = () => {
    const navigate = useNavigate();
    const { login: contextLogin, token } = useAuth();
    const [isLogin, setIsLogin] = useState(true);
    useTitle(isLogin ? 'Student Access' : 'Student Registration');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [name, setName] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [rememberMe, setRememberMe] = useState(false);

    // Forgot password states
    const [forgotMode, setForgotMode] = useState(false);
    const [forgotEmail, setForgotEmail] = useState('');
    const [forgotOtp, setForgotOtp] = useState('');
    const [forgotNewPassword, setForgotNewPassword] = useState('');

    // UI States
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [successMsg, setSuccessMsg] = useState('');

    useEffect(() => {
        if (token) {
            navigate('/student/coming-soon');
        }
    }, [token, navigate]);

    useEffect(() => {
        const savedEmail = localStorage.getItem('docuverse_remember_email');
        if (savedEmail) {
            setEmail(savedEmail);
            setRememberMe(true);
        }
    }, []);

    const handleGoogleLogin = () => {
        const authBaseUrl = import.meta.env.VITE_API_BASE_URL || '/api/v1';
        const fullUrl = authBaseUrl.startsWith('http') ? authBaseUrl : `${window.location.origin}${authBaseUrl}`;
        window.location.href = `${fullUrl}/users/google/login`;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccessMsg('');
        setLoading(true);

        try {
            if (isLogin) {
                const res = await contextLogin(email, password);
                if (res.success) {
                    if (rememberMe) {
                        localStorage.setItem('docuverse_remember_email', email);
                    } else {
                        localStorage.removeItem('docuverse_remember_email');
                    }
                    setSuccessMsg("Lab Access Granted");
                    setTimeout(() => {
                        navigate('/student/coming-soon');
                    }, 1500);
                } else {
                    setError(res.msg || 'Login failed');
                }
            } else {
                const res = await api.post('/users/register', { name, email, password });
                if (res.status === 201 || res.data) {
                    setSuccessMsg("Registration Successful! Please sign in.");
                    setTimeout(() => {
                        setIsLogin(true);
                        setSuccessMsg('');
                        setPassword('');
                    }, 2000);
                }
            }
        } catch (err) {
            console.error(err);
            const msg = err.response?.data?.message || err.message || "Authentication failed. Please check your credentials.";
            setError(msg);
        } finally {
            setLoading(false);
        }
    };

    const handleForgotSubmitEmail = async (e) => {
        e.preventDefault();
        setError(''); setSuccessMsg(''); setLoading(true);
        try {
            const res = await api.post('/users/forgot-password', { email: forgotEmail });
            if (res.data?.status) {
                setSuccessMsg(res.data.message);
                setForgotMode('otp');
            } else {
                setError(res.data?.message || 'Failed to send reset code');
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to send reset code');
        } finally { setLoading(false); }
    };

    const handleForgotResetPassword = async (e) => {
        e.preventDefault();
        setError(''); setSuccessMsg(''); setLoading(true);
        try {
            const res = await api.post('/users/reset-password', { email: forgotEmail, otp: forgotOtp, newPassword: forgotNewPassword });
            if (res.data?.status) {
                setSuccessMsg(res.data.message);
                setTimeout(() => { setForgotMode(false); setForgotEmail(''); setForgotOtp(''); setForgotNewPassword(''); setSuccessMsg(''); }, 2500);
            } else {
                setError(res.data?.message || 'Password reset failed');
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Password reset failed');
        } finally { setLoading(false); }
    };

    const renderForgotPassword = () => (
        <div className="space-y-5">
            <button type="button" onClick={() => { setForgotMode(false); setError(''); setSuccessMsg(''); }}
                className="flex items-center gap-1.5 text-pink-400 text-xs hover:underline mb-2">
                <ArrowLeft size={14} /> Back to Sign In
            </button>

            <div className="text-center mb-4">
                <div className="flex justify-center mb-3">
                    <div className="p-3 bg-[#161b22] rounded-full border border-pink-500/20">
                        <KeyRound className="text-pink-400" size={24} />
                    </div>
                </div>
                <h2 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-pink-400 to-violet-400">Reset Password</h2>
                <p className="text-gray-400 text-xs mt-1">
                    {forgotMode === 'otp' ? 'Enter the code sent to your email' : "We'll send a verification code to your email"}
                </p>
            </div>

            <AnimatePresence mode="wait">
                {error && (
                    <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                        className="p-3 bg-red-900/20 text-red-300 text-xs rounded-xl border border-red-800/30 flex items-center gap-2">
                        <span>⚠️</span> {error}
                    </motion.div>
                )}
                {successMsg && (
                    <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                        className="p-3 bg-green-900/20 text-green-300 text-xs rounded-xl border border-green-800/30 flex items-center gap-2">
                        <CheckCircle size={16} /> {successMsg}
                    </motion.div>
                )}
            </AnimatePresence>

            {forgotMode === 'email' ? (
                <form onSubmit={handleForgotSubmitEmail} className="space-y-5">
                    <div>
                        <label className="block text-pink-400 text-[10px] font-bold uppercase tracking-[0.2em] mb-2 px-1">Email Address</label>
                        <input type="email" value={forgotEmail} onChange={(e) => setForgotEmail(e.target.value)}
                            className="w-full bg-black/40 border border-white/10 rounded-xl p-3.5 text-white focus:border-pink-500/50 outline-none transition-all placeholder-gray-700 text-sm"
                            placeholder="student@university.edu" required />
                    </div>
                    <button type="submit" disabled={loading}
                        className="w-full bg-gradient-to-r from-[#ec4899] to-[#8b5cf6] text-white font-bold py-3.5 rounded-xl transition-all uppercase tracking-[0.2em] text-xs disabled:opacity-50">
                        {loading ? 'Sending...' : 'Send Verification Code'}
                    </button>
                </form>
            ) : (
                <form onSubmit={handleForgotResetPassword} className="space-y-5">
                    <div>
                        <label className="block text-pink-400 text-[10px] font-bold uppercase tracking-[0.2em] mb-2 px-1">Verification Code</label>
                        <input type="text" value={forgotOtp} onChange={(e) => setForgotOtp(e.target.value)}
                            className="w-full bg-black/40 border border-white/10 rounded-xl p-3.5 text-white focus:border-pink-500/50 outline-none transition-all placeholder-gray-700 text-sm tracking-[0.3em] text-center"
                            placeholder="000000" maxLength={6} required />
                    </div>
                    <div>
                        <label className="block text-violet-400 text-[10px] font-bold uppercase tracking-[0.2em] mb-2 px-1">New Password</label>
                        <input type="password" value={forgotNewPassword} onChange={(e) => setForgotNewPassword(e.target.value)}
                            className="w-full bg-black/40 border border-white/10 rounded-xl p-3.5 text-white focus:border-violet-500/50 outline-none transition-all placeholder-gray-700 text-sm"
                            placeholder="••••••••" minLength={6} required />
                    </div>
                    <button type="submit" disabled={loading}
                        className="w-full bg-gradient-to-r from-[#ec4899] to-[#8b5cf6] text-white font-bold py-3.5 rounded-xl transition-all uppercase tracking-[0.2em] text-xs disabled:opacity-50">
                        {loading ? 'Resetting...' : 'Reset Password'}
                    </button>
                </form>
            )}
        </div>
    );

    return (
        <div className="min-h-screen bg-[#0d1117] flex items-center justify-center p-4 relative overflow-hidden font-sans selection:bg-pink-500/30">
            <div className="absolute inset-0 overflow-hidden z-0 pointer-events-none">
                <motion.div animate={{ x: [0, 50, 0], y: [0, 30, 0], scale: [1, 1.1, 1] }} transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                    className="absolute -top-[10%] -left-[10%] w-[50%] h-[50%] bg-pink-500/10 rounded-full blur-[120px]"></motion.div>
                <motion.div animate={{ x: [0, -40, 0], y: [0, 60, 0] }} transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
                    className="absolute top-[20%] -right-[10%] w-[40%] h-[40%] bg-violet-600/10 rounded-full blur-[100px]"></motion.div>
                <motion.div animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }} transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
                    className="absolute -bottom-[10%] left-[20%] w-[45%] h-[45%] bg-blue-600/10 rounded-full blur-[130px]"></motion.div>
            </div>

            <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0, transition: { duration: 0.8, ease: "easeOut" } }}
                whileHover={{ y: -5 }} className="relative z-10 w-full max-w-md">
                <div className="absolute inset-0 bg-gradient-to-br from-pink-500/20 via-transparent to-violet-500/20 rounded-2xl blur-2xl -z-10"></div>

                <div className="bg-gradient-to-br from-[#1c2128] via-[#10141b] to-[#0d1117] backdrop-blur-2xl p-8 md:p-10 rounded-2xl border border-white/5 shadow-[0_20px_50px_rgba(0,0,0,0.5)] relative overflow-hidden group">
                    <motion.div animate={{ y: [0, -8, 0] }} transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}>
                        {forgotMode ? renderForgotPassword() : (
                            <>
                                <div className="text-center mb-8">
                                    <div className="flex justify-center mb-6">
                                        <motion.div whileHover={{ scale: 1.1, rotate: 5 }} className="p-4 bg-[#161b22] rounded-full border border-pink-500/20 shadow-[0_0_20px_rgba(236,72,153,0.15)] bg-gradient-to-b from-[#1c2128] to-[#10141b]">
                                            <GraduationCap className="text-pink-500" size={32} />
                                        </motion.div>
                                    </div>
                                    <h1 className="text-4xl font-extrabold tracking-tight text-white mb-2">
                                        <span className="bg-clip-text text-transparent bg-gradient-to-r from-pink-400 via-violet-400 to-pink-400 animate-gradient">
                                            {isLogin ? 'Student Lab Access' : 'New Scholar'}
                                        </span>
                                    </h1>
                                    <p className="text-gray-400 text-sm font-medium">
                                        {isLogin ? 'Authenticate to access the Lab Suite' : 'Register for a Student account'}
                                    </p>
                                </div>

                                <AnimatePresence mode="wait">
                                    {error && (
                                        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }}
                                            className="mb-6 p-4 bg-red-900/20 text-red-300 text-xs rounded-xl border border-red-800/30 backdrop-blur-sm flex items-center gap-3">
                                            <span className="shrink-0 w-6 h-6 rounded-full bg-red-900/40 flex items-center justify-center text-[10px]">⚠️</span>
                                            <span className="font-medium">{error}</span>
                                        </motion.div>
                                    )}
                                    {successMsg && (
                                        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }}
                                            className="mb-6 p-4 bg-green-900/20 text-green-300 text-xs rounded-xl border border-green-800/30 backdrop-blur-sm flex items-center gap-3">
                                            <div className="w-6 h-6 rounded-full bg-green-900/40 flex items-center justify-center"><CheckCircle size={14} /></div>
                                            <span className="font-medium">{successMsg}</span>
                                        </motion.div>
                                    )}
                                </AnimatePresence>

                                <form onSubmit={handleSubmit} className="space-y-5">
                                    {!isLogin && (
                                        <div>
                                            <label className="block text-pink-400 text-[10px] font-bold uppercase tracking-[0.2em] mb-2 px-1">Full Name</label>
                                            <input type="text" value={name} onChange={(e) => setName(e.target.value)}
                                                className="w-full bg-black/40 border border-white/10 rounded-xl p-3.5 text-white focus:border-pink-500/50 focus:bg-black/60 outline-none transition-all placeholder-gray-700 text-sm shadow-inner"
                                                placeholder="Jane Scholar" required={!isLogin} />
                                        </div>
                                    )}
                                    <div className="space-y-1">
                                        <label className="block text-pink-400 text-[10px] font-bold uppercase tracking-[0.2em] mb-2 px-1">Email Address</label>
                                        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                                            className="w-full bg-black/40 border border-white/10 rounded-xl p-3.5 text-white focus:border-pink-500/50 focus:bg-black/60 outline-none transition-all placeholder-gray-700 text-sm shadow-inner"
                                            placeholder="student@university.edu" required />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="block text-violet-400 text-[10px] font-bold uppercase tracking-[0.2em] mb-2 px-1">Password</label>
                                        <div className="relative group">
                                            <input type={showPassword ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)}
                                                className="w-full bg-black/40 border border-white/10 rounded-xl p-3.5 text-white focus:border-violet-500/50 focus:bg-black/60 outline-none transition-all placeholder-gray-700 text-sm pr-12 shadow-inner"
                                                placeholder="••••••••••••" required />
                                            <button type="button" onClick={() => setShowPassword(!showPassword)}
                                                className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-600 hover:text-white transition-colors">
                                                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                            </button>
                                        </div>
                                    </div>

                                    {/* Remember Me + Forgot Password */}
                                    {isLogin && (
                                        <div className="flex items-center justify-between px-1">
                                            <label className="flex items-center gap-2 cursor-pointer select-none group/remember">
                                                <input type="checkbox" checked={rememberMe} onChange={(e) => setRememberMe(e.target.checked)} className="sr-only" />
                                                <div className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-all ${rememberMe ? 'bg-pink-500 border-pink-500' : 'border-gray-600 group-hover/remember:border-gray-400'}`}>
                                                    {rememberMe && <CheckCircle size={10} className="text-white" />}
                                                </div>
                                                <span className="text-[10px] text-gray-500 uppercase tracking-wider font-medium group-hover/remember:text-gray-300 transition-colors">Remember me</span>
                                            </label>
                                            <button type="button" onClick={() => { setForgotMode('email'); setForgotEmail(email); setError(''); setSuccessMsg(''); }}
                                                className="text-[10px] text-pink-400 uppercase tracking-wider font-medium hover:text-pink-300 hover:underline transition-all">
                                                Forgot password?
                                            </button>
                                        </div>
                                    )}

                                    <button type="submit" disabled={loading || successMsg}
                                        className="w-full relative group overflow-hidden bg-gradient-to-r from-[#ec4899] via-[#8b5cf6] to-[#ec4899] bg-[length:200%_auto] animate-gradient text-white font-bold py-4 rounded-xl shadow-[0_10px_30px_rgba(236,72,153,0.3)] hover:shadow-[0_15px_40px_rgba(236,72,153,0.4)] transition-all transform active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed uppercase tracking-widest text-xs">
                                        <span className="relative z-10 flex items-center justify-center gap-2">
                                            {loading ? 'Processing...' : (successMsg ? 'Access Granted' : (isLogin ? 'Access Lab Suite' : 'Create Student Account'))}
                                        </span>
                                    </button>

                                    {/* Divider */}
                                    <div className="flex items-center gap-3 my-1">
                                        <div className="flex-1 h-px bg-white/10"></div>
                                        <span className="text-[10px] text-gray-600 uppercase tracking-[0.2em] font-bold">or</span>
                                        <div className="flex-1 h-px bg-white/10"></div>
                                    </div>

                                    {/* Google Sign In with hover effect */}
                                    <button
                                        type="button"
                                        onClick={handleGoogleLogin}
                                        className="w-full flex items-center justify-center gap-3 bg-white hover:bg-gray-50 text-gray-800 font-medium py-3.5 px-4 rounded-xl transition-all duration-300 shadow-sm border border-gray-300 active:scale-95 hover:shadow-[0_8px_25px_rgba(66,133,244,0.25)] hover:border-[#4285F4]/40 hover:scale-[1.02] group/google"
                                    >
                                        <span className="transition-transform duration-300 group-hover/google:scale-110">
                                            <GoogleIcon />
                                        </span>
                                        <span className="text-sm font-semibold">{isLogin ? 'Sign in with Google' : 'Sign up with Google'}</span>
                                    </button>

                                    <div className="text-center pt-2">
                                        <span className="text-gray-500 text-[10px] font-medium uppercase tracking-wider">{isLogin ? "Need an account? " : "Already have credentials? "}</span>
                                        <button type="button" onClick={() => { setIsLogin(!isLogin); setError(''); setSuccessMsg(''); }}
                                            className="text-white font-bold hover:text-pink-400 transition-colors text-[10px] uppercase tracking-widest border-b border-white/20 hover:border-pink-500/50 pb-0.5 ml-1">
                                            {isLogin ? 'Register Access' : 'Sign In'}
                                        </button>
                                    </div>
                                    <button type="button" className="w-full mt-4 text-[10px] text-gray-600 hover:text-gray-400 transition-colors uppercase tracking-[0.2em] flex items-center justify-center gap-2 font-bold"
                                        onClick={() => navigate('/dashboard')}>
                                        <span className="opacity-50">←</span> Return to Dashboard
                                    </button>
                                </form>
                            </>
                        )}
                    </motion.div>
                    <div className="absolute top-0 left-0 w-12 h-12 border-t-2 border-l-2 border-pink-500/40 rounded-tl-2xl -mt-1 -ml-1 pointer-events-none"></div>
                    <div className="absolute bottom-0 right-0 w-12 h-12 border-b-2 border-r-2 border-violet-500/40 rounded-br-2xl -mb-1 -mr-1 pointer-events-none"></div>
                </div>
            </motion.div>
        </div>
    );
};

export default StudentAccess;
