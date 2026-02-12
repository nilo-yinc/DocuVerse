import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../api/client';
import { Eye, EyeOff, CheckCircle, GraduationCap } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import useTitle from '../hooks/useTitle';

const StudentAccess = () => {
    const navigate = useNavigate();
    const { login: contextLogin, token } = useAuth();
    const [isLogin, setIsLogin] = useState(true);
    useTitle(isLogin ? 'Student Access' : 'Student Registration');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [name, setName] = useState('');
    const [showPassword, setShowPassword] = useState(false);

    // UI States
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [successMsg, setSuccessMsg] = useState('');

    useEffect(() => {
        if (token) {
            navigate('/student/coming-soon');
        }
    }, [token, navigate]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccessMsg('');
        setLoading(true);

        try {
            if (isLogin) {
                // Login Flow using shared auth context
                const res = await contextLogin(email, password);
                if (res.success) {
                    setSuccessMsg("Lab Access Granted");
                    setTimeout(() => {
                        navigate('/student/coming-soon');
                    }, 1500);
                } else {
                    setError(res.msg || 'Login failed');
                }
            } else {
                // Registration Flow
                const res = await api.post('/users/register', { name, email, password });
                if (res.status === 201 || res.data) {
                    setSuccessMsg("Registration Successful! Please sign in.");
                    setTimeout(() => {
                        setIsLogin(true);
                        setSuccessMsg('');
                        setPassword(''); // Clear password for security
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

    return (
        <div className="min-h-screen bg-[#0d1117] flex items-center justify-center p-4 relative overflow-hidden font-sans selection:bg-pink-500/30">
            {/* Multi-layered Animated Background Blobs */}
            <div className="absolute inset-0 overflow-hidden z-0 pointer-events-none">
                <motion.div
                    animate={{ x: [0, 50, 0], y: [0, 30, 0], scale: [1, 1.1, 1] }}
                    transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                    className="absolute -top-[10%] -left-[10%] w-[50%] h-[50%] bg-pink-500/10 rounded-full blur-[120px]"
                ></motion.div>
                <motion.div
                    animate={{ x: [0, -40, 0], y: [0, 60, 0] }}
                    transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
                    className="absolute top-[20%] -right-[10%] w-[40%] h-[40%] bg-violet-600/10 rounded-full blur-[100px]"
                ></motion.div>
                <motion.div
                    animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }}
                    transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
                    className="absolute -bottom-[10%] left-[20%] w-[45%] h-[45%] bg-blue-600/10 rounded-full blur-[130px]"
                ></motion.div>
            </div>

            {/* Hanging / Floating Card Implementation */}
            <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0, transition: { duration: 0.8, ease: "easeOut" } }}
                whileHover={{ y: -5 }}
                className="relative z-10 w-full max-w-md"
            >
                {/* Outer Glow Wrapper */}
                <div className="absolute inset-0 bg-gradient-to-br from-pink-500/20 via-transparent to-violet-500/20 rounded-2xl blur-2xl -z-10 group-hover:opacity-100 transition-opacity"></div>

                <div className="bg-gradient-to-br from-[#1c2128] via-[#10141b] to-[#0d1117] backdrop-blur-2xl p-8 md:p-10 rounded-2xl border border-white/5 shadow-[0_20px_50px_rgba(0,0,0,0.5)] relative overflow-hidden group">
                    <motion.div animate={{ y: [0, -8, 0] }} transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}>
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
                                <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }} className="mb-6 p-4 bg-red-900/20 text-red-300 text-xs rounded-xl border border-red-800/30 backdrop-blur-sm flex items-center gap-3">
                                    <span className="shrink-0 w-6 h-6 rounded-full bg-red-900/40 flex items-center justify-center text-[10px]">⚠️</span>
                                    <span className="font-medium">{error}</span>
                                </motion.div>
                            )}
                            {successMsg && (
                                <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }} className="mb-6 p-4 bg-green-900/20 text-green-300 text-xs rounded-xl border border-green-800/30 backdrop-blur-sm flex items-center gap-3">
                                    <div className="w-6 h-6 rounded-full bg-green-900/40 flex items-center justify-center"><CheckCircle size={14} /></div>
                                    <span className="font-medium">{successMsg}</span>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        <form onSubmit={handleSubmit} className="space-y-5">
                            {!isLogin && (
                                <div>
                                    <label className="block text-pink-400 text-[10px] font-bold uppercase tracking-[0.2em] mb-2 px-1">Full Name</label>
                                    <input
                                        type="text"
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        className="w-full bg-black/40 border border-white/10 rounded-xl p-3.5 text-white focus:border-pink-500/50 focus:bg-black/60 outline-none transition-all placeholder-gray-700 text-sm shadow-inner"
                                        placeholder="Jane Scholar"
                                        required={!isLogin}
                                    />
                                </div>
                            )}
                            <div className="space-y-1">
                                <label className="block text-pink-400 text-[10px] font-bold uppercase tracking-[0.2em] mb-2 px-1">Email Address</label>
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full bg-black/40 border border-white/10 rounded-xl p-3.5 text-white focus:border-pink-500/50 focus:bg-black/60 outline-none transition-all placeholder-gray-700 text-sm shadow-inner"
                                    placeholder="student@university.edu"
                                    required
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="block text-violet-400 text-[10px] font-bold uppercase tracking-[0.2em] mb-2 px-1">Password</label>
                                <div className="relative group">
                                    <input
                                        type={showPassword ? "text" : "password"}
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className="w-full bg-black/40 border border-white/10 rounded-xl p-3.5 text-white focus:border-violet-500/50 focus:bg-black/60 outline-none transition-all placeholder-gray-700 text-sm pr-12 shadow-inner"
                                        placeholder="••••••••••••"
                                        required
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-600 hover:text-white transition-colors"
                                    >
                                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                    </button>
                                </div>
                            </div>
                            <button
                                type="submit"
                                disabled={loading || successMsg}
                                className="w-full relative group overflow-hidden bg-gradient-to-r from-[#ec4899] via-[#8b5cf6] to-[#ec4899] bg-[length:200%_auto] animate-gradient text-white font-bold py-4 rounded-xl shadow-[0_10px_30px_rgba(236,72,153,0.3)] hover:shadow-[0_15px_40px_rgba(236,72,153,0.4)] transition-all transform active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed uppercase tracking-widest text-xs"
                            >
                                <span className="relative z-10 flex items-center justify-center gap-2">
                                    {loading ? 'Processing...' : (successMsg ? 'Access Granted' : (isLogin ? 'Access Lab Suite' : 'Create Student Account'))}
                                </span>
                            </button>
                            <div className="text-center pt-2">
                                <span className="text-gray-500 text-[10px] font-medium uppercase tracking-wider">{isLogin ? "Need an account? " : "Already have credentials? "}</span>
                                <button
                                    type="button"
                                    onClick={() => { setIsLogin(!isLogin); setError(''); setSuccessMsg(''); }}
                                    className="text-white font-bold hover:text-pink-400 transition-colors text-[10px] uppercase tracking-widest border-b border-white/20 hover:border-pink-500/50 pb-0.5 ml-1"
                                >
                                    {isLogin ? 'Register Access' : 'Sign In'}
                                </button>
                            </div>
                            <button
                                type="button"
                                className="w-full mt-4 text-[10px] text-gray-600 hover:text-gray-400 transition-colors uppercase tracking-[0.2em] flex items-center justify-center gap-2 font-bold"
                                onClick={() => navigate('/dashboard')}
                            >
                                <span className="opacity-50">←</span> Return to Dashboard
                            </button>
                        </form>
                    </motion.div>
                    <div className="absolute top-0 left-0 w-12 h-12 border-t-2 border-l-2 border-pink-500/40 rounded-tl-2xl -mt-1 -ml-1 pointer-events-none"></div>
                    <div className="absolute bottom-0 right-0 w-12 h-12 border-b-2 border-r-2 border-violet-500/40 rounded-br-2xl -mb-1 -mr-1 pointer-events-none"></div>
                </div>
            </motion.div>
        </div>
    );
};

export default StudentAccess;
