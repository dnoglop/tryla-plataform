"use client";
import React, { useState, useEffect } from "react";
import { motion } from "framer-motion"; // Usando import de framer-motion para consistência
import { cn } from "@/lib/utils";

type Direction = "TOP" | "LEFT" | "BOTTOM" | "RIGHT";

export function HoverBorderGradient({
  children,
  containerClassName,
  className,
  as: Tag = "button",
  duration = 2, // Deixei um pouco mais lento para um efeito mais suave
  clockwise = true,
  ...props
}: React.PropsWithChildren<
  {
    as?: React.ElementType;
    containerClassName?: string;
    className?: string;
    duration?: number;
    clockwise?: boolean;
  } & React.HTMLAttributes<HTMLElement>
>) {
  const [hovered, setHovered] = useState<boolean>(false);
  const [direction, setDirection] = useState<Direction>("TOP");

  // Função para rotacionar a direção da animação da borda
  const rotateDirection = (currentDirection: Direction): Direction => {
    const directions: Direction[] = ["TOP", "LEFT", "BOTTOM", "RIGHT"];
    const currentIndex = directions.indexOf(currentDirection);
    const nextIndex = clockwise
      ? (currentIndex - 1 + directions.length) % directions.length
      : (currentIndex + 1) % directions.length;
    return directions[nextIndex];
  };

  // --- ADAPTAÇÃO PARA O TEMA ---
  // Usando a cor primária do seu tema para o gradiente
  const movingMap: Record<Direction, string> = {
    TOP: `radial-gradient(20.7% 50% at 50% 0%, hsl(var(--primary)) 0%, rgba(255, 255, 255, 0) 100%)`,
    LEFT: `radial-gradient(16.6% 43.1% at 0% 50%, hsl(var(--primary)) 0%, rgba(255, 255, 255, 0) 100%)`,
    BOTTOM: `radial-gradient(20.7% 50% at 50% 100%, hsl(var(--primary)) 0%, rgba(255, 255, 255, 0) 100%)`,
    RIGHT: `radial-gradient(16.2% 41.19% at 100% 50%, hsl(var(--primary)) 0%, rgba(255, 255, 255, 0) 100%)`,
  };

  // O brilho ao passar o mouse também usa a cor primária, mas de forma mais intensa
  const highlight = `radial-gradient(75% 181.15% at 50% 50%, hsl(var(--primary)) 0%, rgba(255, 255, 255, 0) 100%)`;
  // --- FIM DA ADAPTAÇÃO ---

  useEffect(() => {
    if (!hovered) {
      const interval = setInterval(() => {
        setDirection((prevState) => rotateDirection(prevState));
      }, duration * 1000);
      return () => clearInterval(interval);
    }
  }, [hovered, duration, clockwise]);

  return (
    <Tag
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className={cn(
        "relative flex rounded-full content-center transition-all duration-500 items-center flex-col flex-nowrap gap-10 h-min justify-center overflow-visible p-px w-fit",
        containerClassName,
      )}
      {...props}
    >
      {/* O gradiente animado que forma a borda */}
      <motion.div
        className="flex-none inset-0 overflow-hidden absolute z-0 rounded-[inherit]"
        style={{
          filter: "blur(3px)",
          position: "absolute",
          width: "100%",
          height: "100%",
        }}
        initial={{ background: movingMap[direction] }}
        animate={{
          background: hovered
            ? [movingMap[direction], highlight]
            : movingMap[direction],
        }}
        transition={{ ease: "linear", duration: duration }}
      />

      {/* A "máscara" que cria o fundo do botão. Usa a cor primária. */}
      <div className="bg-primary absolute z-1 flex-none inset-[2px] rounded-[inherit]" />

      {/* O conteúdo do botão (texto, ícone). Fica por cima de tudo. */}
      <div
        className={cn(
          "w-auto text-primary-foreground z-10 bg-transparent px-4 py-2 rounded-[inherit]",
          className,
        )}
      >
        {children}
      </div>
    </Tag>
  );
}
