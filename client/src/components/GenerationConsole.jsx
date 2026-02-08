import { motion, AnimatePresence } from 'framer-motion';
import { useEffect, useState } from 'react';

const GenerationConsole = ({ isOpen, logs, onComplete }) => {
    const [displayLogs, setDisplayLogs] = useState([]);

    useEffect(() => {
        if (isOpen && logs.length > 0) {
            let currentIndex = 0;
            const interval = setInterval(() => {
                if (currentIndex < logs.length) {
                    setDisplayLogs(prev => [...prev, logs[currentIndex]]);
                    currentIndex++;
                } else {
                    clearInterval(interval);
                    setTimeout(onComplete, 1000);
                }
            }, 800);
            return () => clearInterval(interval);
        } else {
            setDisplayLogs([]);
        }
    }, [isOpen, logs]);

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center font-mono text-green-500"
                >
                    <div className="w-2/3 max-w-2xl p-6 border border-green-500/30 rounded bg-black shadow-[0_0_50px_rgba(0,255,0,0.1)]">
                        <div className="flex justify-between border-b border-green-500/30 pb-2 mb-4">
                            <span>DOCUVERSE_KERNEL_V2.4</span>
                            <span>STATUS: ACTIVE</span>
                        </div>
                        <div className="space-y-2">
                            {displayLogs.map((log, index) => (
                                <motion.div
                                    key={index}
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ duration: 0.3 }}
                                >
                                    <span className="opacity-50 mr-2">[{new Date().toLocaleTimeString()}]</span>
                                    {log}
                                </motion.div>
                            ))}
                            <motion.div
                                animate={{ opacity: [0, 1] }}
                                transition={{ repeat: Infinity, duration: 0.8 }}
                                className="h-4 w-2 bg-green-500 inline-block align-middle ml-1"
                            />
                        </div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default GenerationConsole;
