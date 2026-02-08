import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

const Dashboard = () => {
    const navigate = useNavigate();

    return (
        <div className="flex h-screen overflow-hidden">
            {/* Card A: Enterprise SRS */}
            <motion.div
                className="w-1/2 bg-gray-900 flex flex-col justify-center items-center border-r border-gray-800 hover:bg-gray-800 transition cursor-pointer group"
                whileHover={{ scale: 1.02 }}
            >
                <h2 className="text-4xl font-bold text-gray-400 group-hover:text-white mb-4">Enterprise SRS</h2>
                <p className="text-gray-500 max-w-md text-center">Standard IEEE 830-1998 compliant SRS generation for professional software documentation.</p>
                <button className="mt-8 px-6 py-2 border border-gray-600 rounded text-gray-400 opacity-50 cursor-not-allowed">
                    Legacy Module (Coming Soon)
                </button>
            </motion.div>

            {/* Card B: Student Lab Suite */}
            <motion.div
                onClick={() => navigate('/wizard')}
                className="w-1/2 bg-black flex flex-col justify-center items-center relative overflow-hidden cursor-pointer group"
                whileHover={{ scale: 1.02 }}
            >
                <div className="absolute inset-0 bg-gradient-to-br from-purple-900/20 to-blue-900/20 z-0"></div>
                <h2 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-neon-blue to-neon-purple z-10 mb-4 animate-pulse">
                    Student Lab Suite
                </h2>
                <p className="text-gray-400 max-w-md text-center z-10">
                    The ultimate DocuVerse toolkit. Generate Feasibility Reports, UMLs, Costing, and <span className="text-neon-green">Live Prototypes</span> instantly.
                </p>
                <button className="mt-8 px-8 py-3 bg-neon-purple text-white rounded-full font-bold shadow-[0_0_15px_rgba(188,19,254,0.5)] group-hover:shadow-[0_0_25px_rgba(188,19,254,0.8)] transition z-10">
                    Launch Wizard 🚀
                </button>
            </motion.div>
        </div>
    );
};

export default Dashboard;
