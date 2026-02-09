import React, { useRef, useState, useEffect } from 'react';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';

// ============================================
// 3D CARD EFFECT (Aceternity Style)
// ============================================

export const CardContainer = ({ children, className = "", containerClassName = "" }) => {
    const containerRef = useRef(null);
    const [isMouseEntered, setIsMouseEntered] = useState(false);

    const handleMouseMove = (e) => {
        if (!containerRef.current) return;
        const { left, top, width, height } = containerRef.current.getBoundingClientRect();
        const x = (e.clientX - left - width / 2) / 25;
        const y = (e.clientY - top - height / 2) / 25;
        containerRef.current.style.transform = `rotateY(${x}deg) rotateX(${-y}deg)`;
    };

    const handleMouseEnter = () => {
        setIsMouseEntered(true);
    };

    const handleMouseLeave = () => {
        setIsMouseEntered(false);
        if (containerRef.current) {
            containerRef.current.style.transform = `rotateY(0deg) rotateX(0deg)`;
        }
    };

    return (
        <div
            className={`py-4 flex items-center justify-center ${containerClassName}`}
            style={{ perspective: "1000px" }}
        >
            <div
                ref={containerRef}
                onMouseEnter={handleMouseEnter}
                onMouseMove={handleMouseMove}
                onMouseLeave={handleMouseLeave}
                className={`flex items-center justify-center relative transition-all duration-200 ease-linear ${className}`}
                style={{ transformStyle: "preserve-3d" }}
            >
                {children}
            </div>
        </div>
    );
};

export const CardBody = ({ children, className = "" }) => {
    return (
        <div
            className={`h-auto w-auto [transform-style:preserve-3d] [&>*]:[transform-style:preserve-3d] ${className}`}
        >
            {children}
        </div>
    );
};

export const CardItem = ({
    as: Tag = "div",
    children,
    className = "",
    translateX = 0,
    translateY = 0,
    translateZ = 0,
    rotateX = 0,
    rotateY = 0,
    rotateZ = 0,
    ...rest
}) => {
    const ref = useRef(null);
    const [isMouseEntered, setIsMouseEntered] = useState(false);

    useEffect(() => {
        handleAnimations();
    }, [isMouseEntered]);

    const handleAnimations = () => {
        if (!ref.current) return;
        if (isMouseEntered) {
            ref.current.style.transform = `translateX(${translateX}px) translateY(${translateY}px) translateZ(${translateZ}px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) rotateZ(${rotateZ}deg)`;
        } else {
            ref.current.style.transform = `translateX(0px) translateY(0px) translateZ(0px) rotateX(0deg) rotateY(0deg) rotateZ(0deg)`;
        }
    };

    return (
        <Tag
            ref={ref}
            className={`w-fit transition duration-200 ease-linear ${className}`}
            onMouseEnter={() => setIsMouseEntered(true)}
            onMouseLeave={() => setIsMouseEntered(false)}
            {...rest}
        >
            {children}
        </Tag>
    );
};

// ============================================
// CARD SPOTLIGHT EFFECT
// ============================================

export const CardSpotlight = ({ children, className = "", radius = 350, ...props }) => {
    const divRef = useRef(null);
    const [position, setPosition] = useState({ x: 0, y: 0 });
    const [opacity, setOpacity] = useState(0);

    const handleMouseMove = (e) => {
        if (!divRef.current) return;
        const rect = divRef.current.getBoundingClientRect();
        setPosition({ x: e.clientX - rect.left, y: e.clientY - rect.top });
    };

    const handleMouseEnter = () => setOpacity(1);
    const handleMouseLeave = () => setOpacity(0);

    return (
        <div
            ref={divRef}
            onMouseMove={handleMouseMove}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
            {...props}
            className={`relative overflow-hidden rounded-xl border border-[#30363d] bg-[#0d1117] p-8 ${className}`}
        >
            <div
                className="pointer-events-none absolute -inset-px opacity-0 transition duration-300"
                style={{
                    opacity,
                    background: `radial-gradient(${radius}px circle at ${position.x}px ${position.y}px, rgba(88, 166, 255, 0.15), transparent 40%)`,
                }}
            />
            {children}
        </div>
    );
};

// ============================================
// NOISE BACKGROUND BUTTON
// ============================================

export const NoiseBackground = ({
    children,
    className = "",
    containerClassName = "",
    gradientColors = ["rgb(88, 166, 255)", "rgb(46, 160, 67)", "rgb(247, 129, 102)"]
}) => {
    return (
        <div className={`relative ${containerClassName}`}>
            {/* Animated gradient border */}
            <div
                className="absolute -inset-[2px] rounded-full opacity-75 blur-sm"
                style={{
                    background: `linear-gradient(90deg, ${gradientColors.join(', ')})`,
                    backgroundSize: '200% 200%',
                    animation: 'gradient-shift 3s ease infinite'
                }}
            />

            {/* Noise overlay */}
            <div
                className="absolute inset-0 rounded-full opacity-30"
                style={{
                    backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
                }}
            />

            {/* Content */}
            <div className={`relative ${className}`}>
                {children}
            </div>

            {/* CSS Animation */}
            <style>{`
                @keyframes gradient-shift {
                    0% { background-position: 0% 50%; }
                    50% { background-position: 100% 50%; }
                    100% { background-position: 0% 50%; }
                }
            `}</style>
        </div>
    );
};

