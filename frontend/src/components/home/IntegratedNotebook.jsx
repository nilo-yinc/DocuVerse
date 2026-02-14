import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, BrainCircuit, FileText, MessageSquare, ChevronRight, Zap, X, Send, Bot, User, Workflow, MousePointer2, Plus, Share2, Download, Settings, Database, Server, Smartphone, Globe, Layout, Search, Clock, CheckCircle, AlertCircle, Mail, Image as ImageIcon, RefreshCw, Code } from 'lucide-react';
import axios from 'axios';
import ReactFlow, { Background, Controls, MiniMap, applyNodeChanges, applyEdgeChanges } from 'reactflow';
import 'reactflow/dist/style.css';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import useTitle from '../../hooks/useTitle';
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

const IntegratedNotebook = ({ initialContent, projectId, projectName, currentUserEmail, initialStatus = "DRAFT", initialFeedback = [], workflowEvents = [], documentUrl, initialInsights = [], initialClientEmail = "", previewMode = false, enterpriseFormData = {}, initialHq = null }) => {
    const navigate = useNavigate();
    useTitle(previewMode ? null : 'Interactive Studio');
    const { token, user } = useAuth();
    // --- Notebook State ---
    const [content, setContent] = useState(initialContent || "# System Requirements\n\nStart typing...");
    const debouncedContent = useDebounce(content, 1500);
    const [insights, setInsights] = useState(initialInsights);
    const [loadingInsights, setLoadingInsights] = useState(false);

    // --- Studio State ---
    const [status, setStatus] = useState(initialStatus);
    const [feedback, setFeedback] = useState(initialFeedback);
    const lastFeedbackRef = useRef("");
    const lastStatusRef = useRef("");
    const [clientEmail, setClientEmail] = useState(initialClientEmail || "");
    const [workflowLoading, setWorkflowLoading] = useState(false);
    const [workflowError, setWorkflowError] = useState("");
    const [workflowMessage, setWorkflowMessage] = useState("");
    const [workflowTimeline, setWorkflowTimeline] = useState(workflowEvents || []);
    const [hq, setHq] = useState(initialHq || { status: 'IDLE' });
    const [activeDocumentUrl, setActiveDocumentUrl] = useState(documentUrl || "");
    const [hqToast, setHqToast] = useState({ visible: false, message: "" });
    const prevHqStatusRef = useRef((initialHq && initialHq.status) || 'IDLE');

    // --- Chat State ---
    const [chatMessages, setChatMessages] = useState([
        { role: 'ai', text: "I've analyzed your notes. Ask me anything about this system design!" }
    ]);
    const [chatInput, setChatInput] = useState("");
    const [chatLoading, setChatLoading] = useState(false);
    const [chatImageLoading, setChatImageLoading] = useState(false);
    const [chatDiagramEnabled, setChatDiagramEnabled] = useState(false);
    const [chatDiagramReason, setChatDiagramReason] = useState("");
    const [chatDiagramStatusLoading, setChatDiagramStatusLoading] = useState(false);
    const [chatPhotoEnabled, setChatPhotoEnabled] = useState(false);
    const [chatPhotoReason, setChatPhotoReason] = useState("");
    const [chatPhotoStatusLoading, setChatPhotoStatusLoading] = useState(false);
    const [chatMode, setChatMode] = useState("text"); // text | image
    const [chatImageType, setChatImageType] = useState("diagram"); // diagram | photo
    const [lastDiagramImage, setLastDiagramImage] = useState(null);

    // --- Diagram State ---
    const [nodes, setNodes] = useState([]);
    const [edges, setEdges] = useState([]);
    const [loadingDiagram, setLoadingDiagram] = useState(false);
    const [diagramImageLoading, setDiagramImageLoading] = useState(false);
    const [diagramImageError, setDiagramImageError] = useState("");

    // --- UI State ---
    const [activeTab, setActiveTab] = useState('insights'); // 'insights' | 'chat' | 'diagram'

    const nodeApiBase = normalizeApiBase(import.meta.env.VITE_NODE_API_URL, defaultNodeBase());
    const pythonApiBase = normalizeApiBase(import.meta.env.VITE_PY_API_URL, nodeApiBase);

    // const emailLocked = Boolean(clientEmail) && workflowTimeline.some((event) => event.title?.toLowerCase().includes('review'));
    const hasUpdatedDoc = workflowTimeline.some((event) =>
        ['regenerated', 'updated'].some((word) => (event.title || '').toLowerCase().includes(word))
    );

    const syncNodeProject = async (payload) => {
        if (!projectId || !token) return;
        try {
            await axios.put(`${nodeApiBase}/api/projects/${projectId}`, payload, {
                headers: { Authorization: `Bearer ${token}` }
            });
        } catch (error) {
            console.warn("Node sync failed", error);
        }
    };

    const imagePresets = [
        { id: 'arch', label: 'System Architecture' },
        { id: 'er', label: 'ER Diagram' },
        { id: 'seq', label: 'Sequence Flow' },
        { id: 'userflow', label: 'User Flow' }
    ];

    const buildImagePromptFromNotes = (preset) => {
        const base = "Create a clean, professional, blueprint-style diagram image. Use vector shapes, high contrast, minimal text (1-2 word labels), no paragraphs, no tiny text.";
        const context = content.slice(0, 1200);
        if (preset === 'arch') {
            return `${base} Title: System Architecture. Context: ${context}. Show 5-7 labeled components with clear connections and spacing.`;
        }
        if (preset === 'er') {
            return `${base} Title: Entity-Relationship Diagram. Context: ${context}. Show 5-7 entities with short attribute lists and relationships.`;
        }
        if (preset === 'seq') {
            return `${base} Title: Sequence Flow. Context: ${context}. Show 5-7 actors/services with arrows for interactions.`;
        }
        if (preset === 'userflow') {
            return `${base} Title: User Flow. Context: ${context}. Show 5-7 steps with arrows.`;
        }
        return `${base} Context: ${context}.`;
    };

    // --- Effects ---
    // --- Insights Effect ---
    useEffect(() => {
        if (previewMode) return;
        const analyzeNotebook = async () => {
            if (!debouncedContent.trim()) return;
            setLoadingInsights(true);
            try {
                const res = await axios.post(`${pythonApiBase}/api/notebook/analyze`, { content: debouncedContent });
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
    }, [debouncedContent, previewMode]);

    // --- Auto-save Effect ---
    useEffect(() => {
        if (previewMode) return;
        const autoSave = async () => {
            if (!projectId || projectId === 'demo' || !debouncedContent) return;
            try {
                await axios.put(`${nodeApiBase}/api/projects/${projectId}`, { contentMarkdown: debouncedContent }, {
                    headers: token ? { Authorization: `Bearer ${token}` } : {}
                });
            } catch (error) {
                console.error("Auto-save failed", error);
            }
        };
        autoSave();
    }, [debouncedContent, projectId, nodeApiBase, token, previewMode]);


    const refreshChatDiagramStatus = async () => {
        setChatDiagramStatusLoading(true);
        try {
            const res = await axios.get(`${pythonApiBase}/api/notebook/diagram-image/status`);
            setChatDiagramEnabled(Boolean(res.data?.enabled));
            setChatDiagramReason(res.data?.reason || "");
            return Boolean(res.data?.enabled);
        } catch {
            setChatDiagramEnabled(false);
            setChatDiagramReason("Status check failed");
            return false;
        } finally {
            setChatDiagramStatusLoading(false);
        }
    };

    const refreshChatPhotoStatus = async () => {
        setChatPhotoStatusLoading(true);
        try {
            const res = await axios.get(`${pythonApiBase}/api/notebook/image/status`);
            setChatPhotoEnabled(Boolean(res.data?.enabled));
            setChatPhotoReason(res.data?.reason || "");
            return Boolean(res.data?.enabled);
        } catch {
            setChatPhotoEnabled(false);
            setChatPhotoReason("Status check failed");
            return false;
        } finally {
            setChatPhotoStatusLoading(false);
        }
    };

    useEffect(() => {
        if (previewMode) return;
        refreshChatDiagramStatus();
        refreshChatPhotoStatus();
    }, [previewMode]);

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

    useEffect(() => {
        if (!projectId) return;
        setWorkflowTimeline(workflowEvents || []);
    }, [projectId, workflowEvents]);

    useEffect(() => {
        setHq(initialHq || { status: 'IDLE' });
    }, [initialHq]);

    useEffect(() => {
        const previous = prevHqStatusRef.current;
        const current = hq?.status || 'IDLE';
        if (previous !== 'APPLIED' && current === 'APPLIED') {
            setHqToast({
                visible: true,
                message: 'HQ ready. Enhanced DOCX is now applied to this project.'
            });
            const timeout = setTimeout(() => {
                setHqToast({ visible: false, message: "" });
            }, 5000);
            prevHqStatusRef.current = current;
            return () => clearTimeout(timeout);
        }
        prevHqStatusRef.current = current;
    }, [hq?.status]);

    useEffect(() => {
        setActiveDocumentUrl(documentUrl || "");
    }, [documentUrl]);

    const handleSendMessage = async () => {
        if (!chatInput.trim()) return;
        if (chatInput.trim().toLowerCase().startsWith('/image ')) {
            const prompt = chatInput.trim().slice(7);
            await handleGenerateChatImage(prompt, "photo");
            setChatInput("");
            return;
        }
        if (chatInput.trim().toLowerCase().startsWith('/diagram ')) {
            const prompt = chatInput.trim().slice(9);
            await handleGenerateChatImage(prompt, "diagram");
            setChatInput("");
            return;
        }
        if (chatMode === "image") {
            await handleGenerateChatImage(chatInput, chatImageType);
            setChatInput("");
            return;
        }
        const newMsg = { role: 'user', text: chatInput };
        setChatMessages(prev => [...prev, newMsg]);
        setChatInput("");
        setChatLoading(true);

        try {
            const res = await axios.post(`${pythonApiBase}/api/notebook/chat`, {
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

    const handleGenerateChatImage = async (text, typeOverride) => {
        if (!text) return;
        const type = typeOverride || chatImageType;
        const enabled = type === "diagram"
            ? (chatDiagramEnabled || (await refreshChatDiagramStatus()))
            : (chatPhotoEnabled || (await refreshChatPhotoStatus()));
        if (!enabled) {
            const reason = type === "diagram"
                ? (chatDiagramReason || 'Diagram generation is disabled.')
                : (chatPhotoReason || 'Image generation is disabled.');
            setChatMessages(prev => [...prev, { role: 'ai', text: `Image generation is off. ${reason}` }]);
            return;
        }
        setChatImageLoading(true);
        setChatMessages(prev => [...prev, { role: 'user', text: `Generate image: ${text}` }]);
        try {
            const endpoint = type === "diagram" ? `${pythonApiBase}/api/notebook/diagram-image` : `${pythonApiBase}/api/notebook/image`;
            const res = await axios.post(endpoint, { prompt: text });
            if (res.data?.image) {
                if (type === "diagram") {
                    setLastDiagramImage(res.data.image);
                }
                setChatMessages(prev => [...prev, { role: 'ai', type: 'image', imageUrl: res.data.image, text, imageType: type }]);
            } else {
                setChatMessages(prev => [...prev, { role: 'ai', text: "No image returned. Try a different prompt." }]);
            }
        } catch (error) {
            const msg = error.response?.data?.detail || "Image generation failed. Check backend connection.";
            setChatMessages(prev => [...prev, { role: 'ai', text: msg }]);
        } finally {
            setChatImageLoading(false);
        }
    };

    const downloadImage = (dataUrl, filename) => {
        const link = document.createElement("a");
        link.href = dataUrl;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const appendLastDiagramToSrs = async () => {
        if (!projectId) {
            setDiagramImageError("Project not found. Save this document first.");
            return;
        }
        if (!content.trim()) {
            setDiagramImageError("No content available.");
            return;
        }
        setDiagramImageLoading(true);
        setDiagramImageError("");
        try {
            const res = await axios.post(`${pythonApiBase}/api/project/${projectId}/append-diagram`, {
                content,
                caption: "Studio Diagram"
            });
            if (res.data?.contentMarkdown) {
                setContent(res.data.contentMarkdown);
                if (res.data?.documentUrl) {
                    setActiveDocumentUrl(res.data.documentUrl);
                }
                await syncNodeProject({
                    contentMarkdown: res.data.contentMarkdown,
                    documentUrl: res.data.documentUrl
                });
            }
        } catch (error) {
            const msg = error.response?.data?.detail || "Append diagram failed.";
            setDiagramImageError(msg);
        } finally {
            setDiagramImageLoading(false);
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
            const res = await axios.post(`${pythonApiBase}/api/notebook/diagram`, { content: content });
            if (res.data.nodes) {
                const mappedNodes = res.data.nodes.map(n => ({
                    id: n.id,
                    type: 'default',
                    position: { x: n.x, y: n.y },
                    data: { label: n.label }
                }));
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

    const handleDownloadDiagramImage = async () => {
        if (!content.trim()) return;
        setDiagramImageLoading(true);
        setDiagramImageError("");
        try {
            const res = await axios.post(`${pythonApiBase}/api/notebook/diagram-image`, { prompt: content });
            if (res.data?.image) {
                const link = document.createElement("a");
                link.href = res.data.image;
                link.download = "studio-diagram.png";
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
            } else {
                setDiagramImageError("No image returned. Try again.");
            }
        } catch (error) {
            const msg = error.response?.data?.detail || "Diagram image failed.";
            setDiagramImageError(msg);
        } finally {
            setDiagramImageLoading(false);
        }
    };

    const handleAppendDiagramToDoc = async () => {
        if (!content.trim()) return;
        if (!projectId) {
            setDiagramImageError("Project not found. Save this document first.");
            return;
        }
        setDiagramImageLoading(true);
        setDiagramImageError("");
        try {
            const res = await axios.post(`${pythonApiBase}/api/project/${projectId}/append-diagram`, {
                content,
                caption: "Studio Diagram"
            });
            if (res.data?.contentMarkdown) {
                setContent(res.data.contentMarkdown);
            }
        } catch (error) {
            const msg = error.response?.data?.detail || "Append diagram failed.";
            setDiagramImageError(msg);
        } finally {
            setDiagramImageLoading(false);
        }
    };

    const checkHqStatus = async () => {
        if (!projectId || !token) return;
        try {
            const res = await axios.get(`${nodeApiBase}/api/projects/${projectId}/hq-status`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            const data = res.data || {};
            if (data.hq) {
                setHq(data.hq);
            } else if (data.status) {
                setHq((prev) => ({ ...(prev || {}), status: data.status }));
            }
            if ((data.status === 'APPLIED' || data.status === 'READY') && data.documentUrl) {
                setActiveDocumentUrl(data.documentUrl);
                setWorkflowMessage('HQ ready. Latest document replaced with enhanced version.');
            }
        } catch (error) {
            if ([404, 502, 503, 504].includes(error?.response?.status)) return;
            console.error("Failed to check HQ status:", error);
        }
    };

    useEffect(() => {
        if (previewMode || !projectId || projectId === 'demo') return;
        syncNodeProject({
            status,
            clientEmail,
            workflowEvents: workflowTimeline,
            reviewFeedback: feedback,
            documentUrl: activeDocumentUrl || undefined,
            hq
        });
    }, [projectId, previewMode, status, clientEmail, workflowTimeline, feedback, activeDocumentUrl, hq]);

    useEffect(() => {
        if (previewMode || !projectId || projectId === 'demo' || !token) return;
        if ((hq?.status || 'IDLE') !== 'BUILDING') return;
        checkHqStatus();
        const interval = setInterval(checkHqStatus, 15000);
        return () => clearInterval(interval);
    }, [previewMode, projectId, token, hq?.status]);

    const handleSendReview = async () => {
        if (!clientEmail || !projectId) {
            setWorkflowError("Provide a client email before sending.");
            return;
        }
        setWorkflowLoading(true);
        setWorkflowError("");
        setWorkflowMessage("");
        try {
            const wasInReview = workflowTimeline.some((e) =>
                ['review sent', 'review resent', 'review started'].includes((e.title || '').toLowerCase())
            );
            const res = await axios.post(`${nodeApiBase}/api/projects/${projectId}/send-review`, {
                clientEmail,
                documentLink: activeDocumentUrl || undefined,
                senderEmail: currentUserEmail || user?.email || undefined,
                senderName: user?.name || undefined,
                projectName: projectName || undefined,
                insights,
                notes: content,
                isUpdate: hasUpdatedDoc,
                isResend: wasInReview
            }, {
                headers: token ? { Authorization: `Bearer ${token}` } : {}
            });

            const eventTitle = wasInReview ? "Review Resent" : "Review Sent";
            const eventDesc = `Document sent to ${clientEmail} for review.`;

            const nextTimeline = [
                ...workflowTimeline,
                {
                    date: new Date().toISOString(),
                    title: eventTitle,
                    description: eventDesc,
                    status: "IN_REVIEW"
                }
            ];
            setStatus('IN_REVIEW');
            setWorkflowTimeline(nextTimeline);
            await syncNodeProject({
                status: 'IN_REVIEW',
                workflowEvents: nextTimeline,
                reviewFeedback: feedback,
                documentUrl: activeDocumentUrl || undefined,
                clientEmail
            });
            if (res.data?.warning) {
                setWorkflowMessage("Review sent, but email delivery failed. Check SMTP settings.");
            } else {
                setWorkflowMessage("Review email sent successfully.");
            }
        } catch (error) {
            console.error("Failed to send review", error);
            const errMsg = error.response?.data?.detail || error.response?.data?.msg || "Failed to send review. Check backend logs and SMTP settings.";
            setWorkflowError(errMsg);
        } finally {
            setWorkflowLoading(false);
        }
    };

    const handleUpdateAndRegenerate = () => {
        const latestFeedback = feedback.length
            ? feedback.map((fb) => fb.comment).join('\n')
            : '';
        navigate(`/enterprise/form?update=1&projectId=${projectId}`, {
            state: {
                prefill: {
                    additionalInstructions: latestFeedback
                },
                step: 7,
                projectId,
                forceHQ: true
            }
        });
    };

    const handleFastTrackRegeneration = async () => {
        if (!projectId || !token) return;
        setWorkflowLoading(true);
        setWorkflowError("");
        setWorkflowMessage("");

        try {
            const latestFeedback = feedback.length
                ? feedback.map((fb) => fb.comment).join('\n')
                : '';

            const payload = {
                formData: {
                    ...(enterpriseFormData || {}),
                    additionalInstructions: latestFeedback,
                    projectId: projectId
                },
                projectId: projectId,
                mode: 'quick'
            };

            const res = await axios.post(`${nodeApiBase}/api/projects/enterprise/generate`, payload, {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (res.data?.srs_document_path) {
                setWorkflowMessage("Quick-Regeneration successful! Document updated.");
            }
        } catch (error) {
            console.error("Fast-track regeneration failed", error);
            setWorkflowError("Fast-track regeneration failed. Try the standard 'Update & Regenerate' flow instead.");
        } finally {
            setWorkflowLoading(false);
        }
    };

    return (
        <section className="py-12 bg-transparent relative overflow-hidden min-h-screen flex flex-col z-10">
            <AnimatePresence>
                {hqToast.visible && (
                    <motion.div
                        initial={{ opacity: 0, y: -12 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -12 }}
                        className="fixed top-20 right-6 z-[120] max-w-sm rounded-lg border border-[#238636]/40 bg-[#0d1117] px-4 py-3 shadow-xl"
                    >
                        <div className="flex items-start gap-2">
                            <CheckCircle size={16} className="text-[#3fb950] mt-0.5 shrink-0" />
                            <div className="text-sm text-[#c9d1d9]">{hqToast.message}</div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
            <div className="absolute top-0 right-0 p-64 bg-[#79c0ff]/5 blur-[120px] rounded-full pointer-events-none"></div>
            <div className="absolute bottom-0 left-0 p-40 bg-[#d29922]/5 blur-[120px] rounded-full pointer-events-none"></div>

            <div className="max-w-[1600px] mx-auto px-6 w-full flex-1 flex flex-col">
                {!projectId && (
                    <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div>
                            <motion.div initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#1f2937] border border-[#30363d] text-[#c9d1d9] text-xs font-medium mb-3">
                                <Sparkles size={14} className="text-[#58a6ff]" />
                                <span>Unified AI Workspace</span>
                            </motion.div>
                            <h2 className="text-3xl md:text-4xl font-bold text-white">
                                DocuVerse <span className="text-[#58a6ff]">Studio</span>
                            </h2>
                            <p className="text-[#8b949e] text-sm mt-1">Write notes, chat with context, and visualize architecture in one place.</p>
                        </div>
                        <button onClick={() => navigate('/studio/demo')} className="px-6 py-2 bg-[#58a6ff] text-white rounded-lg font-bold hover:bg-[#4493f8] transition flex items-center gap-2 shadow-lg shadow-purple-900/20">
                            <Code size={18} /> Open Full Studio
                        </button>
                    </div>
                )}

                <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-6 h-[750px]">
                    <motion.div initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} className="lg:col-span-5 bg-[#161b22] border border-[#30363d] rounded-xl flex flex-col shadow-xl overflow-hidden group focus-within:border-[#58a6ff]/50 transition-colors">
                        <div className="h-12 border-b border-[#30363d] bg-[#0d1117]/50 flex items-center justify-between px-4">
                            <div className="flex items-center gap-2 text-[#8b949e] text-xs font-mono">
                                <FileText size={14} />
                                <span>requirements.md</span>
                            </div>
                            <div className="flex gap-2">
                                {loadingInsights && <span className="flex items-center gap-1 text-[#58a6ff] text-[10px] animate-pulse"><Sparkles size={10} /> Syncing AI...</span>}
                                {activeDocumentUrl && <a href={activeDocumentUrl} className="flex items-center gap-1 text-[#238636] text-xs font-bold hover:underline" target="_blank" rel="noopener noreferrer"><Download size={12} /> View Report</a>}
                            </div>
                        </div>
                        <textarea value={content} onChange={(e) => setContent(e.target.value)} className="flex-1 bg-transparent text-[#c9d1d9] font-mono text-sm leading-relaxed outline-none resize-none p-6 selection:bg-[#58a6ff] selection:text-white" spellCheck="false" placeholder="Start typing your system requirements..." />
                    </motion.div>

                    <div className="lg:col-span-7 flex flex-col gap-4">
                        <div className="flex flex-wrap gap-2 bg-[#161b22] border border-[#30363d] rounded-lg p-1 w-fit">
                            {[
                                { id: 'insights', icon: BrainCircuit, label: 'Insights' },
                                { id: 'chat', icon: MessageSquare, label: 'Chat' },
                                { id: 'diagram', icon: Workflow, label: 'Visualizer' },
                                { id: 'workflow', icon: Zap, label: 'Workflow' },
                                { id: 'feedback', icon: MessageSquare, label: 'Feedback' },
                            ].map(tab => (
                                <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all flex items-center gap-2 ${activeTab === tab.id ? 'bg-[#21262d] text-white shadow-sm' : 'text-[#8b949e] hover:text-[#c9d1d9]'}`}>
                                    <tab.icon size={14} /> {tab.label}
                                </button>
                            ))}
                        </div>

                        <motion.div layout className="flex-1 bg-[#161b22] border border-[#30363d] rounded-xl relative overflow-hidden shadow-xl">
                            {activeTab === 'insights' && (
                                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="h-full p-6 overflow-y-auto scrollbar-thin scrollbar-thumb-[#30363d]">
                                    <h3 className="text-[#58a6ff] text-xs font-bold uppercase tracking-wider mb-4 flex items-center gap-2"><Sparkles size={14} /> Real-time Analysis</h3>
                                    <div className="space-y-3">
                                        <AnimatePresence>
                                            {insights.length === 0 && !loadingInsights && <div className="text-center mt-20 text-[#8b949e]"><BrainCircuit size={48} className="mx-auto mb-4 opacity-20" /><p>Type in the editor to generate insights.</p></div>}
                                            {insights.map((item, index) => (
                                                <motion.div key={index} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="p-4 bg-[#0d1117] border border-[#30363d] rounded-xl hover:border-[#58a6ff]/50 transition-colors group">
                                                    <div className="flex justify-between items-start mb-2">
                                                        <h4 className="text-white font-medium text-sm group-hover:text-[#58a6ff] transition-colors">{item.title}</h4>
                                                        <span className="text-[10px] px-2 py-0.5 rounded-full border border-[#30363d] bg-[#161b22] text-[#8b949e]">{item.type}</span>
                                                    </div>
                                                    <p className="text-xs text-[#8b949e] leading-relaxed">{item.desc}</p>
                                                </motion.div>
                                            ))}
                                        </AnimatePresence>
                                    </div>
                                </motion.div>
                            )}

                            {activeTab === 'workflow' && (
                                <div className="h-full p-6 flex flex-col">
                                    <div className="mb-6">
                                        <h3 className="text-[#58a6ff] text-xs font-bold uppercase tracking-wider mb-4 flex items-center gap-2"><Zap size={14} /> Automated Review Loop</h3>
                                        <p className="text-sm text-[#8b949e] mb-4">Send this document for client review using the internal workflow service.</p>
                                        <div className="mb-4 flex flex-wrap items-center gap-2">
                                            <span className="text-[11px] px-2 py-1 rounded-md border border-[#30363d] bg-[#0d1117] text-[#8b949e]">
                                                HQ: {hq?.status || 'IDLE'}
                                            </span>
                                            {(hq?.status === 'BUILDING') && (
                                                <button onClick={checkHqStatus} className="text-[11px] px-2 py-1 rounded-md border border-[#58a6ff]/40 text-[#79c0ff] hover:bg-[#58a6ff]/10 transition flex items-center gap-1">
                                                    <RefreshCw size={11} /> Check HQ
                                                </button>
                                            )}
                                            {(hq?.status === 'APPLIED' || hq?.status === 'READY') && (
                                                <span className="text-[11px] px-2 py-1 rounded-md border border-[#238636]/50 text-[#3fb950] bg-[#238636]/10">
                                                    HQ ready. Latest DOCX applied.
                                                </span>
                                            )}
                                            {hq?.message && (
                                                <span className="text-[11px] text-[#8b949e]">{hq.message}</span>
                                            )}
                                        </div>
                                        {activeDocumentUrl && <div className="mb-4 bg-[#0d1117] border border-[#30363d] rounded-lg p-3 text-xs text-[#8b949e] flex items-center justify-between"><span>Attached DOCX: {activeDocumentUrl}</span><a href={activeDocumentUrl} target="_blank" rel="noreferrer" className="text-[#79c0ff] hover:underline">Open</a></div>}
                                        <div className="flex gap-2">
                                            <div className="relative flex-1">
                                                <Mail className="absolute left-3 top-2.5 text-[#8b949e]" size={16} />
                                                <input type="email" placeholder="client@example.com" value={clientEmail} onChange={(e) => setClientEmail(e.target.value)} className="w-full bg-[#0d1117] border border-[#30363d] rounded-lg pl-10 pr-4 py-2 text-sm text-white focus:border-[#58a6ff] outline-none" />
                                            </div>
                                            <button onClick={handleSendReview} disabled={workflowLoading} className="px-4 py-2 rounded-lg font-bold text-sm flex items-center gap-2 transition bg-[#238636] text-white hover:bg-[#2ea043] shadow-lg shadow-green-900/20 disabled:bg-[#161b22] disabled:border-[#30363d] disabled:text-[#8b949e] disabled:cursor-not-allowed">
                                                {workflowLoading ? <div className="animate-spin w-4 h-4 border-2 border-white/30 border-t-white rounded-full"></div> : <Send size={16} />}Send Review
                                            </button>
                                        </div>
                                        {status === 'CHANGES_REQUESTED' && (
                                            <div className="mt-3 flex flex-wrap gap-2">
                                                <button onClick={handleUpdateAndRegenerate} className="px-4 py-2 rounded-lg font-bold text-xs flex items-center gap-2 transition bg-[#21262d] border border-[#30363d] text-[#c9d1d9] hover:bg-[#30363d]">
                                                    <Settings size={14} /> Open Form Wizard
                                                </button>
                                                <button onClick={handleFastTrackRegeneration} disabled={workflowLoading} className="px-4 py-2 rounded-lg font-bold text-xs flex items-center gap-2 transition bg-cyan-900/20 border border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/10">
                                                    {workflowLoading ? <RefreshCw size={14} className="animate-spin" /> : <Zap size={14} />}Apply Feedback & Auto-Regenerate
                                                </button>
                                            </div>
                                        )}
                                        {workflowError && <div className="mt-3 text-xs text-[#ff7b72]">{workflowError}</div>}
                                        {workflowMessage && <div className="mt-3 text-xs text-[#79c0ff]">{workflowMessage}</div>}
                                    </div>

                                    <div className="flex-1 border border-[#30363d] bg-[#0d1117] rounded-xl p-4 overflow-y-auto">
                                        <div className="relative pl-4 space-y-6 before:absolute before:left-[5px] before:top-2 before:bottom-2 before:w-[2px] before:bg-[#30363d]">
                                            <div className="relative">
                                                <div className="absolute -left-[21px] top-1 w-3 h-3 rounded-full bg-[#238636] border border-[#0d1117]"></div>
                                                <h4 className="text-sm font-bold text-white">Project Created</h4>
                                                <p className="text-xs text-[#8b949e]">Draft initialized.</p>
                                            </div>
                                            {workflowTimeline.map((event, idx) => (
                                                <motion.div key={`${event.title}-${idx}`} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className="relative">
                                                    <div className={`absolute -left-[21px] top-1 w-3 h-3 rounded-full border border-[#0d1117] ${event.status === 'APPROVED' ? 'bg-[#238636]' : event.status === 'CHANGES_REQUESTED' ? 'bg-[#ff7b72]' : 'bg-[#58a6ff]'}`}></div>
                                                    <h4 className="text-sm font-bold text-white">{event.title}</h4>
                                                    <p className="text-xs text-[#8b949e]">{event.description}</p>
                                                </motion.div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {activeTab === 'feedback' && (
                                <div className="h-full p-6">
                                    <h3 className="text-[#58a6ff] text-xs font-bold uppercase tracking-wider mb-4 flex items-center gap-2"><MessageSquare size={14} /> Client Comments</h3>
                                    {status === 'CHANGES_REQUESTED' && (
                                        <div className="mb-4 flex gap-2">
                                            <button onClick={handleUpdateAndRegenerate} className="px-4 py-2 rounded-lg font-bold text-sm flex items-center gap-2 transition bg-[#21262d] border border-[#30363d] text-[#c9d1d9] hover:bg-[#30363d]">Update & Regenerate</button>
                                        </div>
                                    )}
                                    <div className="space-y-4">
                                        {feedback.length === 0 ? (
                                            <div className="text-center mt-20 text-[#8b949e]"><div className="w-16 h-16 bg-[#161b22] rounded-full flex items-center justify-center mx-auto mb-4 border border-[#30363d]"><CheckCircle size={24} className="text-[#238636]" /></div><p>No issues reported yet.</p></div>
                                        ) : (
                                            feedback.map((fb, i) => (
                                                <div key={i} className="bg-[#161b22] border border-[#ff7b72]/30 p-4 rounded-xl">
                                                    <div className="flex justify-between items-center mb-2">
                                                        <span className="text-[#ff7b72] text-xs font-bold flex items-center gap-2"><AlertCircle size={12} /> {fb.source}</span>
                                                        <span className="text-[#8b949e] text-[10px]">{new Date(fb.date).toLocaleDateString()}</span>
                                                    </div>
                                                    <p className="text-sm text-[#c9d1d9]">{fb.comment}</p>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </div>
                            )}

                            {activeTab === 'chat' && (
                                <div className="h-full flex flex-col">
                                    <div className="border-b border-[#30363d] bg-[#0d1117]/50 px-4 py-3 flex flex-col gap-3">
                                        <div className="flex flex-wrap items-center gap-2">
                                            <button onClick={refreshChatDiagramStatus} className={`text-xs px-2 py-0.5 rounded border flex items-center gap-1 transition-colors ${chatDiagramEnabled ? 'border-[#3fb950] text-[#3fb950]' : 'border-[#30363d] text-[#8b949e]'} ${chatDiagramStatusLoading ? 'opacity-70' : 'hover:border-[#3fb950] hover:text-[#3fb950]'}`} disabled={chatDiagramStatusLoading}><RefreshCw size={12} className={chatDiagramStatusLoading ? 'animate-spin' : ''} />{chatDiagramEnabled ? 'Diagram On' : 'Diagram Off'}</button>
                                            <button onClick={refreshChatPhotoStatus} className={`text-xs px-2 py-0.5 rounded border flex items-center gap-1 transition-colors ${chatPhotoEnabled ? 'border-[#3fb950] text-[#3fb950]' : 'border-[#30363d] text-[#8b949e]'} ${chatPhotoStatusLoading ? 'opacity-70' : 'hover:border-[#3fb950] hover:text-[#3fb950]'}`} disabled={chatPhotoStatusLoading}><RefreshCw size={12} className={chatPhotoStatusLoading ? 'animate-spin' : ''} />{chatPhotoEnabled ? 'Image On' : 'Image Off'}</button>
                                            <button onClick={() => setChatMode((prev) => (prev === "image" ? "text" : "image"))} className={`text-xs px-2 py-0.5 rounded border flex items-center gap-1 transition-colors ${chatMode === 'image' ? 'border-[#3fb950] text-[#3fb950]' : 'border-[#30363d] text-[#8b949e]'}`}><ImageIcon size={12} />{chatMode === 'image' ? 'Image Mode' : 'Text Mode'}</button>
                                            <div className="flex items-center gap-1">
                                                <button onClick={() => setChatImageType("diagram")} className={`text-xs px-2 py-0.5 rounded border transition ${chatImageType === 'diagram' ? 'border-[#3fb950] text-[#3fb950]' : 'border-[#30363d] text-[#8b949e]'}`} disabled={!chatDiagramEnabled}>Diagram</button>
                                                <button onClick={() => setChatImageType("photo")} className={`text-xs px-2 py-0.5 rounded border transition ${chatImageType === 'photo' ? 'border-[#3fb950] text-[#3fb950]' : 'border-[#30363d] text-[#8b949e]'}`} disabled={!chatPhotoEnabled}>Image</button>
                                            </div>
                                        </div>
                                        <div className="flex flex-wrap gap-2">
                                            {imagePresets.map((preset) => (
                                                <button key={preset.id} onClick={() => handleGenerateChatImage(buildImagePromptFromNotes(preset.id), "diagram")} disabled={!chatDiagramEnabled || chatImageLoading} className="px-3 py-1.5 text-xs rounded-lg border border-[#30363d] bg-[#0d1117] text-[#8b949e] hover:text-[#3fb950] hover:border-[#3fb950] transition disabled:opacity-50">{preset.label}</button>
                                            ))}
                                        </div>
                                    </div>
                                    <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin scrollbar-thumb-[#30363d]">
                                        {chatMessages.map((msg, i) => (
                                            <div key={i} className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                                                <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${msg.role === 'ai' ? 'bg-[#58a6ff]/10 text-[#58a6ff]' : 'bg-[#79c0ff]/10 text-[#79c0ff]'}`}>{msg.role === 'ai' ? <Bot size={14} /> : <User size={14} />}</div>
                                                <div className={`p-3 rounded-xl max-w-[85%] text-sm ${msg.role === 'ai' ? 'bg-[#21262d] text-[#c9d1d9]' : 'bg-[#1f6feb] text-white'}`}>
                                                    {msg.type === 'image' ? (
                                                        <div className="space-y-2">
                                                            <img src={msg.imageUrl} alt={msg.text} className="rounded-lg border border-[#30363d]" />
                                                            {msg.imageType === 'diagram' && (
                                                                <div className="flex gap-2">
                                                                    <button onClick={() => downloadImage(msg.imageUrl, 'studio-diagram.png')} className="px-2 py-1 text-xs rounded border border-[#30363d] text-[#8b949e] hover:text-[#c9d1d9] hover:border-[#c9d1d9] transition">Download Diagram</button>
                                                                    <button onClick={appendLastDiagramToSrs} className="px-2 py-1 text-xs rounded border border-[#58a6ff] text-[#58a6ff] hover:bg-[#58a6ff]/10 transition">Add to SRS</button>
                                                                </div>
                                                            )}
                                                            <div className="text-xs text-[#8b949e]">{msg.text}</div>
                                                        </div>
                                                    ) : msg.text}
                                                </div>
                                            </div>
                                        ))}
                                        {(chatLoading || chatImageLoading) && (
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
                                    <div className="p-4 border-t border-[#30363d] bg-[#0d1117]">
                                        <div className="relative">
                                            <input type="text" className="w-full bg-[#161b22] border border-[#30363d] rounded-lg pl-4 pr-10 py-3 text-sm text-white focus:border-[#58a6ff] outline-none transition-colors" placeholder={chatMode === 'image' ? "Describe the image to generate..." : "Ask about your notes or type /diagram or /image prompt"} value={chatInput} onChange={(e) => setChatInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()} />
                                            <button onClick={handleSendMessage} className="absolute right-2 top-2.5 p-1.5 text-[#58a6ff] hover:bg-[#58a6ff]/10 rounded-md transition"><Send size={16} /></button>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {activeTab === 'diagram' && (
                                <div className="h-full relative bg-[#010409]">
                                    <div className="absolute top-4 right-4 z-50 flex items-center gap-2">
                                        <button onClick={generateDiagram} disabled={loadingDiagram} className="px-3 py-1.5 bg-[#238636] text-white text-xs font-bold rounded shadow-lg hover:bg-[#2ea043] disabled:opacity-50 flex items-center gap-2">{loadingDiagram ? <div className="w-3 h-3 rounded-full border-2 border-white/30 border-t-white animate-spin"></div> : <Workflow size={14} />}{loadingDiagram ? 'Generating...' : 'Generate New Diagram'}</button>
                                        <button onClick={handleDownloadDiagramImage} disabled={diagramImageLoading} className="px-3 py-1.5 bg-[#21262d] text-white text-xs font-bold rounded shadow-lg hover:bg-[#30363d] disabled:opacity-50 flex items-center gap-2">{diagramImageLoading ? <div className="w-3 h-3 rounded-full border-2 border-white/30 border-t-white animate-spin"></div> : <Download size={14} />}Download Image</button>
                                        <button onClick={handleAppendDiagramToDoc} disabled={diagramImageLoading} className="px-3 py-1.5 bg-[#58a6ff] text-white text-xs font-bold rounded shadow-lg hover:bg-[#4493f8] disabled:opacity-50 flex items-center gap-2">{diagramImageLoading ? <div className="w-3 h-3 rounded-full border-2 border-white/30 border-t-white animate-spin"></div> : <Share2 size={14} />}Add to SRS</button>
                                    </div>
                                    {diagramImageError && <div className="absolute top-16 right-4 z-50 text-xs text-[#ff7b72] bg-[#0d1117] border border-[#30363d] rounded px-3 py-2">{diagramImageError}</div>}
                                    {nodes.length === 0 && !loadingDiagram && <div className="absolute inset-0 flex flex-col items-center justify-center text-[#8b949e] z-40 pointer-events-none"><Workflow size={48} className="mb-4 opacity-50" /><p className="text-sm">Click "Generate New Diagram" to visualize your notes.</p></div>}
                                    <div className="h-full w-full">
                                        <ReactFlow nodes={nodes} edges={edges} onNodesChange={onNodesChange} onEdgesChange={onEdgesChange} fitView proOptions={{ hideAttribution: true }}>
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
