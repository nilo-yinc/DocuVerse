import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { motion } from 'framer-motion';
import { Building2, GraduationCap, User, FileText, Sparkles } from 'lucide-react';
import Logo from '../components/ui/Logo';
import ProfileSettings from './ProfileSettings';

const Dashboard = () => {
    const navigate = useNavigate();
    const { user, token } = useAuth();
    const [showProfile, setShowProfile] = useState(false);

    return (
        <div className="h-screen bg-[#0e1116] text-[#f5f1e8] font-sans selection:bg-[#e3b684] selection:text-[#1a1a1a] flex flex-col overflow-hidden">

            {/* Header */}
            <nav className="h-20 bg-[#0e1116]/90 backdrop-blur-md border-b border-[#242a2f] z-50 flex items-center justify-between px-6 md:px-12">
                <div className="flex items-center gap-3 cursor-pointer group hover:opacity-80 transition-opacity" onClick={() => navigate('/')}>
                    <Logo size="md" />
                </div>

                <div className="flex items-center gap-6">
                    {token && (
                        <>
                            <div className="text-right hidden sm:block">
                                <div className="text-sm font-bold text-[#f5f1e8] tracking-wide">{user?.name || 'Guest User'}</div>
                                <div className="text-xs text-[#9aa2a9] font-medium uppercase tracking-wider">{user?.role === 'admin' ? 'Administrator' : 'Standard Account'}</div>
                            </div>

                            <div
                                onClick={() => setShowProfile(true)}
                                className="w-12 h-12 rounded-full bg-[#1b1f23] border-2 border-[#2b3137] hover:border-[#3a7ca5] cursor-pointer flex items-center justify-center overflow-hidden transition-all duration-300 hover:shadow-[0_0_15px_rgba(58,124,165,0.35)]"
                            >
                                {user?.profilePic ? (
                                    <img src={user.profilePic} alt="Profile" className="w-full h-full object-cover" />
                                ) : (
                                    <User className="text-[#9aa2a9]" size={24} />
                                )}
                            </div>
                        </>
                    )}
                </div>
            </nav>

            {/* Split Screen Content */}
            <div className="flex-1 flex flex-col md:flex-row relative">

                {/* Enterprise SRS Side */}
                <motion.div
                    className="w-full md:w-1/2 bg-[#0f1318] flex flex-col justify-center items-center border-b md:border-b-0 md:border-r border-[#242a2f] hover:bg-[#141a20] transition-colors cursor-pointer group relative overflow-hidden p-8"
                    initial={{ opacity: 0, x: -50 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.6 }}
                    onClick={() => {
                        if (token) {
                            navigate('/enterprise/form');
                        } else {
                            navigate('/enterprise/access');
                        }
                    }}
                >
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-[#3a7ca5]/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>

                    <div className="relative z-10 flex flex-col items-center">
                        <div className="w-24 h-24 bg-[#1b1f23]/70 rounded-2xl flex items-center justify-center mb-8 group-hover:scale-110 transition-transform duration-500 border border-[#2b3137] group-hover:border-[#3a7ca5]/60">
                            <Building2 className="text-[#3a7ca5] w-12 h-12" />
                        </div>
                        <h2 className="text-4xl md:text-5xl font-bold text-[#f5f1e8] mb-4 group-hover:text-[#3a7ca5] transition-colors duration-300">Enterprise SRS</h2>
                        <p className="text-[#b3bbc2] max-w-md text-center text-lg leading-relaxed">
                            IEEE 830-1998 compliant SRS generation. Professional documentation for serious engineering teams.
                        </p>

                        <div className="mt-10 px-8 py-3 border border-[#3a7ca5]/40 text-[#3a7ca5] rounded-full font-semibold group-hover:bg-[#3a7ca5]/10 group-hover:border-[#3a7ca5] transition-all duration-300 flex items-center gap-2">
                            Access Module
                        </div>
                    </div>
                </motion.div>

                {/* Student Lab Side */}
                <motion.div
                    className="w-full md:w-1/2 bg-[#12161b] flex flex-col justify-center items-center relative overflow-hidden cursor-pointer group p-8"
                    initial={{ opacity: 0, x: 50 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.6, delay: 0.1 }}
                    onClick={() => {
                        if (token) {
                            navigate('/student/coming-soon');
                        } else {
                            navigate('/student/access');
                        }
                    }}
                >
                    {/* Background Effects */}
                    <div className="absolute inset-0 bg-gradient-to-br from-[#3a7ca5]/15 to-[#e3b684]/10 z-0"></div>
                    <div className="absolute top-0 right-0 w-full h-full bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-[#e3b684]/20 via-transparent to-transparent opacity-50"></div>

                    <div className="relative z-10 flex flex-col items-center">
                        <div className="w-24 h-24 bg-[#1b1f23]/80 rounded-2xl flex items-center justify-center mb-8 group-hover:scale-110 transition-transform duration-500 border border-[#2b3137] group-hover:border-[#e3b684]/50">
                            <GraduationCap className="text-[#e3b684] w-12 h-12" />
                        </div>

                        <h2 className="text-4xl md:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-[#e3b684] to-[#3a7ca5] mb-4 animate-pulse-slow">
                            Student Lab Suite
                        </h2>
                        <p className="text-[#b3bbc2] max-w-md text-center text-lg leading-relaxed mb-2">
                            The ultimate toolkit for students.
                        </p>
                        <ul className="text-sm text-[#8e98a0] flex gap-4 mb-8">
                            <li className="flex items-center gap-1"><Sparkles size={14} className="text-[#e3b684]" /> Lab Reports</li>
                            <li className="flex items-center gap-1"><Sparkles size={14} className="text-[#e3b684]" /> UML Diagrams</li>
                            <li className="flex items-center gap-1"><Sparkles size={14} className="text-[#e3b684]" /> Prototypes</li>
                        </ul>

                        <button className="px-10 py-4 bg-gradient-to-r from-[#e3b684] via-[#caa16f] to-[#3a7ca5] text-[#121416] rounded-full font-bold shadow-[0_0_20px_rgba(227,182,132,0.35)] group-hover:shadow-[0_0_35px_rgba(227,182,132,0.55)] hover:scale-105 transition-all duration-300">
                            Launch Wizard
                        </button>
                    </div>
                </motion.div>
            </div>

            {/* Profile Modal */}
            {showProfile && <ProfileSettings onClose={() => setShowProfile(false)} />}
        </div>
    );
};

export default Dashboard;
