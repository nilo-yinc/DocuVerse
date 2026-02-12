import { useCallback, useMemo, useRef, useState } from 'react';
import ReactFlow, {
    Background,
    Controls,
    MiniMap,
    addEdge,
    useEdgesState,
    useNodesState,
    MarkerType
} from 'reactflow';
import 'reactflow/dist/style.css';
import { toSvg } from 'html-to-image';
import {
    Wand2,
    Sparkles,
    Layers,
    Download,
    Trash2,
    Play,
    PanelRightOpen,
    PanelRightClose,
    Cpu,
    Network,
    Database
} from 'lucide-react';

const initialNodes = [
    {
        id: '1',
        type: 'default',
        position: { x: 120, y: 120 },
        data: { label: 'Mobile App' },
        style: { background: '#12161b', color: '#f5f1e8', border: '1px solid #2b3137', borderRadius: 16, padding: 14 }
    },
    {
        id: '2',
        type: 'default',
        position: { x: 430, y: 110 },
        data: { label: 'API Gateway' },
        style: { background: '#12161b', color: '#f5f1e8', border: '1px solid #2b3137', borderRadius: 16, padding: 14 }
    },
    {
        id: '3',
        type: 'default',
        position: { x: 430, y: 300 },
        data: { label: 'Auth Service' },
        style: { background: '#12161b', color: '#f5f1e8', border: '1px solid #2b3137', borderRadius: 16, padding: 14 }
    },
    {
        id: '4',
        type: 'default',
        position: { x: 700, y: 300 },
        data: { label: 'User DB' },
        style: { background: '#12161b', color: '#f5f1e8', border: '1px solid #2b3137', borderRadius: 16, padding: 14 }
    }
];

const initialEdges = [
    {
        id: 'e1-2',
        source: '1',
        target: '2',
        type: 'smoothstep',
        markerEnd: { type: MarkerType.ArrowClosed, color: '#3a7ca5' },
        style: { stroke: '#3a7ca5' }
    },
    {
        id: 'e2-3',
        source: '2',
        target: '3',
        type: 'smoothstep',
        markerEnd: { type: MarkerType.ArrowClosed, color: '#3a7ca5' },
        style: { stroke: '#3a7ca5' }
    },
    {
        id: 'e3-4',
        source: '3',
        target: '4',
        type: 'smoothstep',
        markerEnd: { type: MarkerType.ArrowClosed, color: '#3a7ca5' },
        style: { stroke: '#3a7ca5' }
    }
];

