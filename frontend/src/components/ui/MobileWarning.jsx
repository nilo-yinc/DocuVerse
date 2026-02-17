import { useState, useEffect } from 'react';
import { Monitor, X } from 'lucide-react';

const MobileWarning = () => {
    const [show, setShow] = useState(false);

    useEffect(() => {
        const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
            || window.innerWidth < 768;
        const dismissed = sessionStorage.getItem('docuverse_mobile_dismissed');
        if (isMobile && !dismissed) {
            setShow(true);
        }
    }, []);

    const handleDismiss = () => {
        setShow(false);
        sessionStorage.setItem('docuverse_mobile_dismissed', 'true');
    };

    if (!show) return null;

    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
            <div className="bg-gradient-to-br from-[#1c2128] via-[#161b22] to-[#0d1117] border border-white/10 rounded-2xl p-8 max-w-sm w-full shadow-[0_20px_60px_rgba(0,0,0,0.6)] text-center relative">
                {/* Close button */}
                <button onClick={handleDismiss}
                    className="absolute top-4 right-4 text-gray-500 hover:text-white transition-colors">
                    <X size={20} />
                </button>

                {/* Icon */}
                <div className="flex justify-center mb-5">
                    <div className="p-4 bg-[#0d1117] rounded-full border border-[#58a6ff]/20 shadow-[0_0_20px_rgba(88,166,255,0.1)]">
                        <Monitor className="text-[#58a6ff]" size={32} />
                    </div>
                </div>

                {/* Title */}
                <h2 className="text-xl font-bold text-white mb-2">Desktop Recommended</h2>

                {/* Message */}
                <p className="text-gray-400 text-sm leading-relaxed mb-6">
                    For access to all features, please open <span className="text-[#58a6ff] font-semibold">DocuVerse</span> in desktop mode for the best experience.
                </p>

                {/* Button */}
                <button onClick={handleDismiss}
                    className="w-full bg-[#238636] hover:bg-[#2eaa44] text-white font-bold py-3 rounded-xl transition-all active:scale-95 uppercase tracking-widest text-xs shadow-[0_5px_20px_rgba(35,134,54,0.25)]">
                    Continue Anyway
                </button>
            </div>
        </div>
    );
};

export default MobileWarning;
