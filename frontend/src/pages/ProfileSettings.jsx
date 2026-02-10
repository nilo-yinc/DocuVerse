import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { User, Mail, Phone, Lock, LogOut, X, Camera, Save, Loader, FileJson, GitBranch, Terminal, Linkedin, Github, Twitter, Globe, ShieldCheck, MailQuestion } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const ProfileSettings = ({ onClose }) => {
    const { user, updateProfile, logout, requestPasswordOTP, verifyPasswordOTP } = useAuth();
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        name: user?.name || '',
        phoneCountryCode: user?.phoneCountryCode || '+1',
        phoneNumber: user?.phoneNumber || '',
        profilePic: user?.profilePic || '',
        socialLinks: user?.socialLinks || { linkedin: '', github: '', twitter: '', website: '' },
        newPassword: ''
    });

    const [otpFlow, setOtpFlow] = useState({
        requested: false,
        code: '',
        loading: false,
        verified: false,
        cooldown: 0
    });
    const [verifying, setVerifying] = useState(false);

    const [loading, setLoading] = useState(false);
    const [msg, setMsg] = useState({ type: '', text: '' });
    const fileInputRef = useRef(null);

    useEffect(() => {
        if (user) {
            setFormData(prev => ({
                ...prev,
                name: user.name || '',
                phoneCountryCode: user.phoneCountryCode || '+1',
                phoneNumber: user.phoneNumber || '',
                profilePic: user.profilePic || '',
                socialLinks: user.socialLinks || { linkedin: '', github: '', twitter: '', website: '' }
            }));
        }
    }, [user]);

    useEffect(() => {
        if (otpFlow.cooldown <= 0) return;
        const timer = setInterval(() => {
            setOtpFlow(prev => ({ ...prev, cooldown: Math.max(prev.cooldown - 1, 0) }));
        }, 1000);
        return () => clearInterval(timer);
    }, [otpFlow.cooldown]);

    useEffect(() => {
        const ready = otpFlow.requested && otpFlow.code.length === 6 && formData.newPassword.length >= 6;
        if (!ready || verifying) return;
        const timer = setTimeout(() => {
            handleVerifyAndCommit(true);
        }, 300);
        return () => clearTimeout(timer);
    }, [otpFlow.requested, otpFlow.code, formData.newPassword, verifying]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        if (name.startsWith('social_')) {
            const platform = name.split('_')[1];
            setFormData(prev => ({
                ...prev,
                socialLinks: { ...prev.socialLinks, [platform]: value }
            }));
        } else {
            setFormData({ ...formData, [name]: value });
        }
    };

    const handleFileUpload = (e) => {
        const file = e.target.files[0];
        if (file) {
            if (file.size > 1024 * 1024) {
                setMsg({ type: 'error', text: 'Profile photo must be 1 MB or меньше.' });
                return;
            }
            const reader = new FileReader();
            reader.onloadend = () => {
                const dataUrl = reader.result;
                if (!dataUrl) return;
                const img = new Image();
                img.onload = () => {
                    const maxSize = 400;
                    const scale = Math.min(maxSize / img.width, maxSize / img.height, 1);
                    const canvas = document.createElement('canvas');
                    canvas.width = Math.round(img.width * scale);
                    canvas.height = Math.round(img.height * scale);
                    const ctx = canvas.getContext('2d');
                    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
                    const compressed = canvas.toDataURL('image/jpeg', 0.7);
                    if (compressed.length > 600000) {
                        setMsg({ type: 'error', text: 'Image still too large after compression. Please use a smaller photo.' });
                        return;
                    }
                    setFormData(prev => ({ ...prev, profilePic: compressed }));
                };
                img.onerror = () => {
                    setMsg({ type: 'error', text: 'Invalid image file.' });
                };
                img.src = dataUrl;
            };
            reader.readAsDataURL(file);
        }
    };

    const handleRequestOTP = async () => {
        setOtpFlow(prev => ({ ...prev, loading: true }));
        const res = await requestPasswordOTP();
        if (res.success) {
            setOtpFlow(prev => ({ ...prev, requested: true, loading: false, cooldown: 60 }));
            setMsg({ type: 'success', text: res.msg });
        } else {
            setOtpFlow(prev => ({ ...prev, loading: false }));
            setMsg({ type: 'error', text: res.msg });
        }
    };

    const handleVerifyAndCommit = async (silent = false) => {
        if (!otpFlow.code || !formData.newPassword) {
            if (!silent) {
                setMsg({ type: 'error', text: "Verification code and new password required" });
            }
            return;
        }
        setVerifying(true);
        setOtpFlow(prev => ({ ...prev, loading: true }));
        const res = await verifyPasswordOTP(otpFlow.code, formData.newPassword);
        if (res.success) {
            setOtpFlow({ ...otpFlow, requested: false, loading: false, verified: true, code: '', cooldown: 0 });
            setFormData(prev => ({ ...prev, newPassword: '' }));
            setMsg({ type: 'success', text: res.msg });
        } else {
            setOtpFlow(prev => ({ ...prev, loading: false }));
            setMsg({ type: 'error', text: res.msg });
        }
        setVerifying(false);
    };

    const handleSubmit = async (e) => {
        if (e) e.preventDefault();
        setLoading(true);
        setMsg({ type: '', text: '' });

        const data = {
            name: formData.name,
            phoneCountryCode: formData.phoneCountryCode,
            phoneNumber: formData.phoneNumber,
            socialLinks: formData.socialLinks,
            profilePic: formData.profilePic,
        };

        const res = await updateProfile(data);
        setLoading(false);
        if (res.success) {
            setMsg({ type: 'success', text: 'Changes committed successfully!' });
            setTimeout(() => setMsg({ type: '', text: '' }), 3000);
        } else {
            setMsg({ type: 'error', text: res.msg });
        }
    };

    const getSocialIcon = (platform) => {
        switch (platform) {
            case 'linkedin': return <Linkedin size={14} />;
            case 'github': return <Github size={14} />;
            case 'twitter': return <Twitter size={14} />;
            default: return <Globe size={14} />;
        }
    };

    const countryCodes = ['+1', '+44', '+91', '+81', '+33', '+49'];
    const visibleEmail = user?.email || "your email";

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 font-mono">
            <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                className="bg-[#0f0f12] border border-white/10 rounded-xl w-full max-w-2xl shadow-[0_0_50px_-12px_rgba(0,0,0,0.5)] overflow-hidden flex flex-col h-[85vh]"
            >
                {/* IDE Header */}
                <div className="bg-[#1a1a1e] h-10 flex items-center justify-between px-4 border-b border-black/40">
                    <div className="flex items-center gap-0.5 h-full">
                        <div className="h-full px-4 bg-[#0f0f12] border-t-2 border-cyan-500 flex items-center gap-2 text-xs text-white">
                            <FileJson size={14} className="text-yellow-400" />
                            <span>user_profile.config</span>
                            <X size={12} className="ml-2 opacity-40 hover:opacity-100 cursor-pointer" onClick={onClose} />
                        </div>
                    </div>
                </div>

                <div className="flex-1 flex overflow-hidden">
                    {/* Gutter */}
                    <div className="w-12 bg-[#0f0f12] border-r border-white/5 flex flex-col items-center py-6 text-slate-600 text-xs leading-[2.6rem] select-none overflow-y-hidden">
                        {Array.from({ length: 24 }).map((_, i) => (
                            <div key={i}>{i + 1}</div>
                        ))}
                    </div>

                    {/* Editor Content */}
                    <div className="flex-1 p-6 relative overflow-y-auto custom-scrollbar">
                        {/* Avatar */}
                        <div className="absolute top-6 right-8 z-20 group">
                            <div className="relative w-28 h-28">
                                <motion.div
                                    animate={{ rotate: 360 }}
                                    transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
                                    className="absolute inset-0 border-2 border-dashed border-cyan-500/30 rounded-full"
                                />
                                <div className="absolute inset-2 rounded-full border-2 border-cyan-400 overflow-hidden bg-slate-800 flex items-center justify-center p-0.5 shadow-[0_0_20px_rgba(34,211,238,0.2)]">
                                    {formData.profilePic ? (
                                        <img src={formData.profilePic} alt="Profile" className="w-full h-full object-cover" />
                                    ) : (
                                        <User size={48} className="text-slate-500" />
                                    )}
                                </div>
                                <div
                                    onClick={() => fileInputRef.current.click()}
                                    className="absolute -bottom-1 -right-1 bg-cyan-600 p-2 rounded-lg cursor-pointer hover:bg-cyan-500 transition-colors shadow-lg shadow-cyan-900/40"
                                >
                                    <Camera size={14} className="text-white" />
                                </div>
                                <input type="file" ref={fileInputRef} hidden accept="image/*" onChange={handleFileUpload} />
                            </div>
                        </div>

                        <div className="space-y-4 max-w-lg">
                            <div className="text-blue-400 text-sm opacity-60 mb-8 font-light italic">
                                // Enhanced configuration schema v2.2.0-stable
                            </div>

                            <form className="space-y-6">
                                {/* Name */}
                                <div className="flex items-center group relative h-10">
                                    <label className="text-purple-400 w-36 shrink-0">"full_name":</label>
                                    <span className="text-slate-500 mr-2">"</span>
                                    <input
                                        type="text"
                                        name="name"
                                        value={formData.name}
                                        onChange={handleChange}
                                        className="bg-transparent border-none outline-none text-green-400 w-full focus:ring-0 p-0"
                                    />
                                    <span className="text-slate-500">",</span>
                                    <div className="absolute left-0 -bottom-1 w-full h-px bg-white/5 group-focus-within:bg-cyan-500/50 transition-colors" />
                                </div>

                                {/* Contact & Country Code */}
                                <div className="flex items-center group relative h-10">
                                    <label className="text-purple-400 w-36 shrink-0">"contact_no":</label>
                                    <span className="text-slate-500 mr-2">"</span>
                                    <select
                                        name="phoneCountryCode"
                                        value={formData.phoneCountryCode}
                                        onChange={handleChange}
                                        className="bg-transparent border-none outline-none text-orange-400 text-xs mr-2 cursor-pointer focus:ring-0"
                                    >
                                        {countryCodes.map(code => <option key={code} value={code} className="bg-[#0f0f12] text-white">{code}</option>)}
                                    </select>
                                    <input
                                        type="tel"
                                        name="phoneNumber"
                                        value={formData.phoneNumber}
                                        onChange={handleChange}
                                        className="bg-transparent border-none outline-none text-green-400 w-full focus:ring-0 p-0"
                                        placeholder="123456789"
                                    />
                                    <span className="text-slate-500">",</span>
                                    <div className="absolute left-0 -bottom-1 w-full h-px bg-white/5 group-focus-within:bg-cyan-500/50 transition-colors" />
                                </div>

                                {/* Social Links */}
                                {Object.keys(formData.socialLinks).map((platform) => (
                                    <div key={platform} className="flex items-center group relative h-10">
                                        <div className="w-36 shrink-0 flex items-center gap-2">
                                            <span className="text-slate-500 opacity-40">{getSocialIcon(platform)}</span>
                                            <label className="text-blue-400">"{platform}":</label>
                                        </div>
                                        <span className="text-slate-500 mr-2">"</span>
                                        <input
                                            type="text"
                                            name={`social_${platform}`}
                                            value={formData.socialLinks[platform]}
                                            onChange={handleChange}
                                            className="bg-transparent border-none outline-none text-green-400 w-full focus:ring-0 p-0 selection:bg-cyan-500/30 text-xs"
                                            placeholder={`https://${platform}.com/...`}
                                        />
                                        <span className="text-slate-500">",</span>
                                        <div className="absolute left-0 -bottom-1 w-full h-px bg-white/5 group-focus-within:bg-cyan-500/50 transition-colors" />
                                    </div>
                                ))}

                                {/* Auth Security (Password) */}
                                <div className="pt-8 border-t border-white/5">
                                    <div className="flex items-center gap-2 mb-2 text-pink-500 text-xs uppercase tracking-widest font-bold">
                                        <ShieldCheck size={14} />
                                        <span>Security & Authenticity</span>
                                    </div>
                                    <div className="text-[11px] text-slate-500 mb-4">
                                        Password changes require a verification code sent to <span className="text-cyan-400">{visibleEmail}</span>.
                                    </div>

                                    <div className="bg-[#0f1116] border border-white/10 rounded-xl p-4 space-y-4">
                                        <div className="flex items-center justify-between">
                                            <div className="text-xs text-slate-400">
                                                Step 1: Send code to your email
                                            </div>
                                            <button
                                                type="button"
                                                onClick={handleRequestOTP}
                                                disabled={otpFlow.loading || otpFlow.cooldown > 0}
                                                className="flex items-center gap-2 text-xs border border-white/10 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 disabled:opacity-50"
                                            >
                                                <MailQuestion size={14} />
                                                {otpFlow.loading
                                                    ? "Sending..."
                                                    : otpFlow.cooldown > 0
                                                        ? `Resend in ${otpFlow.cooldown}s`
                                                        : "Send Code"}
                                            </button>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div className="flex items-center group relative h-10">
                                                <label className="text-pink-400 w-28 shrink-0">"code":</label>
                                                <span className="text-slate-500 mr-2">"</span>
                                                <input
                                                    type="text"
                                                    value={otpFlow.code}
                                                    onChange={(e) => setOtpFlow({ ...otpFlow, code: e.target.value })}
                                                    className="bg-transparent border-none outline-none text-pink-500 w-full focus:ring-0 p-0 tracking-[0.4em] font-bold"
                                                    placeholder="000000"
                                                    maxLength={6}
                                                    disabled={!otpFlow.requested}
                                                />
                                                <span className="text-slate-500">",</span>
                                                <div className="absolute left-0 -bottom-1 w-full h-px bg-pink-500/40" />
                                            </div>
                                            <div className="flex items-center group relative h-10">
                                                <label className="text-purple-400 w-28 shrink-0">"new_password":</label>
                                                <span className="text-slate-500 mr-2">"</span>
                                                <input
                                                    type="password"
                                                    name="newPassword"
                                                    value={formData.newPassword}
                                                    onChange={handleChange}
                                                    className="bg-transparent border-none outline-none text-green-400 w-full focus:ring-0 p-0"
                                                    placeholder="••••••••"
                                                    disabled={!otpFlow.requested}
                                                />
                                                <span className="text-slate-500">",</span>
                                                <div className="absolute left-0 -bottom-1 w-full h-px bg-purple-500/40" />
                                            </div>
                                        </div>

                                        <div className="flex items-center justify-between">
                                            <div className="text-[11px] text-slate-500">
                                                Step 2: Verify code. Step 3: Update password.
                                            </div>
                                            <button
                                                type="button"
                                                onClick={handleVerifyAndCommit}
                                                disabled={!otpFlow.requested || otpFlow.code.length !== 6 || formData.newPassword.length < 6 || verifying}
                                                className="bg-pink-600 text-white text-xs px-4 py-2 rounded-lg hover:bg-pink-500 transition-all font-bold disabled:opacity-50"
                                            >
                                                Verify & Update Password
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </form>

                            {/* Status Message */}
                            <AnimatePresence>
                                {msg.text && (
                                    <motion.div
                                        initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }}
                                        className={`text-xs mt-8 px-3 py-1.5 rounded inline-flex items-center gap-2 ${msg.type === 'success' ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'}`}
                                    >
                                        <div className={`w-1.5 h-1.5 rounded-full animate-pulse ${msg.type === 'success' ? 'bg-green-400' : 'bg-red-400'}`} />
                                        {msg.text}
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    </div>
                </div>

                {/* Footer bar */}
                <div className="h-14 bg-[#1a1a1e] border-t border-black/40 flex items-center justify-between px-6">
                    <button
                        onClick={() => {
                            logout();
                            onClose?.();
                            navigate('/dashboard');
                        }}
                        className="flex items-center gap-2 text-slate-500 hover:text-red-400 transition-colors text-xs group"
                    >
                        <LogOut size={14} className="group-hover:-translate-x-1 transition-transform" />
                        <span>Disconnect Session</span>
                    </button>

                    <div className="flex items-center gap-4">
                        <button
                            onClick={handleSubmit}
                            disabled={loading || otpFlow.requested}
                            className="bg-green-600 hover:bg-green-500 disabled:opacity-50 text-white px-4 py-1.5 rounded text-xs flex items-center gap-2 shadow-lg shadow-green-900/20 transition-all font-bold active:scale-95"
                        >
                            {loading ? <Loader className="animate-spin" size={14} /> : <GitBranch size={14} className="rotate-90" />}
                            <span>Commit Changes</span>
                            <span className="text-[10px] opacity-60 font-normal ml-1">Ctrl+S</span>
                        </button>
                    </div>
                </div>
            </motion.div>
        </div>
    );
};

export default ProfileSettings;
