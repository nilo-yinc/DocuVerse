import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Bot, User, Send, GraduationCap, Maximize2, Minimize2, Image as ImageIcon, Paperclip, RefreshCw } from 'lucide-react';
import axios from 'axios';
import { CardContainer, CardBody, CardItem, CardSpotlight } from '../ui/Card3D';

const AITutorFeature = () => {
    const [messages, setMessages] = useState([
        { role: 'ai', text: "Hello! I'm your Engineering Tutor. I can explain complex diagrams, review your requirements, or help you study for system design interviews. What shall we tackle?" }
    ]);

    const [inputText, setInputText] = useState("");
    const [isTyping, setIsTyping] = useState(false);
    const [error, setError] = useState("");
    const [expanded, setExpanded] = useState(false);
    const [imageLoading, setImageLoading] = useState(false);
    const [diagramEnabled, setDiagramEnabled] = useState(false);
    const [diagramReason, setDiagramReason] = useState("");
    const [diagramStatusLoading, setDiagramStatusLoading] = useState(false);
    const [photoEnabled, setPhotoEnabled] = useState(false);
    const [photoReason, setPhotoReason] = useState("");
    const [photoStatusLoading, setPhotoStatusLoading] = useState(false);
    const [mode, setMode] = useState("text"); // text | image
    const [imageType, setImageType] = useState("diagram"); // diagram | photo
    const fileInputRef = useRef(null);

    const baseContext = "System design tutor for software engineering topics. Provide concise, structured answers.";

    const demoQuestions = [
        "Explain the difference between SQL and NoSQL",
        "How does a Load Balancer work?",
        "Critique my ER Diagram"
    ];

    const imagePresets = [
        { id: 'arch', label: 'System Architecture' },
        { id: 'er', label: 'ER Diagram' },
        { id: 'seq', label: 'Sequence Flow' },
        { id: 'userflow', label: 'User Flow' }
    ];

    const lastUserTopic = () => {
        const last = [...messages].reverse().find((m) => m.role === 'user' && !String(m.text || '').toLowerCase().startsWith('generate image'));
        return last?.text || 'your software system';
    };

    const buildImagePrompt = (preset) => {
        const topic = lastUserTopic();
        const base = "Create a clean, professional, blueprint-style diagram image. Use vector shapes, high contrast, minimal text (1-2 word labels), no paragraphs, no tiny text.";
        if (preset === 'arch') {
            return `${base} Title: System Architecture. Context: ${topic}. Show 5-7 labeled components with clear connections and spacing. Dark theme, thin lines.`;
        }
        if (preset === 'er') {
            return `${base} Title: Entity-Relationship Diagram. Context: ${topic}. Show 5-7 entities with short attribute lists and relationships. Dark theme, thin lines.`;
        }
        if (preset === 'seq') {
            return `${base} Title: Sequence Flow. Context: ${topic}. Show 5-7 actors/services with arrows for interactions. Dark theme, thin lines.`;
        }
        if (preset === 'userflow') {
            return `${base} Title: User Flow. Context: ${topic}. Show 5-7 steps with arrows. Dark theme, thin lines.`;
        }
        return `${base} Context: ${topic}.`;
    };

    const refreshDiagramStatus = async () => {
        setDiagramStatusLoading(true);
        try {
            const res = await axios.get('/api/notebook/diagram-image/status');
            setDiagramEnabled(Boolean(res.data?.enabled));
            setDiagramReason(res.data?.reason || "");
            return Boolean(res.data?.enabled);
        } catch {
            setDiagramEnabled(false);
            setDiagramReason("Status check failed");
            return false;
        } finally {
            setDiagramStatusLoading(false);
        }
    };

    const refreshPhotoStatus = async () => {
        setPhotoStatusLoading(true);
        try {
            const res = await axios.get('/api/notebook/image/status');
            setPhotoEnabled(Boolean(res.data?.enabled));
            setPhotoReason(res.data?.reason || "");
            return Boolean(res.data?.enabled);
        } catch {
            setPhotoEnabled(false);
            setPhotoReason("Status check failed");
            return false;
        } finally {
            setPhotoStatusLoading(false);
        }
    };

    useEffect(() => {
        refreshDiagramStatus();
        refreshPhotoStatus();
    }, []);

    const handleSend = async (text) => {
        if (!text) return;
        if (text.trim().toLowerCase().startsWith('/image ')) {
            const prompt = text.trim().slice(7);
            await handleGenerateImage(prompt, "photo");
            setInputText("");
            return;
        }
        if (text.trim().toLowerCase().startsWith('/diagram ')) {
            const prompt = text.trim().slice(9);
            await handleGenerateImage(prompt, "diagram");
            setInputText("");
            return;
        }
        if (mode === "image") {
            await handleGenerateImage(text, imageType);
            setInputText("");
            return;
        }
        setError("");
        setMessages(prev => [...prev, { role: 'user', text }]);
        setInputText("");
        setIsTyping(true);

        try {
            const res = await axios.post('/api/notebook/chat', {
                content: baseContext,
                query: text,
                history: messages
            });
            setMessages(prev => [...prev, { role: 'ai', text: res.data.answer || "I couldn't generate a response." }]);
        } catch (err) {
            setError("Chat failed. Check backend connection.");
            setMessages(prev => [...prev, { role: 'ai', text: "I couldn't reach the tutor service. Please try again." }]);
        } finally {
            setIsTyping(false);
        }
    };

    const handleGenerateImage = async (text, typeOverride) => {
        if (!text) return;
        const type = typeOverride || imageType;
        const enabled = type === "diagram"
            ? (diagramEnabled || (await refreshDiagramStatus()))
            : (photoEnabled || (await refreshPhotoStatus()));
        if (!enabled) {
            const reason = type === "diagram"
                ? (diagramReason || 'Diagram generation is disabled.')
                : (photoReason || 'Image generation is disabled.');
            setError(reason);
            setMessages(prev => [...prev, { role: 'ai', text: `Image generation is off. ${reason}` }]);
            return;
        }
        setError("");
        setImageLoading(true);
        setMessages(prev => [...prev, { role: 'user', text: `Generate image: ${text}` }]);
        try {
            const endpoint = type === "diagram" ? '/api/notebook/diagram-image' : '/api/notebook/image';
            const res = await axios.post(endpoint, { prompt: text });
            if (res.data?.image) {
                setMessages(prev => [...prev, { role: 'ai', type: 'image', imageUrl: res.data.image, text }]);
            } else {
                setMessages(prev => [...prev, { role: 'ai', text: "No image returned. Try a different prompt." }]);
            }
        } catch (err) {
            const msg = err.response?.data?.detail || "Image generation failed. Check backend connection.";
            setError(msg);
            setMessages(prev => [...prev, { role: 'ai', text: "I couldn't generate an image. Please try again." }]);
        } finally {
            setImageLoading(false);
        }
    };

    const handleAttachClick = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = (event) => {
        const file = event.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = () => {
            const imageUrl = reader.result?.toString();
            setMessages(prev => [...prev, { role: 'user', type: 'attachment', imageUrl, text: file.name }]);
        };
        reader.readAsDataURL(file);
    };

    return (
        <section className="py-24 bg-transparent relative overflow-hidden z-10">

            <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-5 gap-12 items-center">

                {/* Left: Content */}
                <div className="lg:col-span-2 space-y-6">
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#1f2937] border border-[#30363d] text-[#c9d1d9] text-xs font-medium"
                    >
                        <GraduationCap size={14} className="text-[#3fb950]" />
                        <span>24/7 Study Partner</span>
                    </motion.div>

                    <h2 className="text-4xl font-bold text-white">
                        Stuck on a Concept?<br />
                        <span className="text-[#3fb950]">Just Ask.</span>
                    </h2>
                    <p className="text-[#8b949e] text-lg leading-relaxed">
                        Our AI Tutor understands your project context. Ask it to explain specific diagrams in your document, convert requirements to code, or quiz you on the material.
                    </p>

                    <div className="space-y-4 pt-4">
                        <div className="text-xs font-bold text-[#8b949e] uppercase tracking-wider">Try asking:</div>
                        <div className="grid grid-cols-1 gap-4">
                            {demoQuestions.map((q, i) => (
                                <CardContainer key={i} containerClassName="py-0" className="w-full">
                                    <CardBody className="w-full">
                                        <CardItem translateZ="30" className="w-full">
                                            <CardSpotlight
                                                className="cursor-pointer p-3"
                                                radius={150}
                                                onClick={() => handleSend(q)}
                                            >
                                                <span className="text-[#c9d1d9] hover:text-[#3fb950] text-sm transition-colors relative z-20">"{q}"</span>
                                            </CardSpotlight>
                                        </CardItem>
                                    </CardBody>
                                </CardContainer>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Right: Chat Interface */}
                <div className={`lg:col-span-3 relative ${expanded ? 'lg:col-span-5' : ''}`}>
                    {/* Decorative Elements */}
                    <div className="absolute -top-10 -right-10 w-64 h-64 bg-[#3fb950]/10 blur-[80px] rounded-full pointer-events-none"></div>

                    <CardContainer containerClassName="py-0" className="w-full h-full inter-var">
                        <CardBody className="w-full h-full relative">
                            <CardItem translateZ="50" className="w-full h-full">
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    whileInView={{ opacity: 1, scale: 1 }}
                                    viewport={{ once: true }}
                                    className={`bg-[#0d1117] border border-[#30363d] rounded-2xl shadow-2xl relative z-10 overflow-hidden flex flex-col ${expanded ? 'h-[70vh]' : 'h-[500px]'
                                        }`}
                                >
                                    {/* Header */}
                                    <div className="h-14 border-b border-[#30363d] bg-[#161b22] flex items-center justify-between px-6">
                                        <div className="flex items-center gap-3">
                                            <div className="w-2 h-2 rounded-full bg-[#3fb950] animate-pulse"></div>
                                            <span className="font-bold text-white text-sm">AutoSRS Tutor</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className="text-xs text-[#8b949e] border border-[#30363d] px-2 py-0.5 rounded">Tutor</span>
                                            <button
                                                onClick={refreshDiagramStatus}
                                                className={`text-xs px-2 py-0.5 rounded border flex items-center gap-1 transition-colors ${diagramEnabled ? 'border-[#3fb950] text-[#3fb950]' : 'border-[#30363d] text-[#8b949e]'} ${diagramStatusLoading ? 'opacity-70' : 'hover:border-[#3fb950] hover:text-[#3fb950]'}`}
                                                title={diagramEnabled ? 'Diagram enabled. Click to refresh.' : `Diagram disabled: ${diagramReason || 'Unknown reason'}`}
                                                disabled={diagramStatusLoading}
                                            >
                                                <RefreshCw size={12} className={diagramStatusLoading ? 'animate-spin' : ''} />
                                                {diagramEnabled ? 'Diagram On' : 'Diagram Off'}
                                            </button>
                                            <button
                                                onClick={refreshPhotoStatus}
                                                className={`text-xs px-2 py-0.5 rounded border flex items-center gap-1 transition-colors ${photoEnabled ? 'border-[#3fb950] text-[#3fb950]' : 'border-[#30363d] text-[#8b949e]'} ${photoStatusLoading ? 'opacity-70' : 'hover:border-[#3fb950] hover:text-[#3fb950]'}`}
                                                title={photoEnabled ? 'Image enabled. Click to refresh.' : `Image disabled: ${photoReason || 'Unknown reason'}`}
                                                disabled={photoStatusLoading}
                                            >
                                                <RefreshCw size={12} className={photoStatusLoading ? 'animate-spin' : ''} />
                                                {photoEnabled ? 'Image On' : 'Image Off'}
                                            </button>
                                            <button
                                                onClick={() => setExpanded((prev) => !prev)}
                                                className="text-[#8b949e] hover:text-white transition"
                                                title={expanded ? 'Minimize' : 'Maximize'}
                                            >
                                                {expanded ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
                                            </button>
                                        </div>
                                    </div>

                                    {/* Messages */}
                                    <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-[#0d1117]">
                                        {messages.map((msg, index) => (
                                            <motion.div
                                                key={index}
                                                initial={{ opacity: 0, y: 10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                className={`flex gap-4 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
                                            >
                                                <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 
                                         ${msg.role === 'ai' ? 'bg-[#3fb950]/10 text-[#3fb950]' : 'bg-[#1f6feb]/10 text-[#1f6feb]'}`}>
                                                    {msg.role === 'ai' ? <Bot size={16} /> : <User size={16} />}
                                                </div>
                                                <div className={`p-4 rounded-2xl max-w-[80%] text-sm leading-relaxed 
                                         ${msg.role === 'ai' ? 'bg-[#161b22] text-[#c9d1d9] rounded-tl-none' : 'bg-[#1f6feb] text-white rounded-tr-none'}`}>
                                                    {msg.type === 'image' || msg.type === 'attachment' ? (
                                                        <div className="space-y-2">
                                                            <img src={msg.imageUrl} alt={msg.text} className="rounded-lg border border-[#30363d]" />
                                                            <div className="text-xs text-[#8b949e]">{msg.text}</div>
                                                        </div>
                                                    ) : (
                                                        msg.text
                                                    )}
                                                </div>
                                            </motion.div>
                                        ))}
                                        {isTyping && (
                                            <div className="flex gap-4">
                                                <div className="w-8 h-8 rounded-full bg-[#3fb950]/10 text-[#3fb950] flex items-center justify-center shrink-0">
                                                    <Bot size={16} />
                                                </div>
                                                <div className="bg-[#161b22] p-4 rounded-2xl rounded-tl-none flex gap-1">
                                                    <div className="w-2 h-2 bg-[#8b949e] rounded-full animate-bounce"></div>
                                                    <div className="w-2 h-2 bg-[#8b949e] rounded-full animate-bounce delay-100"></div>
                                                    <div className="w-2 h-2 bg-[#8b949e] rounded-full animate-bounce delay-200"></div>
                                                </div>
                                            </div>
                                        )}
                                        {error && (
                                            <div className="text-xs text-[#ff7b72]">{error}</div>
                                        )}
                                    </div>

                                    {/* Input Area */}
                                    <div className="p-4 bg-[#161b22] border-t border-[#30363d] space-y-3">
                                        <div className="flex flex-wrap gap-2">
                                            {imagePresets.map((preset) => (
                                                <button
                                                    key={preset.id}
                                                    onClick={() => handleGenerateImage(buildImagePrompt(preset.id), "diagram")}
                                                    disabled={!diagramEnabled || imageLoading}
                                                    className="px-3 py-1.5 text-xs rounded-lg border border-[#30363d] bg-[#0d1117] text-[#8b949e] hover:text-[#3fb950] hover:border-[#3fb950] transition disabled:opacity-50"
                                                    title={diagramEnabled ? `Generate ${preset.label}` : `Diagram disabled: ${diagramReason}`}
                                                >
                                                    {preset.label}
                                                </button>
                                            ))}
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className="text-xs text-[#8b949e]">Mode:</span>
                                            <button
                                                onClick={() => setImageType("diagram")}
                                                className={`px-3 py-1 text-xs rounded-lg border transition ${imageType === 'diagram' ? 'border-[#3fb950] text-[#3fb950]' : 'border-[#30363d] text-[#8b949e] hover:text-[#c9d1d9]'}`}
                                                disabled={!diagramEnabled}
                                                title={diagramEnabled ? 'Use diagram generation' : `Diagram disabled: ${diagramReason}`}
                                            >
                                                Diagram
                                            </button>
                                            <button
                                                onClick={() => setImageType("photo")}
                                                className={`px-3 py-1 text-xs rounded-lg border transition ${imageType === 'photo' ? 'border-[#3fb950] text-[#3fb950]' : 'border-[#30363d] text-[#8b949e] hover:text-[#c9d1d9]'}`}
                                                disabled={!photoEnabled}
                                                title={photoEnabled ? 'Use image generation' : `Image disabled: ${photoReason}`}
                                            >
                                                Image
                                            </button>
                                        </div>
                                        <div className="relative">
                                            <input
                                                type="text"
                                                placeholder={mode === "image"
                                                    ? (imageType === "diagram" ? "Describe the diagram to generate..." : "Describe the image to generate...")
                                                    : "Ask or type /diagram or /image prompt"}
                                                value={inputText}
                                                onChange={(e) => setInputText(e.target.value)}
                                                onKeyDown={(e) => e.key === 'Enter' && handleSend(inputText)}
                                                className="w-full bg-[#0d1117] border border-[#30363d] rounded-xl px-4 py-3 pr-32 text-sm text-white focus:border-[#3fb950] focus:ring-1 focus:ring-[#3fb950] outline-none transition-all"
                                            />
                                            <button
                                                onClick={() => handleSend(inputText)}
                                                className="absolute right-2 top-2 p-1.5 bg-[#3fb950] hover:bg-[#2ea043] rounded-lg text-white transition-colors"
                                            >
                                                <Send size={16} />
                                            </button>
                                            <button
                                                onClick={() => setMode((prev) => (prev === "image" ? "text" : "image"))}
                                                className={`absolute right-11 top-2 p-1.5 border rounded-lg transition-colors ${mode === "image" ? 'bg-[#3fb950] text-white border-[#3fb950]' : 'bg-[#161b22] border-[#30363d] text-[#c9d1d9]'} ${mode === "image" && imageType === "diagram" && !diagramEnabled ? 'opacity-50 cursor-not-allowed' : ''} ${mode === "image" && imageType === "photo" && !photoEnabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                                                title={mode === "image" ? 'Toggle image mode' : 'Toggle image mode'}
                                                disabled={mode === "image" && ((imageType === "diagram" && !diagramEnabled) || (imageType === "photo" && !photoEnabled))}
                                            >
                                                <ImageIcon size={16} />
                                            </button>
                                            <button
                                                onClick={handleAttachClick}
                                                className="absolute right-20 top-2 p-1.5 bg-[#161b22] border border-[#30363d] hover:bg-[#21262d] rounded-lg text-[#c9d1d9] transition-colors"
                                                title="Attach image"
                                            >
                                                <Paperclip size={16} />
                                            </button>
                                            <input
                                                ref={fileInputRef}
                                                type="file"
                                                accept="image/*"
                                                className="hidden"
                                                onChange={handleFileChange}
                                            />
                                        </div>
                                    </div>
                                </motion.div>
                            </CardItem>
                        </CardBody>
                    </CardContainer>
                </div>
            </div>
        </section>
    );
};

export default AITutorFeature;
