import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, BrainCircuit, FileText, MessageSquare, ChevronRight, Zap, X, Send, Bot, User } from 'lucide-react';
import axios from 'axios';
import { defaultNodeBase, normalizeApiBase } from '../../utils/apiBase';

// Debounce Utility
const useDebounce = (value, delay) => {
    const [debouncedValue, setDebouncedValue] = useState(value);
    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedValue(value);
        }, delay);
        return () => clearTimeout(handler);
    }, [value, delay]);
    return debouncedValue;
};

const NotebookFeature = () => {
    const pyApiBase = normalizeApiBase(
        import.meta.env.VITE_PY_API_URL,
        normalizeApiBase(import.meta.env.VITE_NODE_API_URL, defaultNodeBase())
    );
    const [content, setContent] = useState(
        "# E-Commerce System Requirements\n\n1. User Authentication\n   - Users must be able to log in via Email/Password and OAuth (Google).\n   - JWT tokens should be used for session management.\n\n2. Product Catalog\n   - The system must support searching and filtering by category, price, and rating.\n   - Images should be stored in an S3 bucket.\n\n3. Order Processing\n   - Payments will be handled via Stripe API."
    );

    const debouncedContent = useDebounce(content, 1500); // Analyze 1.5s after typing stops
    const [insights, setInsights] = useState([]);
    const [loadingInsights, setLoadingInsights] = useState(false);

    // Chat State
    const [showChat, setShowChat] = useState(false);
    const [chatMessages, setChatMessages] = useState([
        { role: 'ai', text: "I've analyzed your notes. Ask me anything about this system design!" }
    ]);
    const [chatInput, setChatInput] = useState("");
    const [chatLoading, setChatLoading] = useState(false);

    // AI Analysis Effect
    useEffect(() => {
        const analyzeNotebook = async () => {
            if (!debouncedContent.trim()) return;
            setLoadingInsights(true);
            try {
                const res = await axios.post(`${pyApiBase}/api/notebook/analyze`, { content: debouncedContent });
                if (res.data.services) {
                    setInsights(res.data.services);
                }
            } catch (error) {
                console.error("Analysis failed", error);
            } finally {
                setLoadingInsights(false);
            }
        };

        analyzeNotebook();
    }, [debouncedContent]);

    // Chat Handler
    const handleSendMessage = async () => {
        if (!chatInput.trim()) return;

        const newMsg = { role: 'user', text: chatInput };
        setChatMessages(prev => [...prev, newMsg]);
        setChatInput("");
        setChatLoading(true);

        try {
            const res = await axios.post(`${pyApiBase}/api/notebook/chat`, {
                content: content,
                query: newMsg.text,
                history: chatMessages
            });
            setChatMessages(prev => [...prev, { role: 'ai', text: res.data.answer }]);
        } catch (error) {
            setChatMessages(prev => [...prev, { role: 'ai', text: "Error connecting to AI." }]);
        } finally {
            setChatLoading(false);
        }
    };

    return (
        <section className="py-24 bg-[#0d1117] relative overflow-hidden">
            {/* Background Accents */}
            <div className="absolute top-0 right-0 p-64 bg-[#79c0ff]/5 blur-[120px] rounded-full pointer-events-none"></div>
            <div className="absolute bottom-0 left-0 p-40 bg-[#d29922]/5 blur-[100px] rounded-full pointer-events-none"></div>

            <div className="max-w-7xl mx-auto px-6">
                <div className="mb-16">
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#1f2937] border border-[#30363d] text-[#c9d1d9] text-xs font-medium mb-4"
                    >
                        <Sparkles size={14} className="text-[#58a6ff]" />
                        <span>Gemini-Powered Workspace</span>
                    </motion.div>
                    <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
                        Think in <span className="text-[#58a6ff]">Notebooks</span>. <br />
                        Design with <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#58a6ff] to-[#79c0ff]">Context.</span>
                    </h2>
                    <p className="text-[#8b949e] max-w-2xl text-lg">
                        Paste your rough notes. Our AI organizes them, highlights architectural patterns,
                        and lets you chat with your own documentation instantly.
                    </p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 h-[600px] relative">
                    {/* Left: Input Area */}
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        className="bg-[#161b22] border border-[#30363d] rounded-2xl p-6 flex flex-col shadow-2xl relative group focus-within:border-[#58a6ff] transition-colors"
                    >
                        <div className="flex items-center gap-2 mb-4 text-[#8b949e] text-sm border-b border-[#30363d] pb-4">
                            <FileText size={16} />
                            <span>requirements_draft.md</span>
                            <span className="ml-auto text-xs opacity-50">Markdown Supported</span>
                        </div>
                        <textarea
                            value={content}
                            onChange={(e) => setContent(e.target.value)}
                            className="flex-1 bg-transparent text-[#c9d1d9] font-mono text-sm leading-relaxed outline-none resize-none p-2 selection:bg-[#58a6ff] selection:text-white"
                            spellCheck="false"
                            placeholder="Paste your requirements here..."
                        />
                        {loadingInsights && (
                            <div className="absolute bottom-6 right-6 text-xs text-[#58a6ff] flex items-center gap-2 animate-pulse">
                                <Sparkles size={12} /> AI analyzing...
                            </div>
                        )}
                    </motion.div>

                    {/* Right: AI Insights */}
                    <div className="flex flex-col gap-4 relative">
                        <motion.div
                            initial={{ opacity: 0, x: 20 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true }}
                            className="bg-gradient-to-br from-[#1f2428] to-[#161b22] border border-[#30363d] rounded-2xl flex-1 p-6 relative overflow-hidden"
                        >
                            <div className="flex items-center gap-2 mb-6 text-[#58a6ff] text-sm font-bold uppercase tracking-wider">
                                <BrainCircuit size={16} />
                                <span>System Insights</span>
                            </div>

                            <div className="space-y-4 overflow-y-auto max-h-[440px] pr-2 scrollbar-thin scrollbar-thumb-[#30363d]">
                                <AnimatePresence mode='popLayout'>
                                    {insights.length === 0 && !loadingInsights && (
                                        <div className="text-[#8b949e] text-sm text-center mt-10 italic">
                                            Start typing to generate insights...
                                        </div>
                                    )}
                                    {insights.map((item, index) => (
                                        <motion.div
                                            key={index}
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, scale: 0.9 }}
                                            className="p-4 bg-[#0d1117] border border-[#30363d] rounded-xl hover:border-[#58a6ff] transition-colors cursor-pointer group"
                                        >
                                            <div className="flex justify-between items-start mb-2">
                                                <h4 className="text-white font-medium group-hover:text-[#58a6ff] transition-colors">{item.title}</h4>
                                                <span className={`text-[10px] px-2 py-0.5 rounded-full border border-[#30363d] bg-[#161b22] opacity-70`}>
                                                    {item.type}
                                                </span>
                                            </div>
                                            <p className="text-sm text-[#8b949e] leading-relaxed">
                                                {item.desc}
                                            </p>
                                        </motion.div>
                                    ))}
                                </AnimatePresence>
                            </div>

                            <div className="absolute bottom-0 left-0 w-full p-4 bg-gradient-to-t from-[#161b22] to-transparent">
                                <button
                                    onClick={() => setShowChat(true)}
                                    className="w-full py-3 bg-[#58a6ff]/10 border border-[#58a6ff]/30 text-[#58a6ff] rounded-lg text-sm font-medium hover:bg-[#58a6ff]/20 transition flex items-center justify-center gap-2"
                                >
                                    <MessageSquare size={16} />
                                    Chat with this Context
                                </button>
                            </div>
                        </motion.div>
                    </div>

                    {/* Chat Overlay */}
                    <AnimatePresence>
                        {showChat && (
                            <motion.div
                                initial={{ opacity: 0, y: 20, scale: 0.95 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, y: 20, scale: 0.95 }}
                                className="absolute inset-0 z-50 bg-[#161b22] rounded-2xl border border-[#30363d] shadow-2xl flex flex-col"
                            >
                                <div className="p-4 border-b border-[#30363d] flex justify-between items-center bg-[#0d1117] rounded-t-2xl">
                                    <div className="flex items-center gap-2">
                                        <Bot size={18} className="text-[#58a6ff]" />
                                        <span className="font-bold text-white text-sm">ContextChat</span>
                                    </div>
                                    <button onClick={() => setShowChat(false)} className="text-[#8b949e] hover:text-white">
                                        <X size={18} />
                                    </button>
                                </div>

                                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                                    {chatMessages.map((msg, i) => (
                                        <div key={i} className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                                            <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 
                                                ${msg.role === 'ai' ? 'bg-[#58a6ff]/10 text-[#58a6ff]' : 'bg-[#79c0ff]/10 text-[#79c0ff]'}`}>
                                                {msg.role === 'ai' ? <Bot size={14} /> : <User size={14} />}
                                            </div>
                                            <div className={`p-3 rounded-xl max-w-[80%] text-sm ${msg.role === 'ai' ? 'bg-[#21262d] text-[#c9d1d9]' : 'bg-[#1f6feb] text-white'}`}>
                                                {msg.text}
                                            </div>
                                        </div>
                                    ))}
                                    {chatLoading && (
                                        <div className="flex gap-3">
                                            <div className="w-8 h-8 rounded-full bg-[#58a6ff]/10 text-[#58a6ff] flex items-center justify-center shrink-0"><Bot size={14} /></div>
                                            <div className="bg-[#21262d] p-3 rounded-xl flex gap-1 items-center">
                                                <div className="w-1.5 h-1.5 bg-[#8b949e] rounded-full animate-bounce"></div>
                                                <div className="w-1.5 h-1.5 bg-[#8b949e] rounded-full animate-bounce delay-100"></div>
                                                <div className="w-1.5 h-1.5 bg-[#8b949e] rounded-full animate-bounce delay-200"></div>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <div className="p-4 border-t border-[#30363d] bg-[#0d1117] rounded-b-2xl">
                                    <div className="relative">
                                        <input
                                            type="text"
                                            className="w-full bg-[#161b22] border border-[#30363d] rounded-lg pl-4 pr-10 py-2.5 text-sm text-white focus:border-[#58a6ff] outline-none"
                                            placeholder="Ask about your notes..."
                                            value={chatInput}
                                            onChange={(e) => setChatInput(e.target.value)}
                                            onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                                        />
                                        <button
                                            onClick={handleSendMessage}
                                            className="absolute right-2 top-2 p-1 text-[#58a6ff] hover:bg-[#58a6ff]/10 rounded"
                                        >
                                            <Send size={16} />
                                        </button>
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>
        </section>
    );
};

export default NotebookFeature;
