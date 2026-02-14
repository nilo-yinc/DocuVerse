import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { Building2, GraduationCap, User, FileText, Sparkles, Clock, ChevronRight, ExternalLink, Download, Layout, Trash2 } from 'lucide-react';
import Logo from '../components/ui/Logo';
import ProfileSettings from './ProfileSettings';
import axios from 'axios';
import { defaultNodeBase, normalizeApiBase } from '../utils/apiBase';

import useTitle from '../hooks/useTitle';

const Dashboard = () => {
    useTitle('Dashboard');
    const navigate = useNavigate();
    const { user, token } = useAuth();
    const [showProfile, setShowProfile] = useState(false);
    const [projects, setProjects] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        console.log("Dashboard mounted. Token:", token ? "Present" : "Missing", "User:", user);
        if (!token) {
            setLoading(false);
            return;
        }

        const fetchProjects = async () => {
            try {
                console.log("Fetching projects...");
                const nodeApiBase = normalizeApiBase(import.meta.env.VITE_NODE_API_URL, defaultNodeBase());
                const res = await axios.get(`${nodeApiBase}/api/projects`, {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                });
                console.log("Projects fetched:", res.data);
                setProjects(res.data);
            } catch (err) {
                console.error("Failed to fetch projects", err);
            } finally {
                setLoading(false);
            }
        };
        fetchProjects();
    }, [token]);

    // Redirect to login if not authenticated and not loading - REMOVED for Guest Access
    /*
    useEffect(() => {
        if (!loading && !token) {
            console.log("No token, redirecting into login...");
        }
    }, [loading, token]);
    */

    const handleOpenStudio = (projectId) => {
        navigate(`/studio/${projectId}`);
    };

    const handleDeleteProject = async (projectId) => {
        const confirmDelete = window.confirm("Delete this project? This cannot be undone.");
        if (!confirmDelete) return;
        try {
            const nodeApiBase = normalizeApiBase(import.meta.env.VITE_NODE_API_URL, defaultNodeBase());
            await axios.delete(`${nodeApiBase}/api/projects/${projectId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setProjects(prev => prev.filter(p => p._id !== projectId));
        } catch (err) {
            console.error("Failed to delete project", err);
        }
    };

    const formatTechStack = (techStack) => {
        if (!techStack) return 'Default';
        if (typeof techStack === 'string') return techStack;
        if (Array.isArray(techStack)) return techStack.join(', ') || 'Default';
        if (typeof techStack === 'object') {
            const backend = String(techStack.backend || '').trim();
            const database = String(techStack.database || '').trim();
            const parts = [backend, database].filter(Boolean);
            return parts.length ? parts.join(' / ') : 'Default';
        }
        return 'Default';
    };

    return (
        <div className="h-screen bg-[#0d1117] text-[#c9d1d9] font-sans selection:bg-[#58a6ff]/30 flex flex-col overflow-hidden">

            {/* Header */}
            <nav className="h-16 bg-[#161b22]/80 backdrop-blur-md border-b border-[#30363d] z-50 flex items-center justify-between px-6 md:px-12 shrink-0">
                <div className="flex items-center gap-3 cursor-pointer group hover:opacity-80 transition-opacity" onClick={() => navigate('/')}>
                    <Logo size="sm" showText={false} />
                    <span className="text-lg font-bold text-white tracking-tight">DocuVerse</span>
                </div>

                <div className="flex items-center gap-6">
                    {token && (
                        <>
                            <div className="text-right hidden sm:block">
                                <div className="text-xs font-bold text-white tracking-wide">{user?.name || 'User'}</div>
                                <div className="text-[10px] text-[#8b949e] font-medium uppercase tracking-wider">{user?.role === 'admin' ? 'Administrator' : 'Standard'}</div>
                            </div>

                            <div
                                onClick={() => setShowProfile(true)}
                                className="w-8 h-8 rounded-full bg-[#0d1117] border border-[#30363d] hover:border-[#58a6ff] cursor-pointer flex items-center justify-center overflow-hidden transition-all duration-300"
                            >
                                {user?.profilePic ? (
                                    <img src={user.profilePic} alt="Profile" className="w-full h-full object-cover" />
                                ) : (
                                    <User className="text-[#8b949e]" size={16} />
                                )}
                            </div>
                        </>
                    )}
                </div>
            </nav>

            {/* Main Layout */}
            <div className="flex-1 flex overflow-hidden">

                {/* Sidebar / Quick Actions */}
                <aside className="w-72 border-r border-[#30363d] bg-[#0d1117] p-6 hidden md:flex flex-col gap-8 shrink-0">
                    <div>
                        <h3 className="text-[10px] font-bold text-[#8b949e] uppercase tracking-[0.2em] mb-4">Core Modules</h3>
                        <div className="space-y-2">
                            <button
                                onClick={() => {
                                    localStorage.removeItem('autoSRS_enterpriseForm');
                                    navigate('/enterprise/form?new=1', { state: { resetForm: true } });
                                }}
                                className="w-full flex items-center gap-3 p-3 rounded-lg bg-[#238636] hover:bg-[#2ea043] text-white text-sm font-bold transition shadow-lg shadow-green-900/10 group"
                            >
                                <Layout size={18} className="group-hover:rotate-12 transition-transform" />
                                New Enterprise SRS
                            </button>
                            <button
                                onClick={() => navigate('/student/coming-soon')}
                                className="w-full flex items-center gap-3 p-3 rounded-lg border border-[#30363d] hover:border-[#58a6ff]/50 text-[#c9d1d9] text-sm font-medium transition group"
                            >
                                <GraduationCap size={18} className="text-[#8b949e] group-hover:text-[#58a6ff]" />
                                Student Lab Room
                            </button>
                        </div>
                    </div>

                    <div>
                        <h3 className="text-[10px] font-bold text-[#8b949e] uppercase tracking-[0.2em] mb-4">Summary</h3>
                        <div className="bg-[#161b22] rounded-xl border border-[#30363d] p-4 text-xs space-y-3">
                            <div className="flex justify-between">
                                <span className="text-[#8b949e]">Total Projects</span>
                                <span className="text-white font-mono">{projects.length}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-[#8b949e]">Storage Used</span>
                                <span className="text-white font-mono">1.2 MB / 10 MB</span>
                            </div>
                        </div>
                    </div>
                </aside>

                {/* Main Content Area */}
                <main className="flex-1 overflow-y-auto bg-[#0d1117] p-6 md:p-10 scrollbar-thin scrollbar-thumb-[#30363d]">
                    <div className="max-w-5xl mx-auto">

                        <div className="flex items-center justify-between mb-8">
                            <div>
                                <h2 className="text-2xl font-bold text-white mb-1">Your Projects</h2>
                                <p className="text-sm text-[#8b949e]">Manage and resume your SRS documentation.</p>
                            </div>
                            <div className="flex gap-2">
                                {/* Search or Filter could go here */}
                            </div>
                        </div>

                        {loading ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {[1, 2, 3, 4].map(i => (
                                    <div key={i} className="h-48 rounded-xl bg-[#161b22] border border-[#30363d] animate-pulse"></div>
                                ))}
                            </div>
                        ) : projects.length === 0 ? (
                            <div className="bg-[#161b22] border border-dashed border-[#30363d] rounded-2xl p-12 text-center">
                                <div className="w-16 h-16 bg-[#0d1117] border border-[#30363d] rounded-full flex items-center justify-center mx-auto mb-4">
                                    <FileText className="text-[#30363d]" size={24} />
                                </div>
                                <h3 className="text-white font-bold mb-2">No projects yet</h3>
                                <p className="text-sm text-[#8b949e] max-w-xs mx-auto mb-6">Start your first high-quality SRS document using our Enterprise Wizard.</p>
                                <button
                                    onClick={() => {
                                        localStorage.removeItem('autoSRS_enterpriseForm');
                                        navigate('/enterprise/form?new=1', { state: { resetForm: true } });
                                    }}
                                    className="px-6 py-2 bg-[#1f6feb] text-white rounded-lg font-bold hover:bg-[#388bfd] transition shadow-lg shadow-blue-900/20"
                                >
                                    Create First Project
                                </button>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <AnimatePresence>
                                    {projects.map((project, idx) => (
                                        <motion.div
                                            key={project._id}
                                            initial={{ opacity: 0, y: 20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: idx * 0.05 }}
                                            className="group bg-[#161b22] border border-[#30363d] rounded-xl hover:border-[#58a6ff]/50 transition-all duration-300 relative overflow-hidden"
                                        >
                                            {/* Status Badge */}
                                            <div className="absolute top-4 right-4 text-[9px] font-bold px-2 py-0.5 rounded-full border border-[#30363d] bg-[#0d1117] text-[#8b949e] uppercase tracking-wider group-hover:border-[#58a6ff]/30 transition-colors">
                                                {project.isPublic ? 'Public' : 'Private'}
                                            </div>

                                            <div className="p-6">
                                                <div className="flex items-center gap-3 mb-4">
                                                    <div className="w-10 h-10 rounded-lg bg-[#0d1117] border border-[#30363d] flex items-center justify-center group-hover:bg-[#58a6ff]/10 transition-colors">
                                                        <FileText size={20} className="text-[#58a6ff]" />
                                                    </div>
                                                    <div>
                                                        <h4 className="text-white font-bold group-hover:text-[#58a6ff] transition-colors line-clamp-1">{project.title}</h4>
                                                        <div className="flex items-center gap-2 text-[10px] text-[#8b949e]">
                                                            <Clock size={10} />
                                                            <span>Last edited {new Date(project.updatedAt).toLocaleString()}</span>
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="grid grid-cols-2 gap-4 mb-6">
                                                    <div className="bg-[#0d1117] rounded-lg p-2 border border-[#30363d]">
                                                        <div className="text-[9px] text-[#8b949e] uppercase font-bold mb-1">Domain</div>
                                                        <div className="text-xs text-white truncate">{project.domain || 'N/A'}</div>
                                                    </div>
                                                    <div className="bg-[#0d1117] rounded-lg p-2 border border-[#30363d]">
                                                        <div className="text-[9px] text-[#8b949e] uppercase font-bold mb-1">Tech Stack</div>
                                                        <div className="text-xs text-white truncate">{formatTechStack(project.techStack)}</div>
                                                    </div>
                                                </div>

                                                <div className="flex gap-2">
                                                    <button
                                                        onClick={() => handleOpenStudio(project._id)}
                                                        className="flex-1 flex items-center justify-center gap-2 py-2 bg-[#21262d] border border-[#30363d] hover:border-[#58a6ff] text-white text-xs font-bold rounded-lg transition-all"
                                                    >
                                                        <ExternalLink size={14} />
                                                        Open Studio
                                                    </button>
                                                    <button
                                                        onClick={() => handleDeleteProject(project._id)}
                                                        className="flex items-center justify-center p-2 bg-[#21262d] border border-[#30363d] hover:border-[#ff7b72] text-[#8b949e] hover:text-[#ff7b72] rounded-lg transition-all"
                                                        title="Delete Project"
                                                    >
                                                        <Trash2 size={14} />
                                                    </button>
                                                    {project.documentUrl && (
                                                        <a
                                                            href={project.documentUrl}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="flex items-center justify-center p-2 bg-[#21262d] border border-[#30363d] hover:border-[#238636] text-[#8b949e] hover:text-[#238636] rounded-lg transition-all"
                                                            title="Download DOCX"
                                                        >
                                                            <Download size={14} />
                                                        </a>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Hover Glow */}
                                            <div className="absolute inset-x-0 bottom-0 h-[2px] bg-gradient-to-r from-transparent via-[#58a6ff] to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                        </motion.div>
                                    ))}
                                </AnimatePresence>
                            </div>
                        )}
                    </div>
                </main>
            </div>

            {/* Profile Modal */}
            {showProfile && <ProfileSettings onClose={() => setShowProfile(false)} />}
        </div>
    );
};

export default Dashboard;
