import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Stars, CalendarClock, Rocket, MessageSquare, Send, CheckCircle, AlertCircle, Loader2, Plus, ChevronRight, FileText, Download } from 'lucide-react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import Logo from '../components/ui/Logo';
import { defaultNodeBase, normalizeApiBase } from '../utils/apiBase';

const StudentComingSoon = () => {
    const navigate = useNavigate();
    const { token } = useAuth();
    const [suggestion, setSuggestion] = useState({ title: '', description: '', priority: 'Medium' });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitStatus, setSubmitStatus] = useState(null); // 'success' | 'error' | null
    const [showForm, setShowForm] = useState(false);

    const nodeApiBase = normalizeApiBase(import.meta.env.VITE_NODE_API_URL, defaultNodeBase());

    const handleSuggest = async (e) => {
        e.preventDefault();
        if (!suggestion.title || !suggestion.description) return;
        if (!token) {
            setSubmitStatus('error');
            return;
        }

        setIsSubmitting(true);
        setSubmitStatus(null);
        try {
            await axios.post(`${nodeApiBase}/api/support/suggest`, suggestion, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setSubmitStatus('success');
            setSuggestion({ title: '', description: '', priority: 'Medium' });
            setTimeout(() => {
                setSubmitStatus(null);
                setShowForm(false);
            }, 3000);
        } catch (error) {
            console.error("Failed to submit suggestion", error);
            setSubmitStatus('error');
        } finally {
            setIsSubmitting(false);
        }
    };

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: { staggerChildren: 0.15, delayChildren: 0.2 }
        }
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } }
    };

    const cardVariants = {
        hidden: { opacity: 0, scale: 0.95 },
        visible: { opacity: 1, scale: 1, transition: { duration: 0.5 } }
    };

    return (
        <div className="min-h-screen bg-[#0d1117] text-[#c9d1d9] font-sans relative overflow-hidden selection:bg-[#58a6ff]/30">
            {/* Animated Background Elements */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
                <motion.div
                    animate={{
                        scale: [1, 1.2, 1],
                        opacity: [0.1, 0.2, 0.1],
                        x: [0, 50, 0],
                        y: [0, -30, 0]
                    }}
                    transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
                    className="absolute -top-24 -right-24 w-[600px] h-[600px] bg-[#58a6ff]/10 rounded-full blur-[120px]"
                ></motion.div>
                <motion.div
                    animate={{
                        scale: [1, 1.1, 1],
                        opacity: [0.1, 0.15, 0.1],
                        x: [0, -40, 0],
                        y: [0, 40, 0]
                    }}
                    transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                    className="absolute -bottom-48 -left-48 w-[700px] h-[700px] bg-[#58a6ff]/10 rounded-full blur-[140px]"
                ></motion.div>

                {/* Floating Stars/Particles */}
                {[...Array(20)].map((_, i) => (
                    <motion.div
                        key={i}
                        initial={{ opacity: 0, x: Math.random() * 100 + "%", y: Math.random() * 100 + "%" }}
                        animate={{
                            opacity: [0, 0.4, 0],
                            y: ["0%", "-10%"]
                        }}
                        transition={{
                            duration: 3 + Math.random() * 4,
                            repeat: Infinity,
                            delay: Math.random() * 5
                        }}
                        className="absolute w-1 h-1 bg-white rounded-full"
                    />
                ))}
            </div>

            <div className="relative z-10 max-w-6xl mx-auto px-6 py-12 md:py-20 flex flex-col min-h-screen">
                {/* Navbar-like Header */}
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center justify-between mb-16"
                >
                    <div className="flex items-center gap-4 group cursor-pointer" onClick={() => navigate('/dashboard')}>
                        <Logo size="lg" subText="Labs" />
                    </div>
                    <button
                        onClick={() => navigate('/dashboard')}
                        className="text-xs font-bold px-5 py-2.5 border border-[#30363d] rounded-full hover:bg-[#161b22] hover:border-[#8b949e] text-[#8b949e] hover:text-white transition-all flex items-center gap-2"
                    >
                        Back to Dashboard
                    </button>
                </motion.div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-start">
                    {/* Left Column: Hero */}
                    <motion.div
                        variants={containerVariants}
                        initial="hidden"
                        animate="visible"
                        className="space-y-8"
                    >
                        <motion.div variants={itemVariants}>
                            <motion.span
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                className="inline-block px-3 py-1 rounded-full bg-[#58a6ff]/10 border border-[#58a6ff]/20 text-[#58a6ff] text-[10px] font-bold uppercase tracking-widest mb-4"
                            >
                                Phase 02: Educational Excellence
                            </motion.span>
                            <h1 className="text-5xl md:text-7xl font-extrabold leading-[1.1] text-white tracking-tight">
                                A student workspace built like a <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#58a6ff] to-[#79c0ff]">real engineering lab.</span>
                            </h1>
                        </motion.div>

                        <motion.p variants={itemVariants} className="text-[#8b949e] text-lg leading-relaxed max-w-lg">
                            We're transforming how engineering students document their research. Get ready for verified templates, structured evaluation cues, and a workspace that feels like a professional studio.
                        </motion.p>

                        <motion.div variants={itemVariants} className="flex flex-wrap gap-4">
                            <button
                                onClick={() => navigate('/enterprise/form')}
                                className="group px-8 py-4 bg-white text-black rounded-full font-bold hover:bg-[#58a6ff] hover:text-white transition-all duration-300 flex items-center gap-2 shadow-xl shadow-white/5"
                            >
                                Explore Enterprise SRS <Rocket size={18} className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                            </button>
                            <button
                                onClick={() => setShowForm(!showForm)}
                                className="px-8 py-4 border border-[#30363d] rounded-full font-bold hover:bg-[#161b22] hover:border-[#8b949e] transition-all flex items-center gap-2"
                            >
                                <Plus size={18} /> Suggest a Feature
                            </button>
                        </motion.div>

                        {/* Feature Suggestion Form Overlay/Section */}
                        <AnimatePresence>
                            {showForm && (
                                <motion.div
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: 'auto' }}
                                    exit={{ opacity: 0, height: 0 }}
                                    className="overflow-hidden"
                                >
                                    <form
                                        onSubmit={handleSuggest}
                                        className="p-6 bg-[#161b22] border border-[#30363d] rounded-2xl space-y-4 shadow-2xl"
                                    >
                                        <div className="flex items-center gap-2 text-[#58a6ff] mb-2">
                                            <MessageSquare size={16} />
                                            <span className="text-xs font-bold uppercase tracking-wider">What should we build next?</span>
                                        </div>
                                        <div className="space-y-4">
                                            <input
                                                type="text"
                                                placeholder="Feature Title (e.g., Gantt Charts)"
                                                className="w-full bg-[#0d1117] border border-[#30363d] rounded-xl px-4 py-3 text-sm focus:border-[#58a6ff] outline-none transition-colors"
                                                value={suggestion.title}
                                                onChange={e => setSuggestion({ ...suggestion, title: e.target.value })}
                                                required
                                            />
                                        </div>
                                        <textarea
                                            placeholder="Tell us more about how this would help you..."
                                            rows={3}
                                            className="w-full bg-[#0d1117] border border-[#30363d] rounded-xl px-4 py-3 text-sm focus:border-[#58a6ff] outline-none transition-colors resize-none"
                                            value={suggestion.description}
                                            onChange={e => setSuggestion({ ...suggestion, description: e.target.value })}
                                            required
                                        />
                                        <div className="flex items-center justify-between">
                                            <select
                                                className="bg-[#0d1117] border border-[#30363d] rounded-lg px-3 py-1.5 text-xs text-[#8b949e] outline-none"
                                                value={suggestion.priority}
                                                onChange={e => setSuggestion({ ...suggestion, priority: e.target.value })}
                                            >
                                                <option value="Low">Low Priority</option>
                                                <option value="Medium">Medium Priority</option>
                                                <option value="High">High Priority</option>
                                            </select>
                                            <button
                                                disabled={isSubmitting}
                                                className="px-6 py-2 bg-[#58a6ff] text-white rounded-lg font-bold text-sm hover:bg-[#4493f8] transition-all flex items-center gap-2 disabled:opacity-50"
                                            >
                                                {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                                                Submit Feedback
                                            </button>
                                        </div>
                                        {submitStatus === 'success' && (
                                            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-xs text-[#3fb950] flex items-center gap-2">
                                                <CheckCircle size={14} /> Suggestion sent successfully!
                                            </motion.div>
                                        )}
                                        {submitStatus === 'error' && (
                                            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-xs text-[#f85149] flex items-center gap-2">
                                                <AlertCircle size={14} /> Failed to send. Please try again later.
                                            </motion.div>
                                        )}
                                    </form>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </motion.div>

                    {/* Right Column: Cards */}
                    <motion.div
                        initial={{ opacity: 0, x: 30 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.4, duration: 0.8 }}
                        className="relative"
                    >
                        {/* Decorative Background Blob */}
                        <div className="absolute inset-0 bg-gradient-to-br from-[#58a6ff]/20 to-transparent blur-3xl -z-10 rounded-full scale-110 translate-x-10 translate-y-10"></div>

                        <div className="bg-[#161b22]/80 backdrop-blur-xl border border-[#30363d] rounded-[32px] p-8 md:p-10 shadow-3xl">
                            <div className="flex items-center gap-3 text-[#f2cc60] mb-8">
                                <motion.div
                                    animate={{ rotate: 360 }}
                                    transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
                                >
                                    <CalendarClock size={24} />
                                </motion.div>
                                <span className="text-sm font-black uppercase tracking-[0.3em] opacity-80">Reserved Access</span>
                            </div>

                            <motion.div
                                variants={containerVariants}
                                initial="hidden"
                                animate="visible"
                                className="space-y-4"
                            >
                                {[
                                    { title: 'Lab Report Studio', text: 'Index-to-conclusion reports with verified university formats.', icon: FileText },
                                    { title: 'Viva Drill Mode', text: 'Topic-based viva cards with scoring and confidence tips.', icon: MessageSquare },
                                    { title: 'Submission Pack', text: 'Auto cover sheets, diagrams, and print-ready exports.', icon: Download },
                                    { title: 'CSE Lab Tracker', text: 'Weekly progress map so you never miss a lab task.', icon: CalendarClock }
                                ].map((item, idx) => {
                                    const IconComp = item.icon || Stars;
                                    return (
                                        <motion.div
                                            key={item.title}
                                            variants={cardVariants}
                                            whileHover={{ x: 8, backgroundColor: "#1c2128" }}
                                            className="group p-5 rounded-2xl bg-[#0d1117]/50 border border-[#30363d] transition-all flex items-start gap-4 cursor-default"
                                        >
                                            <div className="p-2.5 rounded-xl bg-[#161b22] border border-[#30363d] text-[#8b949e] group-hover:text-[#58a6ff] group-hover:border-[#58a6ff]/50 transition-colors">
                                                <IconComp size={18} />
                                            </div>
                                            <div className="flex-1">
                                                <div className="flex items-center justify-between mb-1">
                                                    <span className="text-lg font-bold text-white tracking-tight">{item.title}</span>
                                                    <ChevronRight size={14} className="text-[#30363d] group-hover:text-[#58a6ff] transition-colors" />
                                                </div>
                                                <p className="text-sm text-[#8b949e] leading-relaxed font-medium">{item.text}</p>
                                            </div>
                                        </motion.div>
                                    );
                                })}
                            </motion.div>

                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 1.5 }}
                                className="mt-10 pt-8 border-t border-[#30363d] flex items-center justify-between"
                            >
                                <div className="text-xs text-[#8b949e] font-medium italic">
                                    Your access is reserved for early drop.
                                </div>
                                <div className="flex -space-x-2">
                                    {[1, 2, 3].map(i => (
                                        <div key={i} className="w-8 h-8 rounded-full border-2 border-[#161b22] bg-[#58a6ff]/20 flex items-center justify-center">
                                            <Stars size={12} className="text-[#58a6ff]" />
                                        </div>
                                    ))}
                                </div>
                            </motion.div>
                        </div>
                    </motion.div>
                </div>

                {/* Footer Quote/Microcopy */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 2, duration: 1 }}
                    className="mt-auto pt-16 text-center"
                >
                    <p className="text-[#30363d] text-xs font-bold uppercase tracking-[0.5em] hover:text-[#8b949e] transition-colors cursor-default">
                        Designed for the next generation of engineers
                    </p>
                </motion.div>
            </div>
        </div>
    );
};


export default StudentComingSoon;
