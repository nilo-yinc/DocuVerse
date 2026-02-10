import { useState } from 'react';
import { motion } from 'framer-motion';
import { Workflow, MousePointer2, Plus, Share2, Download, Settings, Database, Server, Smartphone, Globe } from 'lucide-react';
import { CardContainer, CardBody, CardItem } from '../ui/Card3D';

const DiagramFeature = () => {

    // Mock Nodes for Visualization
    const initialNodes = [
        { id: 1, type: 'client', x: 200, y: 100, icon: Smartphone, label: "Mobile App" },
        { id: 2, type: 'api', x: 450, y: 100, icon: Globe, label: "API Gateway" },
        { id: 3, type: 'server', x: 450, y: 300, icon: Server, label: "Auth Service" },
        { id: 4, type: 'db', x: 700, y: 300, icon: Database, label: "User DB" },
    ];

    return (
        <section className="py-24 bg-[#010409] border-y border-[#30363d] relative overflow-hidden">
            {/* Grid Background */}
            <div className="absolute inset-0 opacity-10"
                style={{
                    backgroundImage: 'linear-gradient(#30363d 1px, transparent 1px), linear-gradient(90deg, #30363d 1px, transparent 1px)',
                    backgroundSize: '40px 40px'
                }}
            ></div>

            <div className="max-w-7xl mx-auto px-6 relative z-10">
                <div className="flex flex-col md:flex-row md:items-end justify-between mb-12">
                    <div>
                        <motion.div
                            initial={{ opacity: 0, x: -10 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true }}
                            className="text-[#7ee787] font-mono text-sm mb-2"
                        >
                            {'<SystemDesign />'}
                        </motion.div>
                        <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
                            Diagramming, <br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#7ee787] to-[#2ea043]">Re-imagined</span> for Devs.
                        </h2>
                        <p className="text-[#8b949e] max-w-xl text-lg">
                            Don't fight with generic drawing tools. AutoSRS provides a dedicated playground for
                            UML, Sequence, and Architecture diagrams that map directly to your code.
                        </p>
                    </div>

                    <div className="flex gap-4 mt-6 md:mt-0">
                        <button className="px-5 py-2.5 bg-[#161b22] border border-[#30363d] text-[#c9d1d9] rounded-lg text-sm font-medium hover:border-[#7ee787] transition flex items-center gap-2">
                            <Download size={16} /> Export SVG
                        </button>
                        <button className="px-5 py-2.5 bg-[#238636] text-white rounded-lg text-sm font-bold hover:bg-[#2ea043] transition shadow-lg shadow-green-900/20">
                            Launch Playground
                        </button>
                    </div>
                </div>

                {/* Interactive Playground Surface */}
                <CardContainer containerClassName="py-0 inter-var" className="w-full">
                    <CardBody className="w-full relative">
                        <CardItem translateZ="50" className="w-full">
                            <div className="relative h-[500px] bg-[#0d1117] border border-[#30363d] rounded-xl shadow-2xl overflow-hidden group select-none">

                                {/* Toolbar */}
                                <CardItem translateZ="100" className="absolute top-4 left-4 flex flex-col gap-2 z-20">
                                    {[Database, Server, Globe, Smartphone].map((Icon, i) => (
                                        <div key={i} className="p-3 bg-[#161b22] border border-[#30363d] rounded-lg text-[#8b949e] hover:text-white hover:border-[#7ee787] hover:bg-[#1f2428] cursor-grab transition shadow-md">
                                            <Icon size={20} />
                                        </div>
                                    ))}
                                    <div className="w-8 h-[1px] bg-[#30363d] mx-auto my-1"></div>
                                    <div className="p-3 bg-[#161b22] border border-[#30363d] rounded-lg text-[#8b949e] hover:text-white cursor-pointer transition">
                                        <Plus size={20} />
                                    </div>
                                </CardItem>

                                {/* Canvas Area */}
                                <div className="w-full h-full relative">
                                    {/* Connecting Lines (SVG) */}
                                    <svg className="absolute inset-0 w-full h-full pointer-events-none z-0">
                                        <motion.path
                                            d="M 250 150 L 450 150"
                                            stroke="#30363d"
                                            strokeWidth="2"
                                            strokeDasharray="5,5"
                                            initial={{ pathLength: 0, opacity: 0 }}
                                            whileInView={{ pathLength: 1, opacity: 1 }}
                                            transition={{ duration: 1, delay: 0.5 }}
                                        />
                                        <motion.path
                                            d="M 500 200 L 500 300"
                                            stroke="#30363d"
                                            strokeWidth="2"
                                            initial={{ pathLength: 0, opacity: 0 }}
                                            whileInView={{ pathLength: 1, opacity: 1 }}
                                            transition={{ duration: 1, delay: 0.8 }}
                                        />
                                        <motion.path
                                            d="M 550 350 L 700 350"
                                            stroke="#30363d"
                                            strokeWidth="2"
                                            initial={{ pathLength: 0, opacity: 0 }}
                                            whileInView={{ pathLength: 1, opacity: 1 }}
                                            transition={{ duration: 1, delay: 1.1 }}
                                        />
                                    </svg>

                                    {/* Nodes */}
                                    {initialNodes.map((node, index) => (
                                        <CardItem
                                            key={node.id}
                                            translateZ={70 + (index * 10)}
                                            className="absolute p-0"
                                            style={{ top: node.y, left: node.x }}
                                        >
                                            <motion.div
                                                initial={{ scale: 0, opacity: 0 }}
                                                whileInView={{ scale: 1, opacity: 1 }}
                                                viewport={{ once: true }}
                                                transition={{ type: "spring", stiffness: 260, damping: 20, delay: 0.2 + (index * 0.1) }}
                                                drag
                                                dragConstraints={{ left: 0, right: 800, top: 0, bottom: 400 }}
                                                whileDrag={{ scale: 1.1, cursor: "grabbing" }}
                                                className="bg-[#161b22] border border-[#30363d] p-4 rounded-xl shadow-xl flex flex-col items-center gap-2 cursor-grab w-32 z-10 group/node hover:border-[#7ee787] active:border-[#7ee787] active:ring-2 ring-[#7ee787]/20"
                                            >
                                                <div className={`p-3 rounded-full bg-[#0d1117] border border-[#30363d] 
                                                    ${node.type === 'db' ? 'text-blue-400' : ''}
                                                    ${node.type === 'server' ? 'text-purple-400' : ''}
                                                    ${node.type === 'api' ? 'text-green-400' : ''}
                                                    ${node.type === 'client' ? 'text-orange-400' : ''}
                                                `}>
                                                    <node.icon size={24} />
                                                </div>
                                                <span className="text-xs font-bold text-[#c9d1d9]">{node.label}</span>

                                                {/* Anchors */}
                                                <div className="absolute -right-1 top-1/2 w-2 h-2 bg-[#8b949e] rounded-full opacity-0 group-hover/node:opacity-100"></div>
                                                <div className="absolute -left-1 top-1/2 w-2 h-2 bg-[#8b949e] rounded-full opacity-0 group-hover/node:opacity-100"></div>
                                                <div className="absolute -bottom-1 left-1/2 w-2 h-2 bg-[#8b949e] rounded-full opacity-0 group-hover/node:opacity-100"></div>
                                            </motion.div>
                                        </CardItem>
                                    ))}

                                    {/* Cursor Mock */}
                                    <motion.div
                                        initial={{ x: 800, y: 400, opacity: 0 }}
                                        animate={{ x: [800, 720, 480, 800], y: [400, 320, 320, 400], opacity: 1 }}
                                        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
                                        className="absolute z-50 pointer-events-none"
                                    >
                                        <MousePointer2 className="text-white fill-black drop-shadow-lg" />
                                        <div className="ml-4 mt-2 bg-[#7ee787] text-black text-xs font-bold px-2 py-1 rounded shadow-lg">
                                            Niloy (You)
                                        </div>
                                    </motion.div>
                                </div>

                                {/* Property Panel Mock (Bottom Right) */}
                                <CardItem translateZ="80" className="absolute bottom-4 right-4 w-64 bg-[#161b22] border border-[#30363d] rounded-lg p-4 shadow-2xl opacity-90 backdrop-blur-sm z-30">
                                    <div className="flex justify-between items-center mb-4 text-xs text-[#8b949e] uppercase">
                                        <span>Properties</span>
                                        <Settings size={12} />
                                    </div>
                                    <div className="space-y-3">
                                        <div className="space-y-1">
                                            <label className="text-xs text-[#8b949e]">Component Name</label>
                                            <input type="text" disabled value="Auth Service" className="w-full bg-[#0d1117] border border-[#30363d] rounded px-2 py-1 text-sm text-[#c9d1d9]" />
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-xs text-[#8b949e]">Type</label>
                                            <select disabled className="w-full bg-[#0d1117] border border-[#30363d] rounded px-2 py-1 text-sm text-[#c9d1d9]">
                                                <option>Microservice</option>
                                                <option>Monolith</option>
                                            </select>
                                        </div>
                                    </div>
                                </CardItem>
                            </div>
                        </CardItem>
                    </CardBody>
                </CardContainer>
            </div>
        </section>
    );
};

export default DiagramFeature;