const SystemDesignPlayground = () => {
    const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
    const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
    const [prompt, setPrompt] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [history, setHistory] = useState([]);
    const [panelOpen, setPanelOpen] = useState(true);
    const canvasRef = useRef(null);

    const onConnect = useCallback(
        (params) =>
            setEdges((eds) =>
                addEdge({ ...params, type: 'smoothstep', markerEnd: { type: MarkerType.ArrowClosed, color: '#3a7ca5' } }, eds)
            ),
        [setEdges]
    );

    const toolbarItems = useMemo(
        () => [
            { id: 'service', label: 'Service', icon: Cpu },
            { id: 'api', label: 'Gateway', icon: Network },
            { id: 'db', label: 'Database', icon: Database }
        ],
        []
    );

    const addNode = (type) => {
        const base = {
            background: '#12161b',
            color: '#f5f1e8',
            border: '1px solid #2b3137',
            borderRadius: 16,
            padding: 14
        };
        const labelMap = { service: 'Service', api: 'API Gateway', db: 'Database' };
        setNodes((prev) => [
            ...prev,
            {
                id: `${type}-${Date.now()}`,
                position: { x: 200 + prev.length * 30, y: 220 + prev.length * 30 },
                data: { label: labelMap[type] || 'Node' },
                style: base
            }
        ]);
    };

    const callAI = async (action) => {
        // This playground functionality is currently disabled until refactored.
        setError('AI design refinement is currently disabled.');
    };

    const exportSvg = async () => {
        if (!canvasRef.current) return;
        try {
            const dataUrl = await toSvg(canvasRef.current, {
                backgroundColor: '#0e1116',
                filter: (node) => !node.classList?.contains('react-flow__controls')
            });
            const link = document.createElement('a');
            link.download = 'system-design.svg';
            link.href = dataUrl;
            link.click();
        } catch (err) {
            setError('Export failed. Try again.');
        }
    };

    return (
        <div className="min-h-screen bg-[#0e1116] text-[#f5f1e8] font-sans">
            <div className="relative overflow-hidden border-b border-[#1f242b]">
                <div className="absolute inset-0 opacity-40 bg-[radial-gradient(circle_at_top,_rgba(58,124,165,0.25),_transparent_60%)]"></div>
                <div className="max-w-6xl mx-auto px-6 py-16 relative">
                    <div className="text-sm uppercase tracking-[0.25em] text-[#7fb3d4] mb-4">&lt;SystemDesign /&gt;</div>
                    <h1 className="text-5xl md:text-6xl font-semibold leading-tight">
                        Diagramming,<br />
                        <span className="text-[#55b38b]">Re-imagined</span> for Devs.
                    </h1>
                    <p className="text-[#b3bbc2] mt-6 max-w-2xl text-lg">
                        AutoSRS ships a focused playground for UML, sequence, and architecture flows.
                        Design with the canvas, then manual edits are supported.
                    </p>
                    <div className="mt-8 flex flex-wrap gap-4">
                        <button
                            onClick={exportSvg}
                            className="px-6 py-3 border border-[#2b3137] rounded-xl text-sm font-semibold hover:bg-[#1b1f23] transition flex items-center gap-2"
                        >
                            <Download size={16} /> Export SVG
                        </button>
                        <button
                            onClick={() => document.getElementById('canvas')?.scrollIntoView({ behavior: 'smooth' })}
                            className="px-6 py-3 bg-[#55b38b] text-[#0e1116] rounded-xl text-sm font-semibold hover:bg-[#4aa37d] transition flex items-center gap-2"
                        >
                            <Play size={16} /> Launch Playground
                        </button>
                    </div>
                </div>
            </div>

            <div id="canvas" className="max-w-6xl mx-auto px-6 py-10">
                <div className="relative rounded-3xl border border-[#2b3137] bg-[#0f1318] shadow-[0_30px_80px_rgba(0,0,0,0.45)] overflow-hidden">
                    <div className="absolute inset-0 bg-[linear-gradient(to_right,_rgba(255,255,255,0.03)_1px,_transparent_1px),linear-gradient(to_bottom,_rgba(255,255,255,0.03)_1px,_transparent_1px)] bg-[size:28px_28px] opacity-40"></div>

                    <div className="relative z-10 flex">
                        <div className="w-16 border-r border-[#1f242b] bg-[#0f1318] flex flex-col items-center gap-3 py-6">
                            {toolbarItems.map((item) => (
                                <button
                                    key={item.id}
                                    onClick={() => addNode(item.id)}
                                    className="w-10 h-10 rounded-xl border border-[#2b3137] bg-[#11151c] hover:bg-[#1b1f23] transition flex items-center justify-center text-[#7fb3d4]"
                                    title={item.label}
                                >
                                    <item.icon size={18} />
                                </button>
                            ))}
                            <button
                                onClick={() => { setNodes([]); setEdges([]); }}
                                className="mt-4 w-10 h-10 rounded-xl border border-[#2b3137] bg-[#11151c] hover:bg-[#1b1f23] transition flex items-center justify-center text-[#d97762]"
                                title="Clear Canvas"
                            >
                                <Trash2 size={18} />
                            </button>
                        </div>

                        <div className="flex-1 h-[520px] relative" ref={canvasRef}>
                            <ReactFlow
                                nodes={nodes}
                                edges={edges}
                                onNodesChange={onNodesChange}
                                onEdgesChange={onEdgesChange}
                                onConnect={onConnect}
                                fitView
                            >
                                <Controls showInteractive={false} />
                                <MiniMap
                                    pannable
                                    zoomable
                                    nodeColor={() => '#3a7ca5'}
                                    maskColor="rgba(14,17,22,0.6)"
                                />
                                <Background gap={28} size={1} color="#1f242b" />
                            </ReactFlow>
                        </div>

                        {panelOpen && (
                            <div className="w-[320px] border-l border-[#1f242b] bg-[#0f1318] p-5">
                                <div className="flex items-center justify-between mb-4">
                                    <div className="text-sm uppercase tracking-[0.2em] text-[#7fb3d4]">Notebook</div>
                                    <button
                                        onClick={() => setPanelOpen(false)}
                                        className="text-[#8e98a0] hover:text-[#f5f1e8] transition"
                                    >
                                        <PanelRightClose size={18} />
                                    </button>
                                </div>

                                <textarea
                                    value={prompt}
                                    onChange={(e) => setPrompt(e.target.value)}
                                    placeholder="Describe the system, constraints, and components..."
                                    className="w-full h-32 bg-[#11151c] border border-[#2b3137] rounded-xl p-3 text-sm text-[#f5f1e8] placeholder:text-[#6c7680] focus:outline-none focus:ring-2 focus:ring-[#3a7ca5]/40"
                                />

                                {error && <div className="text-xs text-[#d97762] mt-2">{error}</div>}

                                <div className="mt-4 grid grid-cols-2 gap-3">
                                    <button
                                        disabled={loading}
                                        onClick={() => callAI('generate')}
                                        className="flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-[#3a7ca5] text-[#0e1116] text-sm font-semibold hover:bg-[#2e6b90] transition disabled:opacity-60"
                                    >
                                        <Wand2 size={16} /> Generate
                                    </button>
                                    <button
                                        disabled={loading}
                                        onClick={() => callAI('edit')}
                                        className="flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-[#55b38b] text-[#0e1116] text-sm font-semibold hover:bg-[#4aa37d] transition disabled:opacity-60"
                                    >
                                        <Sparkles size={16} /> Refine
                                    </button>
                                </div>

                                <div className="mt-6">
                                    <div className="text-xs uppercase tracking-[0.2em] text-[#8e98a0] mb-2">History</div>
                                    <div className="space-y-2 max-h-48 overflow-auto pr-1">
                                        {history.length === 0 && (
                                            <div className="text-xs text-[#6c7680]">No prompts yet.</div>
                                        )}
                                        {history.map((item) => (
                                            <button
                                                key={item.ts}
                                                onClick={() => setPrompt(item.prompt)}
                                                className="w-full text-left text-xs bg-[#11151c] border border-[#2b3137] rounded-lg p-2 hover:bg-[#1b1f23] transition"
                                            >
                                                <div className="text-[#f5f1e8]">{item.prompt}</div>
                                                <div className="text-[#6c7680] mt-1">{item.action}</div>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}

                        {!panelOpen && (
                            <button
                                onClick={() => setPanelOpen(true)}
                                className="absolute right-4 top-4 z-20 w-10 h-10 rounded-xl border border-[#2b3137] bg-[#11151c] hover:bg-[#1b1f23] transition flex items-center justify-center text-[#7fb3d4]"
                                title="Open Panel"
                            >
                                <PanelRightOpen size={18} />
                            </button>
                        )}
                    </div>
                </div>

                <div className="mt-6 text-xs text-[#6c7680] flex items-center gap-2">
                    <Layers size={14} /> This playground supports hand-edited system diagrams.
                </div>
            </div>
        </div>
    );
};

export default SystemDesignPlayground;
