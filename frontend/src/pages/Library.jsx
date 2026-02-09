import { useNavigate } from 'react-router-dom';
import { Code, Activity, ArrowLeft } from 'lucide-react';

const Library = () => {
    const navigate = useNavigate();

    const models = [
        {
            id: "waterfall",
            title: "Waterfall Model",
            icon: Activity,
            color: "text-[#58a6ff]",
            bgColor: "bg-[#58a6ff]/10",
            borderColor: "border-[#58a6ff]",
            desc: "The classic linear sequential approach. Best for projects with clear, fixed requirements.",
            details: ["Requirements", "Design", "Implementation", "Testing", "Deployment"]
        },
        {
            id: "agile",
            title: "Agile / Scrum",
            icon: Code,
            color: "text-[#e9c46a]",
            bgColor: "bg-[#e9c46a]/10",
            borderColor: "border-[#e9c46a]",
            desc: "Iterative and incremental. Best for projects where requirements evolve rapidly.",
            details: ["Backlog", "Sprints", "Standups", "Review", "Retrospective"]
        },
        {
            id: "v-shape",
            title: "V-Shaped Model",
            icon: Activity,
            color: "text-[#2ea043]",
            bgColor: "bg-[#2ea043]/10",
            borderColor: "border-[#2ea043]",
            desc: "Verification and Validation. Each development stage has a corresponding testing phase.",
            details: ["Requirements", "System Design", "Architecture", "Module Design"]
        },
        {
            id: "spiral",
            title: "Spiral Model",
            icon: Activity,
            color: "text-[#d29922]",
            bgColor: "bg-[#d29922]/10",
            borderColor: "border-[#d29922]",
            desc: "Risk-driven process. Combines elements of Waterfall and Agile.",
            details: ["Planning", "Risk Analysis", "Engineering", "Evaluation"]
        },
        {
            id: "iterative",
            title: "Iterative Model",
            icon: Activity,
            color: "text-[#db61a2]",
            bgColor: "bg-[#db61a2]/10",
            borderColor: "border-[#db61a2]",
            desc: "Develop system through repeated cycles (iterative).",
            details: ["Planning", "Requirements", "Analysis", "Implementation", "Test"]
        },
        {
            id: "bigbang",
            title: "Big Bang Model",
            icon: Code,
            color: "text-[#f78166]",
            bgColor: "bg-[#f78166]/10",
            borderColor: "border-[#f78166]",
            desc: "Coding with minimal planning. Suitable only for very small projects.",
            details: ["Code", "Code", "Code", "Pray"]
        }
    ];

    return (
        <div className="min-h-screen bg-[#0d1117] text-[#c9d1d9] font-mono selection:bg-[#58a6ff] selection:text-[#0d1117]">
            {/* Nav */}
            <nav className="fixed w-full z-50 bg-[#0d1117]/90 backdrop-blur border-b border-[#30363d]">
                <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate('/')}>
                        <div className="w-8 h-8 rounded bg-[#21262d] border border-[#30363d] flex items-center justify-center text-[#58a6ff]">
                            <ArrowLeft size={20} />
                        </div>
                        <span className="font-bold tracking-tight text-white">Back to Home</span>
                    </div>
                </div>
            </nav>

            <main className="pt-32 pb-20 px-6 max-w-7xl mx-auto">
                <div className="text-center mb-16">
                    <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">SDLC Model Library</h1>
                    <p className="text-[#8b949e] max-w-2xl mx-auto">
                        Select a model to view the interactive simulation.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {models.map((model, index) => (
                        <div
                            key={index}
                            onClick={() => navigate(`/library/${model.id}`)}
                            className="bg-[#161b22] border border-[#30363d] rounded-xl overflow-hidden hover:border-[#58a6ff] transition-all duration-300 group relative cursor-pointer hover:scale-[1.02] hover:shadow-lg hover:shadow-blue-500/10"
                        >
                            <div className={`absolute top-0 right-0 p-32 ${model.bgColor} blur-[80px] rounded-full opacity-20 group-hover:opacity-40 transition-opacity`}></div>

                            <div className="p-8 relative z-10">
                                <div className={`w-12 h-12 rounded-lg ${model.bgColor} flex items-center justify-center mb-6`}>
                                    <model.icon className={model.color} size={24} />
                                </div>
                                <h3 className="text-xl font-bold text-white mb-2">{model.title}</h3>
                                <p className="text-sm text-[#8b949e] mb-6 min-h-[40px]">{model.desc}</p>
                                <div className="flex items-center gap-2 text-xs text-[#58a6ff] group-hover:text-white transition-colors">
                                    <Activity size={12} fill="currentColor" />
                                    <span>Launch Simulation</span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </main>
        </div>
    );
};

export default Library;
