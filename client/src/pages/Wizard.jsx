import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, WidthType, ImageRun } from 'docx';
import { saveAs } from 'file-saver';
import GenerationConsole from '../components/GenerationConsole';
import { useAuth } from '../context/AuthContext';

const Wizard = () => {
    const { token } = useAuth();
    const navigate = useNavigate();
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [consoleOpen, setConsoleOpen] = useState(false);
    const [projectId, setProjectId] = useState(null);
    const [logs, setLogs] = useState([]);

    const [formData, setFormData] = useState({
        title: '',
        domain: 'Web Development',
        teamMembers: [{ name: '', rollNo: '', univRollNo: '' }],
        techStack: { frontend: 'React', backend: 'Node', database: 'MongoDB' },
        cocomo: { kloc: 5, effort: 0, cost: 0, time: 0 },
        diagrams: {}, // { key: base64 }
        features: 'User Login, Dashboard, Payment Gateway',
        themeColor: 'Blue'
    });

    const updateField = (field, value) => setFormData(prev => ({ ...prev, [field]: value }));

    const handleTeamChange = (index, field, value) => {
        const newTeam = [...formData.teamMembers];
        newTeam[index][field] = value;
        setFormData(prev => ({ ...prev, teamMembers: newTeam }));
    };

    const addMember = () => setFormData(prev => ({ ...prev, teamMembers: [...prev.teamMembers, { name: '', rollNo: '', univRollNo: '' }] }));

    const removeMember = (index) => {
        if (formData.teamMembers.length > 1) {
            const newTeam = formData.teamMembers.filter((_, i) => i !== index);
            setFormData(prev => ({ ...prev, teamMembers: newTeam }));
        }
    };

    const calculateCocomo = (kloc) => {
        // Organic Mode: E = 2.4 * (KLOC)^1.05
        const effort = (2.4 * Math.pow(kloc, 1.05)).toFixed(2);
        const time = (2.5 * Math.pow(effort, 0.38)).toFixed(2);
        const cost = (effort * 5000).toFixed(2); // $5000 per person-month
        setFormData(prev => ({ ...prev, cocomo: { kloc, effort, time, cost } }));
    };

    const handleFileChange = (e, key) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setFormData(prev => ({ ...prev, diagrams: { ...prev.diagrams, [key]: reader.result } }));
            };
            reader.readAsDataURL(file);
        }
    };

    const saveProject = async () => {
        try {
            const res = await axios.post('http://localhost:5000/api/projects/save', { ...formData, projectId }, {
                headers: { 'x-auth-token': token }
            });
            setProjectId(res.data._id);
            return res.data;
        } catch (err) {
            console.error(err);
            alert('Failed to save progress');
        }
    };

    const generatePrototype = async () => {
        if (!projectId) {
            const saved = await saveProject();
            if (!saved) return;
        }
        setLoading(true);
        try {
            await axios.post('http://localhost:5000/api/projects/generate-prototype', {
                projectId: projectId || (await saveProject())._id,
                features: formData.features,
                themeColor: formData.themeColor
            }, {
                headers: { 'x-auth-token': token }
            });
            alert('Prototype Generated Successfully!');
        } catch (err) {
            console.error(err);
            alert('Generation Failed');
        } finally {
            setLoading(false);
        }
    };

    const handleDownloadReport = () => {
        setLogs([
            'Connecting to DocuVerse Engine...',
            `Injecting Team Data [${formData.teamMembers.length} MEMBERS]...`,
            'Analyzing COCOMO Metrics...',
            'Fetching Live Prototype Link...',
            'Compiling IEEE Standard DOCX...'
        ]);
        setConsoleOpen(true);
        // Console will trigger onComplete -> generateDocx
    };

    const generateDocx = async () => {
        const doc = new Document({
            sections: [{
                properties: {},
                children: [
                    new Paragraph({ text: formData.title, heading: "Title" }),
                    new Paragraph({ text: `Domain: ${formData.domain}` }),
                    new Paragraph(""),
                    new Paragraph({ text: "Team Members:", heading: "Heading 2" }),
                    ...formData.teamMembers.map(m => new Paragraph(`- ${m.name} (${m.rollNo})`)),
                    new Paragraph(""),
                    new Paragraph({ text: "COCOMO Estimation", heading: "Heading 2" }),
                    new Paragraph(`KLOC: ${formData.cocomo.kloc}`),
                    new Paragraph(`Effort: ${formData.cocomo.effort} PM`),
                    new Paragraph(`Cost: $${formData.cocomo.cost}`),
                    new Paragraph(""),
                    new Paragraph({ text: "Live Prototype", heading: "Heading 2" }),
                    new Paragraph({
                        text: `http://localhost:5173/demo/${projectId}`,
                        style: "Hyperlink"
                    })
                ]
            }]
        });

        const blob = await Packer.toBlob(doc);
        saveAs(blob, `${formData.title}_Report.docx`);
        setConsoleOpen(false);
    };

    return (
        <div className="flex h-screen bg-black text-white p-10 font-mono">
            <GenerationConsole isOpen={consoleOpen} logs={logs} onComplete={generateDocx} />

            <div className="w-1/4 border-r border-gray-800 pr-10">
                <h1 className="text-3xl font-bold text-neon-blue mb-8">Lab Suite</h1>
                <div className="space-y-4">
                    {['Identity', 'Team', 'Feasibility', 'Diagrams', 'Prototype'].map((s, i) => (
                        <div key={i} className={`p-3 rounded cursor-pointer ${step === i + 1 ? 'bg-neon-purple text-black font-bold' : 'text-gray-500'}`}
                            onClick={() => setStep(i + 1)}>
                            {i + 1}. {s}
                        </div>
                    ))}
                </div>
            </div>

            <div className="w-3/4 pl-10 overflow-y-auto">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={step}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                    >
                        {step === 1 && (
                            <div className="space-y-6">
                                <h2 className="text-2xl text-neon-green mb-4">Project Identity</h2>
                                <input placeholder="Project Title" className="w-full bg-dark-input p-4 rounded border border-gray-700 outline-none focus:border-neon-blue"
                                    value={formData.title} onChange={e => updateField('title', e.target.value)} />
                                <select className="w-full bg-dark-input p-4 rounded border border-gray-700 outline-none"
                                    value={formData.domain} onChange={e => updateField('domain', e.target.value)}>
                                    <option>Web Development</option>
                                    <option>App Development</option>
                                    <option>AI/ML</option>
                                </select>
                            </div>
                        )}

                        {step === 2 && (
                            <div className="space-y-4">
                                <h2 className="text-2xl text-neon-green mb-4">Team Config</h2>
                                {formData.teamMembers.map((m, i) => (
                                    <div key={i} className="flex gap-4">
                                        <input placeholder="Name" className="bg-dark-input p-2 rounded w-1/3" value={m.name} onChange={e => handleTeamChange(i, 'name', e.target.value)} />
                                        <input placeholder="Class Roll" className="bg-dark-input p-2 rounded w-1/4" value={m.rollNo} onChange={e => handleTeamChange(i, 'rollNo', e.target.value)} />
                                        <input placeholder="Univ Roll" className="bg-dark-input p-2 rounded w-1/4" value={m.univRollNo} onChange={e => handleTeamChange(i, 'univRollNo', e.target.value)} />
                                        <button onClick={() => removeMember(i)} className="text-red-500">x</button>
                                    </div>
                                ))}
                                <button onClick={addMember} className="text-neon-blue hover:underline">+ Add Member</button>
                            </div>
                        )}

                        {step === 3 && (
                            <div className="space-y-6">
                                <h2 className="text-2xl text-neon-green mb-4">Feasibility & COCOMO</h2>
                                <div className="grid grid-cols-3 gap-4">
                                    <input placeholder="Frontend (e.g. React)" className="bg-dark-input p-2 rounded" value={formData.techStack.frontend} onChange={e => setFormData(p => ({ ...p, techStack: { ...p.techStack, frontend: e.target.value } }))} />
                                    <input placeholder="Backend" className="bg-dark-input p-2 rounded" value={formData.techStack.backend} onChange={e => setFormData(p => ({ ...p, techStack: { ...p.techStack, backend: e.target.value } }))} />
                                    <input placeholder="Database" className="bg-dark-input p-2 rounded" value={formData.techStack.database} onChange={e => setFormData(p => ({ ...p, techStack: { ...p.techStack, database: e.target.value } }))} />
                                </div>
                                <div className="p-6 bg-gray-900 rounded border border-gray-700">
                                    <h3 className="text-xl mb-4 text-gray-400">COCOMO Estimator</h3>
                                    <div className="flex items-center gap-4 mb-4">
                                        <label>Estimated KLOC:</label>
                                        <input type="number" className="bg-black border border-gray-600 p-1 w-24 text-center rounded"
                                            value={formData.cocomo.kloc} onChange={e => calculateCocomo(e.target.value)} />
                                    </div>
                                    <div className="grid grid-cols-3 gap-8 text-center">
                                        <div><div className="text-3xl font-bold text-neon-purple">{formData.cocomo.effort}</div><div className="text-xs text-gray-500">Person-Months</div></div>
                                        <div><div className="text-3xl font-bold text-neon-blue">${formData.cocomo.cost}</div><div className="text-xs text-gray-500">Est. Cost</div></div>
                                        <div><div className="text-3xl font-bold text-white">{formData.cocomo.time}</div><div className="text-xs text-gray-500">Months</div></div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {step === 4 && (
                            <div className="space-y-6">
                                <h2 className="text-2xl text-neon-green mb-4">Diagram Uploads</h2>
                                {['useCase', 'dfd0', 'dfd1', 'classDiagram'].map(key => (
                                    <div key={key} className="flex justify-between items-center bg-gray-900 p-4 rounded">
                                        <span className="capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</span>
                                        <input type="file" onChange={e => handleFileChange(e, key)} className="text-sm text-gray-400" />
                                        {formData.diagrams[key] && <span className="text-green-500">✓ Uploaded</span>}
                                    </div>
                                ))}
                            </div>
                        )}

                        {step === 5 && (
                            <div className="space-y-6">
                                <h2 className="text-2xl text-neon-green mb-4">Prototype Studio</h2>
                                <textarea placeholder="Describe features for AI generation..." className="w-full bg-dark-input p-4 rounded h-32 outline-none"
                                    value={formData.features} onChange={e => updateField('features', e.target.value)} />
                                <div className="flex gap-4">
                                    <button onClick={generatePrototype} disabled={loading} className="bg-neon-purple px-6 py-3 rounded font-bold hover:opacity-80 disabled:opacity-50">
                                        {loading ? 'Generating...' : '✨ Generate AI Live Site'}
                                    </button>
                                    {projectId && (
                                        <a href={`/demo/${projectId}`} target="_blank" rel="noreferrer" className="flex items-center justify-center border border-neon-blue text-neon-blue px-6 py-3 rounded font-bold hover:bg-neon-blue/10">
                                            Preview Site ↗
                                        </a>
                                    )}
                                </div>

                                <div className="border-t border-gray-800 pt-8 mt-8">
                                    <h3 className="text-xl mb-4">Final Output</h3>
                                    <button onClick={handleDownloadReport} className="w-full bg-green-600 hover:bg-green-700 p-4 rounded font-bold flex items-center justify-center gap-2">
                                        <span>Download Standard Lab Report (.docx)</span>
                                    </button>
                                </div>
                            </div>
                        )}
                    </motion.div>
                </AnimatePresence>

                <div className="mt-10 flex justify-between">
                    <button onClick={() => setStep(Math.max(1, step - 1))} className={`text-gray-500 ${step === 1 ? 'invisible' : ''}`}>← Back</button>
                    <button onClick={() => setStep(Math.min(5, step + 1))} className={`bg-white text-black px-6 py-2 rounded font-bold ${step === 5 ? 'invisible' : ''}`}>Next →</button>
                </div>
            </div>
        </div>
    );
};

export default Wizard;
