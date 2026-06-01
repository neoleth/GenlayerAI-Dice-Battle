import React, { useEffect, useState } from "react";
import { motion, useAnimation } from "motion/react";
import { cn } from "../lib/utils";

interface DiceProps {
  value: number;
  isRolling: boolean;
  color?: "gold" | "red" | "dark" | "silver";
  size?: "sm" | "md" | "lg";
}

export const Dice: React.FC<DiceProps> = ({ value, isRolling, color = "gold", size = "md" }) => {
  const [displayValue, setDisplayValue] = useState(value || 1);
  const controls = useAnimation();

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isRolling) {
      interval = setInterval(() => {
        setDisplayValue(Math.floor(Math.random() * 6) + 1);
      }, 100);

      controls.start({
        rotateX: [0, 360, 720, 1080],
        rotateY: [0, 360, 720, 1080],
        rotateZ: [0, 180, 360, 540],
        scale: [1, 1.1, 1],
        transition: { duration: 1.5, ease: "linear", repeat: Infinity },
      });
    } else {
      setDisplayValue(value);
      controls.stop();
      controls.start({
        rotateX: 0,
        rotateY: 0,
        rotateZ: 0,
        scale: 1,
        transition: { type: "spring", stiffness: 200, damping: 12 },
      });
    }

    return () => clearInterval(interval);
  }, [isRolling, value, controls]);

  const sizeClasses = {
    sm: "w-12 h-12 text-xl rounded-lg",
    md: "w-24 h-24 text-4xl rounded-xl",
    lg: "w-32 h-32 text-5xl rounded-2xl",
  };

  const colorClasses = {
    gold: "bg-[#1e1e24] border-2 border-[#d4af37] shadow-[0_0_20px_rgba(212,175,55,0.2)] text-[#d4af37]",
    red: "bg-[#1e1e24] border-2 border-[#8b0000] shadow-[0_0_20px_rgba(139,0,0,0.2)] text-[#8b0000]",
    dark: "bg-[#1e1e24] border-2 border-[#2a2a2e] text-[#e0e0e0]",
    silver: "bg-[#1e1e24] border-2 border-[#a0a0a5] text-[#e0e0e0]",
  };

  const renderDots = (val: number) => {
    const dotMap = [
      [], // 0 placeholder
      ["center"], // 1
      ["top-right", "bottom-left"], // 2
      ["top-right", "center", "bottom-left"], // 3
      ["top-left", "top-right", "bottom-left", "bottom-right"], // 4
      ["top-left", "top-right", "center", "bottom-left", "bottom-right"], // 5
      ["top-left", "middle-left", "bottom-left", "top-right", "middle-right", "bottom-right"], // 6
    ];

    const positions = dotMap[val] || dotMap[1];

    return (
      <div className="relative w-full h-full p-2">
        {positions.map((pos, i) => {
          let posClasses = "";
          switch (pos) {
            case "center": posClasses = "top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2"; break;
            case "top-left": posClasses = "top-2 left-2"; break;
            case "top-right": posClasses = "top-2 right-2"; break;
            case "bottom-left": posClasses = "bottom-2 left-2"; break;
            case "bottom-right": posClasses = "bottom-2 right-2"; break;
            case "middle-left": posClasses = "top-1/2 left-2 transform -translate-y-1/2"; break;
            case "middle-right": posClasses = "top-1/2 right-2 transform -translate-y-1/2"; break;
          }
          const bgColors = {
            gold: "bg-[#d4af37]",
            red: "bg-[#8b0000]",
            dark: "bg-[#e0e0e0]",
            silver: "bg-[#a0a0a5]",
          };
          return (
            <div
              key={i}
              className={cn(
                "absolute rounded-full",
                bgColors[color],
                posClasses,
                size === "sm" ? "w-2 h-2" : size === "md" ? "w-3 h-3" : "w-4 h-4"
              )}
            />
          );
        })}
      </div>
    );
  };

  return (
    <motion.div
      animate={controls}
      className={cn(
        "relative flex items-center justify-center font-bold",
        sizeClasses[size],
        colorClasses[color]
      )}
      style={{ transformStyle: "preserve-3d" }}
    >
      {renderDots(displayValue)}
    </motion.div>
  );
};