// ============================================
// TEXT HOVER EFFECT
// ============================================

export const TextHoverEffect = ({ text, className = "" }) => {
    const svgRef = useRef(null);
    const [cursor, setCursor] = useState({ x: 0, y: 0 });
    const [hovered, setHovered] = useState(false);
    const [maskPosition, setMaskPosition] = useState({ cx: "50%", cy: "50%" });

    useEffect(() => {
        if (svgRef.current && cursor.x !== null && cursor.y !== null) {
            const svgRect = svgRef.current.getBoundingClientRect();
            const cxPercentage = ((cursor.x - svgRect.left) / svgRect.width) * 100;
            const cyPercentage = ((cursor.y - svgRect.top) / svgRect.height) * 100;
            setMaskPosition({
                cx: `${cxPercentage}%`,
                cy: `${cyPercentage}%`,
            });
        }
    }, [cursor]);

    return (
        <svg
            ref={svgRef}
            width="100%"
            height="100%"
            viewBox="0 0 300 100"
            xmlns="http://www.w3.org/2000/svg"
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
            onMouseMove={(e) => setCursor({ x: e.clientX, y: e.clientY })}
            className={`select-none ${className}`}
        >
            <defs>
                <linearGradient
                    id="textGradient"
                    gradientUnits="userSpaceOnUse"
                    x1="0%"
                    y1="0%"
                    x2="100%"
                    y2="0%"
                >
                    <stop offset="0%" stopColor="#58a6ff" />
                    <stop offset="50%" stopColor="#2ea043" />
                    <stop offset="100%" stopColor="#f78166" />
                </linearGradient>

                <radialGradient
                    id="revealMask"
                    gradientUnits="userSpaceOnUse"
                    r="20%"
                    cx={maskPosition.cx}
                    cy={maskPosition.cy}
                >
                    <stop offset="0%" stopColor="white" />
                    <stop offset="100%" stopColor="black" />
                </radialGradient>

                <mask id="textMask">
                    <rect
                        x="0"
                        y="0"
                        width="100%"
                        height="100%"
                        fill={hovered ? "url(#revealMask)" : "white"}
                    />
                </mask>
            </defs>

            {/* Background text (stroke) */}
            <text
                x="50%"
                y="50%"
                textAnchor="middle"
                dominantBaseline="middle"
                strokeWidth="0.5"
                className="fill-transparent stroke-[#30363d] font-bold"
                style={{ fontSize: "4rem" }}
            >
                {text}
            </text>

            {/* Animated stroke */}
            <motion.text
                x="50%"
                y="50%"
                textAnchor="middle"
                dominantBaseline="middle"
                strokeWidth="0.5"
                className="fill-transparent stroke-[#58a6ff] font-bold"
                style={{ fontSize: "4rem" }}
                initial={{ strokeDashoffset: 1000, strokeDasharray: 1000 }}
                animate={{
                    strokeDashoffset: 0,
                    strokeDasharray: 1000,
                }}
                transition={{
                    duration: 4,
                    ease: "easeInOut",
                }}
            >
                {text}
            </motion.text>

            {/* Gradient text (revealed on hover) */}
            <text
                x="50%"
                y="50%"
                textAnchor="middle"
                dominantBaseline="middle"
                stroke="url(#textGradient)"
                strokeWidth="0.5"
                mask="url(#textMask)"
                className="fill-transparent font-bold"
                style={{ fontSize: "4rem" }}
            >
                {text}
            </text>
        </svg>
    );
};

// ============================================
// GLOWING BUTTON
// ============================================

export const GlowingButton = ({ children, className = "", onClick }) => {
    return (
        <NoiseBackground
            containerClassName="w-fit rounded-full"
            gradientColors={["#58a6ff", "#2ea043", "#f78166"]}
        >
            <button
                onClick={onClick}
                className={`relative h-full w-full cursor-pointer rounded-full bg-[#0d1117] px-6 py-3 text-white font-bold shadow-lg transition-all duration-200 hover:scale-105 active:scale-95 ${className}`}
            >
                {children}
            </button>
        </NoiseBackground>
    );
};

// ============================================
// LEGACY EXPORTS (for backward compatibility)
// ============================================

export const Card3D = CardContainer;
export const Card3DBody = CardBody;
export const Card3DItem = CardItem;

export default CardContainer;
