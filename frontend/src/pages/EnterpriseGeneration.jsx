import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Download, AlertCircle, FileText, CheckCircle, User, Sparkles, RefreshCw, LayoutDashboard, Code, ArrowRight
} from 'lucide-react';
import Logo from '../components/ui/Logo';
import { useAuth } from '../context/AuthContext';

// --- Utility: Project Key Generation ---
const getProjectKey = (name) => {
    if (!name) return "Project";
    let safe = name.replace(/[^a-zA-Z0-9-_]/g, "_");
    safe = safe.replace(/^_+|_+$/g, "");
    return safe || "Project";
};

const EnterpriseGeneration = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const { user, token } = useAuth();
    const resolvedToken = token || sessionStorage.getItem('token') || localStorage.getItem('token');
    const formData = location.state?.formData;
    const isUpdateFlow = Boolean(location.state?.update || location.state?.projectId || formData?.projectId);
    const existingProjectId = isUpdateFlow
        ? (location.state?.projectId || formData?.projectId || localStorage.getItem('autoSRS_activeProjectId') || null)
        : null;
    const forceHQ = location.state?.forceHQ || false;

    // Primary Generation State (Quick Pass)
    const [status, setStatus] = useState('initializing');
    const [progress, setProgress] = useState(0);
    const [message, setMessage] = useState("Initializing Generator...");
    const [result, setResult] = useState(null);
    const [error, setError] = useState(null);
    const [timer, setTimer] = useState(0);
    const [studioProjectId, setStudioProjectId] = useState(null);

    // HQ Generation State (Second Pass)
    const [hqStatus, setHqStatus] = useState('idle'); // 'idle', 'processing', 'complete', 'error'
    const [hqProgress, setHqProgress] = useState(0);
    const [hqMessage, setHqMessage] = useState("");
    const [hqResult, setHqResult] = useState(null);

    const timerRef = useRef(null);
    const hasStartedRef = useRef(false);

    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    const startGeneration = async (mode = 'quick') => {
        if (!formData) return;
        if (!resolvedToken) {
            setError("Authentication required. Please login again.");
            setStatus('error');
            setMessage("Authentication required");
            navigate('/enterprise/access');
            return;
        }

        try {
            if (mode === 'quick') {
                setStatus('processing');
                setProgress(0);
                if (!timerRef.current) {
                    timerRef.current = setInterval(() => setTimer(t => t + 1), 1000);
                }
            } else {
                setHqStatus('processing');
                setHqProgress(0);
                setHqMessage("Starting High Quality analysis...");
                if (!timerRef.current) {
                    timerRef.current = setInterval(() => setTimer(t => t + 1), 1000);
                }
            }

            const nodeApiBase = import.meta.env.VITE_NODE_API_URL
                || (typeof window !== 'undefined' ? `http://${window.location.hostname || 'localhost'}:5000` : 'http://localhost:5000');
            const genUrl = `${nodeApiBase}/api/projects/enterprise/generate`;

            // Call Node.js Backend for Persistence & Generation
            const sanitizedFormData = { ...formData };
            if (!isUpdateFlow) {
                delete sanitizedFormData.projectId;
            }

            const response = await fetch(genUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${resolvedToken}`
                },
                body: JSON.stringify({
                    projectId: isUpdateFlow ? (existingProjectId || undefined) : undefined,
                    mode: mode === 'quick' ? 'quick' : 'full',
                    formData: {
                        ...sanitizedFormData,
                        projectId: isUpdateFlow ? (existingProjectId || undefined) : undefined
                    }
                })
            });

                const rawText = await response.text();
                let data = null;
                try {
                    data = rawText ? JSON.parse(rawText) : null;
                } catch {
                    data = null;
                }
                if (!response.ok) {
                    const errMessage = data?.msg || data?.detail || rawText || "Generation backend failed";
                    throw new Error(errMessage);
                }

            if (mode === 'quick') {
                setStudioProjectId(data.projectId);
                setResult({ download_url: data.srs_document_path });
                setStatus('complete');
                setProgress(100);
                setMessage("Quick SRS Ready!");
                if (data.projectId) {
                    localStorage.setItem('autoSRS_activeProjectId', data.projectId);
                }
            } else {
                setHqResult({ download_url: data.srs_document_path });
                setHqStatus('complete');
                setHqProgress(100);
                setHqMessage("High Quality SRS Complete!");
                setStudioProjectId(data.projectId);
                if (data.projectId) {
                    localStorage.setItem('autoSRS_activeProjectId', data.projectId);
                    // Automatically navigate to studio after short delay
                    setTimeout(() => navigate(`/studio/${data.projectId}`), 1500);
                }
            }

        } catch (err) {
            console.error("Generation Error:", err);
            if (mode === 'quick') {
                setError(err.message);
                setStatus('error');
            } else {
                setHqStatus('error');
                setHqMessage(err.message);
            }
            clearInterval(timerRef.current);
            timerRef.current = null;
        }
    };

    // Auto-start on mount (only once)
    useEffect(() => {
        if (!formData) return;
        if (!hasStartedRef.current) {
            hasStartedRef.current = true;
            startGeneration(forceHQ ? 'full' : 'quick');
        }

        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
            timerRef.current = null;
        };
    }, []);

    const handleDownload = (url) => {
        if (url) window.location.href = url;
    };

    // --- Circular Physics ---
    const radius = 60;
    const circumference = 2 * Math.PI * radius;
    const strokeDashoffset = circumference - (progress / 100) * circumference;

    return (
        <div className="min-h-screen bg-[#050505] text-white font-sans flex flex-col items-center justify-center relative overflow-hidden p-8">

            {/* Background */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
                <div className="absolute top-[-20%] left-[-10%] w-[800px] h-[800px] bg-violet-900/10 rounded-full blur-[120px] animate-pulse-slow" />
                <div className="absolute bottom-[-20%] right-[-10%] w-[800px] h-[800px] bg-cyan-900/10 rounded-full blur-[120px]" />
                <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-10 mix-blend-overlay"></div>
            </div>

            {/* Header */}
            <div className="absolute top-0 left-0 w-full p-6 px-8 flex justify-between items-center z-50 border-b border-white/5 bg-black/40 backdrop-blur-sm">
                <Logo size="md" subText="GENERATOR_CORE" />
                <div className="flex items-center gap-4">
                    <div className="text-right hidden md:block">
                        <div className="text-white font-bold text-sm tracking-wide">{user?.name || "User"}</div>
                        <div className="text-slate-500 text-[10px] font-mono tracking-wider uppercase">ENTERPRISE SRS</div>
                    </div>
                    <div className="w-10 h-10 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-400">
                        <User size={20} />
                    </div>
                </div>
            </div>

            <div className="relative z-10 w-full max-w-2xl mt-20">
                <div className="bg-black/40 backdrop-blur-xl border border-white/5 rounded-3xl p-12 shadow-2xl flex flex-col items-center">

                    {/* Main Circular Loader */}
                    <div className="relative w-48 h-48 flex items-center justify-center mb-12">
                        <svg className="w-full h-full transform -rotate-90">
                            <circle cx="50%" cy="50%" r={radius} stroke="rgba(255,255,255,0.05)" strokeWidth="4" fill="transparent" />
                            <motion.circle
                                cx="50%" cy="50%" r={radius}
                                stroke={progress === 100 ? "#06b6d4" : "url(#tricolor)"}
                                strokeWidth="4" fill="transparent"
                                strokeDasharray={circumference}
                                strokeDashoffset={strokeDashoffset}
                                strokeLinecap="round"
                                animate={{ strokeDashoffset, stroke: progress === 100 ? "#06b6d4" : "url(#tricolor)" }}
                                transition={{ duration: 0.5 }}
                            />
                            <defs>
                                <linearGradient id="tricolor" x1="0%" y1="0%" x2="100%" y2="100%">
                                    <stop offset="0%" stopColor="#a855f7" />
                                    <stop offset="50%" stopColor="#6366f1" />
                                    <stop offset="100%" stopColor="#06b6d4" />
                                </linearGradient>
                            </defs>
                        </svg>
                        <div className="absolute inset-0 flex items-center justify-center flex-col z-10">
                            <span className={`text-3xl font-bold font-mono tracking-widest transition-colors duration-500 ${progress === 100 ? 'text-cyan-400' : 'text-white'}`}>
                                {Math.round(progress)}%
                            </span>
                        </div>
                    </div>

                    <h2 className="text-xl md:text-2xl font-bold mb-2 text-center tracking-wide text-cyan-400"
                        style={{ textShadow: "0 0 10px rgba(6,182,212,0.5)" }}>
                        {status === 'complete' ? (hqStatus === 'processing' ? "Enhancing Document Quality..." : "Generation Completed Successfully.") :
                            status === 'error' ? "Generation Failed." : message}
                    </h2>

                    {status === 'error' && error && (
                        <div className="mb-6 px-4 py-2 bg-red-900/20 border border-red-500/30 rounded-lg text-red-400 text-sm font-mono max-w-md text-center">
                            {error}
                        </div>
                    )}

                    <div className="flex flex-col items-center gap-2 text-sm font-mono tracking-wider mb-8">
                        <div className="text-slate-400">Target: <span className="text-slate-200">less than 1 minute</span></div>
                        <div className="font-bold animate-pulse tracking-widest text-base text-cyan-400">Watch: {formatTime(timer)}</div>
                    </div>

                    {/* Linear Progress Bar */}
                    <div className="w-full max-w-xl h-1.5 bg-slate-800/30 rounded-full overflow-visible relative mt-4">
                        <motion.div
                            className="h-full rounded-full relative"
                            animate={{ width: `${progress}%` }}
                            style={{
                                background: progress === 100 ? 'linear-gradient(90deg, #06b6d4 0%, #a855f7 100%)' : 'linear-gradient(90deg, #06b6d4 0%, #3b82f6 50%, #d946ef 100%)',
                                boxShadow: progress === 100 ? '0 0 20px rgba(6,182,212,0.8)' : '0 0 15px rgba(217,70,239,0.5)'
                            }}
                            transition={{ duration: 0.3 }}
                        >
                            {progress < 100 && <div className="absolute top-1/2 right-0 transform translate-x-1/2 -translate-y-1/2 w-4 h-4 bg-white rounded-full blur-[4px] shadow-[0_0_15px_rgba(255,255,255,0.8)] opacity-80" />}
                        </motion.div>
                    </div>

                    {/* Actions Menu */}
                    {status === 'complete' && (
                        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mt-10 flex flex-col gap-4 w-full max-w-md">

                            {/* Static Download for Quick Version */}
                            <button
                                onClick={() => handleDownload(result?.download_url)}
                                className="w-full py-4 bg-gradient-to-r from-cyan-600 to-violet-600 text-white font-bold rounded-xl flex items-center justify-center gap-3 transition-all shadow-lg hover:scale-[1.02] shadow-cyan-500/20 group"
                            >
                                <Download size={20} className="group-hover:animate-bounce" />
                                Download Final
                            </button>

                            {/* HQ Toggle / Download */}
                            {hqStatus === 'idle' && (
                                <button
                                    onClick={() => startGeneration('full')}
                                    className="py-3 px-4 bg-violet-600/20 border border-violet-500/30 hover:bg-violet-600/30 text-violet-300 hover:text-white rounded-xl flex items-center justify-center gap-2 transition-all font-medium"
                                >
                                    <Sparkles size={16} /> Generate High Quality
                                </button>
                            )}

                            {hqStatus === 'processing' && (
                                <div className="py-3 px-4 bg-violet-600/10 border border-violet-500/20 text-violet-400 rounded-xl flex flex-col items-center gap-2 opacity-80 cursor-not-allowed">
                                    <div className="flex items-center gap-2">
                                        <RefreshCw size={16} className="animate-spin" /> Generating HQ... ({hqProgress}%)
                                    </div>
                                    <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
                                        <motion.div className="h-full bg-violet-500" initial={{ width: 0 }} animate={{ width: `${hqProgress}%` }} />
                                    </div>
                                    <span className="text-[10px] uppercase tracking-tighter">{hqMessage}</span>
                                </div>
                            )}

                            {hqStatus === 'complete' && (
                                <button
                                    onClick={() => handleDownload(hqResult?.download_url)}
                                    className="py-3 px-4 bg-violet-600 border border-violet-400 text-white rounded-xl flex items-center justify-center gap-2 transition-all font-bold shadow-lg shadow-violet-500/40 animate-pulse"
                                >
                                    <Download size={16} /> Download High Quality
                                </button>
                            )}

                            {/* Secondary Actions */}
                            <div className="grid grid-cols-2 gap-3 mt-2">
                                <button onClick={() => navigate('/enterprise')} className="py-3 border border-slate-700 hover:border-slate-500 text-slate-300 rounded-xl flex items-center justify-center gap-2 text-sm">
                                    <RefreshCw size={14} /> Generate Another
                                </button>
                                <button
                                    onClick={() => navigate(`/studio/${studioProjectId || 'demo'}`)}
                                    className="py-3 border border-cyan-500/30 hover:bg-cyan-900/10 text-cyan-300 rounded-xl flex items-center justify-center gap-2 text-sm"
                                >
                                    <Code size={14} /> Open in Studio
                                </button>
                            </div>

                            <button onClick={() => navigate('/dashboard')} className="w-full py-3 border border-slate-700 hover:border-slate-500 text-slate-400 hover:text-white rounded-xl flex items-center justify-center gap-2 text-sm transition-all">
                                <LayoutDashboard size={14} /> Return Dashboard
                            </button>
                        </motion.div>
                    )}

                    {status === 'error' && (
                        <div className="mt-8 flex gap-4">
                            <button onClick={() => startGeneration('quick')} className="text-white bg-red-500/20 hover:bg-red-500/30 border border-red-500/50 px-6 py-2 rounded-lg flex items-center gap-2">
                                <RefreshCw size={16} /> Retry Generation
                            </button>
                            <button onClick={() => navigate('/dashboard')} className="text-slate-400 hover:text-white px-6 py-2 rounded-lg">Dashboard</button>
                        </div>
                    )}

                </div>
            </div>
        </div>
    );
};

export default EnterpriseGeneration;
