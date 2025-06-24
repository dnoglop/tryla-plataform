// src/components/journey/InteractiveCard.tsx
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import React, { useRef } from "react";
import { cn } from "@/lib/utils";
import { Award, Lock } from "lucide-react";

interface InteractiveCardProps {
  children: React.ReactNode;
  className?: string;
  onClick?: (event: React.MouseEvent<HTMLDivElement>) => void;
  isLocked?: boolean;
}

export const InteractiveCard = ({
  children,
  className,
  onClick,
  isLocked = false,
}: InteractiveCardProps) => {
  const ref = useRef<HTMLDivElement>(null);
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!ref.current || isLocked) return;
    const { left, top, width, height } = ref.current.getBoundingClientRect();
    mouseX.set(e.clientX - left - width / 2);
    mouseY.set(e.clientY - top - height / 2);
  };

  const handleMouseLeave = () => {
    mouseX.set(0);
    mouseY.set(0);
  };

  const springConfig = { stiffness: 150, damping: 20, mass: 0.1 };
  const rotateX = useSpring(
    useTransform(mouseY, [-150, 150], [10, -10]),
    springConfig,
  );
  const rotateY = useSpring(
    useTransform(mouseX, [-150, 150], [-10, 10]),
    springConfig,
  );

  const glareX = useTransform(mouseX, [-150, 150], [-50, 150]);
  const glareY = useTransform(mouseY, [-150, 150], [-50, 150]);

  return (
    <motion.div
      ref={ref}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onClick={!isLocked ? onClick : undefined}
      style={{
        transformStyle: "preserve-3d",
        perspective: "1000px",
        rotateX,
        rotateY,
      }}
      className={cn(
        "relative w-full h-full rounded-3xl bg-card shadow-lg transition-all duration-500",
        isLocked
          ? "cursor-not-allowed opacity-60"
          : "cursor-pointer hover:shadow-2xl hover:shadow-primary/20",
        className,
      )}
    >
      <div
        style={{ transform: "translateZ(40px)", transformStyle: "preserve-3d" }}
        className="w-full h-full p-5 flex flex-col justify-between bg-card/90 rounded-3xl border border-border/50"
      >
        {children}
      </div>
      {!isLocked && (
        <motion.div
          className="absolute inset-0 rounded-3xl pointer-events-none"
          style={{
            background: `radial-gradient(circle at ${glareX}% ${glareY}%, hsla(var(--primary-rgb), 0.1), transparent 60%)`,
            opacity: useTransform(mouseY, [-100, 100], [0.5, 0]),
            transition: "opacity 0.2s",
          }}
        />
      )}
    </motion.div>
  );
};

// Componente específico para o Portal do Reino
export const RealmPortalCard = ({
  module,
  progress,
  completed,
  locked,
  onClick,
}) => (
  <InteractiveCard isLocked={locked} onClick={onClick}>
    <>
      <div>
        <div className="flex justify-between items-start">
          <span className="text-4xl" style={{ transform: "translateZ(20px)" }}>
            {module.emoji || "🚀"}
          </span>
          {locked && <Lock className="w-5 h-5 text-muted-foreground" />}
          {completed && <Award className="w-6 h-6 text-yellow-500" />}
        </div>
        <h3 className="text-lg font-bold text-card-foreground mt-3">
          {module.name}
        </h3>
        <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
          {module.description}
        </p>
      </div>
      <div className="mt-4">
        <div className="essencia-bar">
          <motion.div
            className="essencia-valor"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 1, ease: "easeOut" }}
          />
        </div>
        <p className="text-xs text-muted-foreground mt-1.5">
          {Math.round(progress)}% explorado
        </p>
      </div>
    </>
  </InteractiveCard>
);
