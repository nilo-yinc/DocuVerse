import React, { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

// Combined class utility
const cn = (...classes) => classes.filter(Boolean).join(" ");

// Cell Component - Optimized with boolean isActive
const Cell = React.memo(({ isActive, interactive }) => {
    return (
        <div
            className={cn(
                "border-r border-b border-white/[0.05] relative transition-colors duration-200",
                isActive ? "bg-neon-blue/20 border-white/20" : "bg-transparent",
                interactive ? "cursor-crosshair" : "pointer-events-none"
            )}
        >
            {isActive && (
                <motion.div
                    layoutId="active-cell-glow"
                    className="absolute inset-0 bg-neon-blue/30 blur-md"
                    transition={{ duration: 0.1 }}
                />
            )}
        </div>
    );
});

Cell.displayName = "Cell";

// DivGrid Component
const DivGrid = ({
    rows,
    cols,
    cellSize,
    borderColor,
    fillColor,
    clickedCell,
    onCellClick, // Not used for hover logic but kept for API match
    interactive = false,
    className
}) => {
    return (
        <div
            className={cn("absolute inset-0 grid", className)}
            style={{
                gridTemplateColumns: `repeat(${cols}, 1fr)`,
                gridTemplateRows: `repeat(${rows}, 1fr)`,
            }}
        >
            {Array.from({ length: rows * cols }).map((_, i) => {
                const row = Math.floor(i / cols);
                const col = i % cols;
                const isActive = clickedCell && clickedCell.row === row && clickedCell.col === col;

                return (
                    <Cell
                        key={`${row}-${col}`}
                        isActive={isActive}
                        interactive={interactive}
                    />
                );
            })}
        </div>
    );
};

// Main Export
export const BackgroundRippleEffect = ({
    rows: initialRows = 8,
    cols: initialCols = 27,
    cellSize = 56,
    className
}) => {
    const [gridDimensions, setGridDimensions] = useState({ rows: initialRows, cols: initialCols });
    const [activeCell, setActiveCell] = useState(null);

    useEffect(() => {
        const calculateGrid = () => {
            const width = window.innerWidth;
            const height = window.innerHeight;
            setGridDimensions({
                cols: Math.ceil(width / cellSize),
                rows: Math.ceil(height / cellSize)
            });
        };

        calculateGrid();
        window.addEventListener("resize", calculateGrid);
        return () => window.removeEventListener("resize", calculateGrid);
    }, [cellSize]);

    // Global Hover Tracking
    useEffect(() => {
        const handleMouseMove = (e) => {
            const x = e.clientX;
            const y = e.clientY;
            const col = Math.floor(x / cellSize);
            const row = Math.floor(y / cellSize);
            setActiveCell({ row, col });
        };

        window.addEventListener("mousemove", handleMouseMove);
        return () => window.removeEventListener("mousemove", handleMouseMove);
    }, [cellSize]);

    return (
        <div className={cn("fixed inset-0 z-0 overflow-hidden pointer-events-none", className)}>
            <DivGrid
                rows={gridDimensions.rows}
                cols={gridDimensions.cols}
                cellSize={cellSize}
                borderColor="rgba(255,255,255,0.05)" // passed but not directly used in simplified Cell, can be used if we passed style
                fillColor="transparent"
                clickedCell={activeCell}
                interactive={true}
            />
        </div>
    );
};
