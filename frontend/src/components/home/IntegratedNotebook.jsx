import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, BrainCircuit, FileText, MessageSquare, ChevronRight, Zap, X, Send, Bot, User, Workflow, MousePointer2, Plus, Share2, Download, Settings, Database, Server, Smartphone, Globe, Layout, Search, Clock, CheckCircle, AlertCircle, Mail } from 'lucide-react';
import axios from 'axios';
import ReactFlow, { Background, Controls, MiniMap, applyNodeChanges, applyEdgeChanges } from 'reactflow';
import 'reactflow/dist/style.css';
import { useNavigate } from 'react-router-dom';

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

const IntegratedNotebook = ({ initialContent, projectId, projectName, currentUserEmail, initialStatus = "DRAFT", initialFeedback = [], workflowEvents = [], documentUrl }) => {
    const navigate = useNavigate();
    // --- Notebook State ---
    const [content, setContent] = useState(initialContent || "# System Requirements\n\nStart typing...");
    const debouncedContent = useDebounce(content, 1500);
    const [insights, setInsights] = useState([]);
    const [loadingInsights, setLoadingInsights] = useState(false);

    // --- Studio State ---
    const [status, setStatus] = useState(initialStatus);
    const [feedback, setFeedback] = useState(initialFeedback);
    const lastFeedbackRef = useRef("");
    const lastStatusRef = useRef("");
    const [clientEmail, setClientEmail] = useState("");
    const [workflowLoading, setWorkflowLoading] = useState(false);
    const [workflowError, setWorkflowError] = useState("");
    const [workflowMessage, setWorkflowMessage] = useState("");

    // --- Chat State ---
    const [chatMessages, setChatMessages] = useState([
        { role: 'ai', text: "I've analyzed your notes. Ask me anything about this system design!" }
    ]);
    const [chatInput, setChatInput] = useState("");
    const [chatLoading, setChatLoading] = useState(false);

    // --- Diagram State ---
    const [nodes, setNodes] = useState([]);
    const [edges, setEdges] = useState([]);
    const [loadingDiagram, setLoadingDiagram] = useState(false);

    // --- UI State ---
    const [activeTab, setActiveTab] = useState('insights'); // 'insights' | 'chat' | 'diagram'

    // --- Effects ---
    useEffect(() => {
        const analyzeNotebook = async () => {
            if (!debouncedContent.trim()) return;
            setLoadingInsights(true);
            try {
                const res = await axios.post('/api/notebook/analyze', { content: debouncedContent });
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

    useEffect(() => {
        if (initialStatus !== lastStatusRef.current) {
            lastStatusRef.current = initialStatus;
            setStatus(initialStatus);
        }
    }, [initialStatus]);

    useEffect(() => {
        const serialized = JSON.stringify(initialFeedback || []);
        if (serialized !== lastFeedbackRef.current) {
            lastFeedbackRef.current = serialized;
            setFeedback(initialFeedback);
        }
    }, [initialFeedback]);

    const handleSendMessage = async () => {
        if (!chatInput.trim()) return;
        const newMsg = { role: 'user', text: chatInput };
        setChatMessages(prev => [...prev, newMsg]);
        setChatInput("");
        setChatLoading(true);

        try {
            const res = await axios.post('/api/notebook/chat', {
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

    const onNodesChange = (changes) => setNodes((nds) => applyNodeChanges(changes, nds));
    const onEdgesChange = (changes) => setEdges((eds) => applyEdgeChanges(changes, eds));

    const generateDiagram = async () => {
        if (!content.trim()) return;
        setLoadingDiagram(true);
        setNodes([]);
        setEdges([]);
        try {
            const res = await axios.post('/api/notebook/diagram', { content: content });
            if (res.data.nodes) {
                // ReactFlow expects node data in a specific format
                // The backend returns { id, type, label, x, y }
                // We need to map it to { id, type, position: {x, y}, data: { label } }
                const mappedNodes = res.data.nodes.map(n => ({
                    id: n.id,
                    type: 'default', // Using default type for safety, or custom if defined
                    position: { x: n.x, y: n.y },
                    data: { label: n.label }
                }));
                // Edges: { id, source, target, label? }
                const mappedEdges = (res.data.edges || []).map(e => ({
                    ...e,
                    type: 'smoothstep',
                    animated: true
                }));

                setNodes(mappedNodes);
                setEdges(mappedEdges);
            }
        } catch (error) {
            console.error("Diagram Gen Failed", error);
        } finally {
            setLoadingDiagram(false);
        }
    };

    const handleStartReview = async () => {
        if (!clientEmail || !projectId) {
            setWorkflowError("Provide a client email before starting review.");
            return;
        }
        setWorkflowLoading(true);
        setWorkflowError("");
        setWorkflowMessage("");
        try {
            const res = await axios.post('/api/workflow/start-review', {
                projectId,
                clientEmail,
                documentLink: documentUrl || undefined,
                senderEmail: currentUserEmail || undefined,
                projectName: projectName || undefined,
                insights,
                notes: content
            });
            setStatus('IN_REVIEW');
            if (res.data?.warning) {
                setWorkflowMessage("Review started, but external workflow failed. Configure n8n/email to deliver messages.");
            } else {
                setWorkflowMessage("Review workflow started. Client will receive the document link.");
            }
        } catch (error) {
            console.error("Failed to start review", error);
            setWorkflowError("Failed to start review. Check backend logs and email settings.");
        } finally {
            setWorkflowLoading(false);
        }
    };

    const handleResendReview = async () => {
        if (!clientEmail || !projectId) {
            setWorkflowError("Provide a client email before resending.");
            return;
        }
        setWorkflowLoading(true);
        setWorkflowError("");
        setWorkflowMessage("");
        try {
            const res = await axios.post('/api/workflow/resend-review', {
                projectId,
                clientEmail,
                documentLink: documentUrl || undefined,
                senderEmail: currentUserEmail || undefined,
                projectName: projectName || undefined,
                insights,
                notes: content
            });
            setStatus('IN_REVIEW');
            if (res.data?.warning) {
                setWorkflowMessage("Review resent, but email delivery failed. Check SMTP settings.");
            } else {
                setWorkflowMessage("Review resent. Client will receive the updated document.");
            }
        } catch (error) {
            console.error("Failed to resend review", error);
            setWorkflowError("Failed to resend review. Check backend logs and email settings.");
        } finally {
            setWorkflowLoading(false);
        }
    };

    const handleUpdateAndRegenerate = () => {
        const latestFeedback = feedback.length
            ? feedback.map((fb) => fb.comment).join('\n')
            : '';
        navigate('/enterprise/form', {
            state: {
                prefill: {
                    additionalInstructions: latestFeedback
                },
                step: 7
            }
        });
    };

    return (
        <section className="py-12 bg-transparent relative overflow-hidden min-h-screen flex flex-col z-10">
            {/* Background Accents */}
            <div className="absolute top-0 right-0 p-64 bg-[#79c0ff]/5 blur-[120px] rounded-full pointer-events-none"></div>
            <div className="absolute bottom-0 left-0 p-40 bg-[#d29922]/5 blur-[120px] rounded-full pointer-events-none"></div>

            <div className="max-w-[1600px] mx-auto px-6 w-full flex-1 flex flex-col">

                {/* Header (Hidden in Studio Mode) */}
                {!projectId && (
                    <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div>
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#1f2937] border border-[#30363d] text-[#c9d1d9] text-xs font-medium mb-3"
                            >
                                <Sparkles size={14} className="text-[#a371f7]" />
                                <span>Unified AI Workspace</span>
                            </motion.div>
                            <h2 className="text-3xl md:text-4xl font-bold text-white">
                                DocuVerse <span className="text-[#a371f7]">Studio</span>
                            </h2>
                            <p className="text-[#8b949e] text-sm mt-1">
                                Write notes, chat with context, and visualize architecture in one place.
                            </p>
                        </div>
                    </div>
                )}

                {/* Main Workspace (Split Pane) */}
                <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-6 h-[750px]">

                    {/* LEFT PANEL: Editor (5 Columns) */}
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        className="lg:col-span-5 bg-[#161b22] border border-[#30363d] rounded-xl flex flex-col shadow-xl overflow-hidden group focus-within:border-[#a371f7]/50 transition-colors"
                    >
                        <div className="h-12 border-b border-[#30363d] bg-[#0d1117]/50 flex items-center justify-between px-4">
                            <div className="flex items-center gap-2 text-[#8b949e] text-xs font-mono">
                                <FileText size={14} />
                                <span>requirements.md</span>
                            </div>
                            <div className="flex gap-2">
                                {loadingInsights && (
                                    <span className="flex items-center gap-1 text-[#a371f7] text-[10px] animate-pulse">
                                        <Sparkles size={10} /> Syncing AI...
                                    </span>
                                )}
                                {documentUrl && (
                                    <a
                                        href={documentUrl}
                                        className="flex items-center gap-1 text-[#238636] text-xs font-bold hover:underline"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                    >
                                        <Download size={12} /> View Report
                                    </a>
                                )}
                            </div>
                        </div>
                        <textarea
                            value={content}
                            onChange={(e) => setContent(e.target.value)}
                            className="flex-1 bg-transparent text-[#c9d1d9] font-mono text-sm leading-relaxed outline-none resize-none p-6 selection:bg-[#a371f7] selection:text-white"
                            spellCheck="false"
                            placeholder="Start typing your system requirements..."
                        />
                    </motion.div>

                    {/* RIGHT PANEL: Studio (7 Columns) */}
                    <div className="lg:col-span-7 flex flex-col gap-4">

                        {/* Tab Switcher */}
                        <div className="flex flex-wrap gap-2 bg-[#161b22] border border-[#30363d] rounded-lg p-1 w-fit">
                            {[
                                { id: 'insights', icon: BrainCircuit, label: 'Insights' },
                                { id: 'chat', icon: MessageSquare, label: 'Chat' },
                                { id: 'diagram', icon: Workflow, label: 'Visualizer' },
                                { id: 'workflow', icon: Zap, label: 'Workflow' },
                                { id: 'feedback', icon: MessageSquare, label: 'Feedback' },
                            ].map(tab => (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all flex items-center gap-2 
                                        ${activeTab === tab.id ? 'bg-[#21262d] text-white shadow-sm' : 'text-[#8b949e] hover:text-[#c9d1d9]'}`}
                                >
                                    <tab.icon size={14} /> {tab.label}
                                </button>
                            ))}
                        </div>

                        {/* Panel Content container */}
                        <motion.div
                            layout
                            className="flex-1 bg-[#161b22] border border-[#30363d] rounded-xl relative overflow-hidden shadow-xl"
                        >
                            {/* --- TAB: INSIGHTS --- */}
                            {activeTab === 'insights' && (
                                <motion.div
                                    initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                                    className="h-full p-6 overflow-y-auto scrollbar-thin scrollbar-thumb-[#30363d]"
                                >
                                    <h3 className="text-[#a371f7] text-xs font-bold uppercase tracking-wider mb-4 flex items-center gap-2">
                                        <Sparkles size={14} /> Real-time Analysis
                                    </h3>
                                    <div className="space-y-3">
                                        <AnimatePresence>
                                            {insights.length === 0 && !loadingInsights && (
                                                <div className="text-center mt-20 text-[#8b949e]">
                                                    <BrainCircuit size={48} className="mx-auto mb-4 opacity-20" />
                                                    <p>Type in the editor to generate insights.</p>
                                                </div>
                                            )}
                                            {insights.map((item, index) => (
                                                <motion.div
                                                    key={index}
                                                    initial={{ opacity: 0, scale: 0.95 }}
                                                    animate={{ opacity: 1, scale: 1 }}
                                                    className="p-4 bg-[#0d1117] border border-[#30363d] rounded-xl hover:border-[#a371f7]/50 transition-colors group"
                                                >
                                                    <div className="flex justify-between items-start mb-2">
                                                        <h4 className="text-white font-medium text-sm group-hover:text-[#a371f7] transition-colors">{item.title}</h4>
                                                        <span className="text-[10px] px-2 py-0.5 rounded-full border border-[#30363d] bg-[#161b22] text-[#8b949e]">{item.type}</span>
                                                    </div>
                                                    <p className="text-xs text-[#8b949e] leading-relaxed">{item.desc}</p>
                                                </motion.div>
                                            ))}
                                        </AnimatePresence>
                                    </div>
                                </motion.div>
                            )}

                            {/* --- TAB: WORKFLOW (n8n Integration) --- */}
                            {activeTab === 'workflow' && (
                                <div className="h-full p-6 flex flex-col">
                                    <div className="mb-6">
                                        <h3 className="text-[#a371f7] text-xs font-bold uppercase tracking-wider mb-4 flex items-center gap-2">
                                            <Zap size={14} /> Automated Review Loop
                                        </h3>
                                        <p className="text-sm text-[#8b949e] mb-4">
                                            Trigger an n8n workflow to send this document for client review.
                                        </p>

                                        {documentUrl && (
                                            <div className="mb-4 bg-[#0d1117] border border-[#30363d] rounded-lg p-3 text-xs text-[#8b949e] flex items-center justify-between">
                                                <span>Attached DOCX: {documentUrl}</span>
                                                <a href={documentUrl} target="_blank" rel="noreferrer" className="text-[#79c0ff] hover:underline">Open</a>
                                            </div>
                                        )}

                                        <div className="flex gap-2">
                                            <div className="relative flex-1">
                                                <Mail className="absolute left-3 top-2.5 text-[#8b949e]" size={16} />
                                                <input
                                                    type="email"
                                                    placeholder="client@example.com"
                                                    value={clientEmail}
                                                    onChange={(e) => setClientEmail(e.target.value)}
                                                    className="w-full bg-[#0d1117] border border-[#30363d] rounded-lg pl-10 pr-4 py-2 text-sm text-white focus:border-[#a371f7] outline-none"
                                                />
                                            </div>
                                            <button
                                                onClick={handleStartReview}
                                                disabled={workflowLoading || status !== 'DRAFT'}
                                                className={`px-4 py-2 rounded-lg font-bold text-sm flex items-center gap-2 transition
                                                    ${status === 'DRAFT'
                                                        ? 'bg-[#238636] text-white hover:bg-[#2ea043] shadow-lg shadow-green-900/20'
                                                        : 'bg-[#161b22] border border-[#30363d] text-[#8b949e] cursor-not-allowed'}`}
                                            >
                                                {workflowLoading ? <div className="animate-spin w-4 h-4 border-2 border-white/30 border-t-white rounded-full"></div> : <Send size={16} />}
                                                {status === 'DRAFT' ? 'Start Review' : 'Active'}
                                            </button>
                                        </div>
                                        {status === 'CHANGES_REQUESTED' && (
                                            <div className="mt-3 flex gap-2">
                                                <button
                                                    onClick={handleUpdateAndRegenerate}
                                                    className="px-4 py-2 rounded-lg font-bold text-sm flex items-center gap-2 transition bg-[#21262d] border border-[#30363d] text-[#c9d1d9] hover:bg-[#30363d]"
                                                >
                                                    Update & Regenerate
                                                </button>
                                                <button
                                                    onClick={handleResendReview}
                                                    disabled={workflowLoading}
                                                    className="px-4 py-2 rounded-lg font-bold text-sm flex items-center gap-2 transition bg-[#a371f7] text-white hover:bg-[#8957e5]"
                                                >
                                                    {workflowLoading ? <div className="animate-spin w-4 h-4 border-2 border-white/30 border-t-white rounded-full"></div> : <Send size={16} />}
                                                    Regenerate & Resend
                                                </button>
                                            </div>
                                        )}
                                        {workflowError && (
                                            <div className="mt-3 text-xs text-[#ff7b72]">{workflowError}</div>
                                        )}
                                        {workflowMessage && (
                                            <div className="mt-3 text-xs text-[#79c0ff]">{workflowMessage}</div>
                                        )}
                                    </div>

                                    {/* Timeline Visual */}
                                    <div className="flex-1 border border-[#30363d] bg-[#0d1117] rounded-xl p-4 overflow-y-auto">
                                        <div className="relative pl-4 space-y-6 before:absolute before:left-[5px] before:top-2 before:bottom-2 before:w-[2px] before:bg-[#30363d]">
                                            <div className="relative">
                                                <div className="absolute -left-[21px] top-1 w-3 h-3 rounded-full bg-[#238636] border border-[#0d1117]"></div>
                                                <h4 className="text-sm font-bold text-white">Project Created</h4>
                                                <p className="text-xs text-[#8b949e]">Draft initialized.</p>
                                            </div>

                                            {workflowEvents.map((event, idx) => (
                                                <motion.div key={`${event.title}-${idx}`} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className="relative">
                                                    <div className={`absolute -left-[21px] top-1 w-3 h-3 rounded-full border border-[#0d1117] ${event.status === 'APPROVED' ? 'bg-[#238636]' :
                                                        event.status === 'CHANGES_REQUESTED' ? 'bg-[#ff7b72]' :
                                                            'bg-[#a371f7]'
                                                        }`}></div>
                                                    <h4 className="text-sm font-bold text-white">{event.title}</h4>
                                                    <p className="text-xs text-[#8b949e]">{event.description}</p>
                                                </motion.div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* --- TAB: FEEDBACK --- */}
                            {activeTab === 'feedback' && (
                                <div className="h-full p-6">
                                    <h3 className="text-[#a371f7] text-xs font-bold uppercase tracking-wider mb-4 flex items-center gap-2">
                                        <MessageSquare size={14} /> Client Comments
                                    </h3>
                                    <div className="space-y-4">
                                        {feedback.length === 0 ? (
                                            <div className="text-center mt-20 text-[#8b949e]">
                                                <div className="w-16 h-16 bg-[#161b22] rounded-full flex items-center justify-center mx-auto mb-4 border border-[#30363d]">
                                                    <CheckCircle size={24} className="text-[#238636]" />
                                                </div>
                                                <p>No issues reported yet.</p>
                                            </div>
                                        ) : (
                                            feedback.map((fb, i) => (
                                                <div key={i} className="bg-[#161b22] border border-[#ff7b72]/30 p-4 rounded-xl">
                                                    <div className="flex justify-between items-center mb-2">
                                                        <span className="text-[#ff7b72] text-xs font-bold flex items-center gap-2">
                                                            <AlertCircle size={12} /> {fb.source}
                                                        </span>
                                                        <span className="text-[#8b949e] text-[10px]">{new Date(fb.date).toLocaleDateString()}</span>
                                                    </div>
                                                    <p className="text-sm text-[#c9d1d9]">{fb.comment}</p>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* --- TAB: CHAT --- */}
                            {activeTab === 'chat' && (
                                <div className="h-full flex flex-col">
                                    <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin scrollbar-thumb-[#30363d]">
                                        {chatMessages.map((msg, i) => (
                                            <div key={i} className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                                                <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 
                                                    ${msg.role === 'ai' ? 'bg-[#a371f7]/10 text-[#a371f7]' : 'bg-[#79c0ff]/10 text-[#79c0ff]'}`}>
                                                    {msg.role === 'ai' ? <Bot size={14} /> : <User size={14} />}
                                                </div>
                                                <div className={`p-3 rounded-xl max-w-[85%] text-sm ${msg.role === 'ai' ? 'bg-[#21262d] text-[#c9d1d9]' : 'bg-[#1f6feb] text-white'}`}>
                                                    {msg.text}
                                                </div>
                                            </div>
                                        ))}
                                        {chatLoading && (
                                            <div className="flex gap-3">
                                                <div className="w-8 h-8 rounded-full bg-[#a371f7]/10 text-[#a371f7] flex items-center justify-center shrink-0"><Bot size={14} /></div>
                                                <div className="bg-[#21262d] p-3 rounded-xl flex gap-1 items-center">
                                                    <div className="w-1.5 h-1.5 bg-[#8b949e] rounded-full animate-bounce"></div>
                                                    <div className="w-1.5 h-1.5 bg-[#8b949e] rounded-full animate-bounce delay-100"></div>
                                                    <div className="w-1.5 h-1.5 bg-[#8b949e] rounded-full animate-bounce delay-200"></div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                    <div className="p-4 border-t border-[#30363d] bg-[#0d1117]">
                                        <div className="relative">
                                            <input
                                                type="text"
                                                className="w-full bg-[#161b22] border border-[#30363d] rounded-lg pl-4 pr-10 py-3 text-sm text-white focus:border-[#a371f7] outline-none transition-colors"
                                                placeholder="Ask about your notes..."
                                                value={chatInput}
                                                onChange={(e) => setChatInput(e.target.value)}
                                                onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                                            />
                                            <button
                                                onClick={handleSendMessage}
                                                className="absolute right-2 top-2.5 p-1.5 text-[#a371f7] hover:bg-[#a371f7]/10 rounded-md transition"
                                            >
                                                <Send size={16} />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* --- TAB: DIAGRAM VISUALIZER --- */}
                            {activeTab === 'diagram' && (
                                <div className="h-full relative bg-[#010409]">
                                    {/* Generate Button Overlay */}
                                    <div className="absolute top-4 right-4 z-50">
                                        <button
                                            onClick={generateDiagram}
                                            disabled={loadingDiagram}
                                            className="px-3 py-1.5 bg-[#238636] text-white text-xs font-bold rounded shadow-lg hover:bg-[#2ea043] disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                                        >
                                            {loadingDiagram ? <div className="w-3 h-3 rounded-full border-2 border-white/30 border-t-white animate-spin"></div> : <Workflow size={14} />}
                                            {loadingDiagram ? 'Generating...' : 'Generate New Diagram'}
                                        </button>
                                    </div>

                                    {nodes.length === 0 && !loadingDiagram && (
                                        <div className="absolute inset-0 flex flex-col items-center justify-center text-[#8b949e] z-40 pointer-events-none">
                                            <Workflow size={48} className="mb-4 opacity-50" />
                                            <p className="text-sm">Click "Generate New Diagram" to visualize your notes.</p>
                                        </div>
                                    )}

                                    <div className="h-full w-full">
                                        <ReactFlow
                                            nodes={nodes}
                                            edges={edges}
                                            onNodesChange={onNodesChange}
                                            onEdgesChange={onEdgesChange}
                                            fitView
                                            proOptions={{ hideAttribution: true }}
                                        >
                                            <Background color="#30363d" gap={20} />
                                            <Controls className="bg-[#161b22] border border-[#30363d] fill-gray-400 text-gray-400" />
                                            <MiniMap style={{ background: '#161b22', border: '1px solid #30363d' }} nodeColor="#30363d" />
                                        </ReactFlow>
                                    </div>
                                </div>
                            )}

                        </motion.div>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default IntegratedNotebook;
