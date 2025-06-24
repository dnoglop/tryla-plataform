// ARQUIVO: src/components/journey/ActionButton.tsx (VERSÃO CORRIGIDA)

"use client";
import React, { useState } from "react"; // <<<--- CORREÇÃO AQUI: useState foi adicionado
import { cn } from "@/lib/utils";
import { motion, useAnimate } from "framer-motion";

// Props do nosso botão de ação
interface ActionButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  onClick: () => Promise<any>; // O onClick agora DEVE retornar uma Promise
  initialText: string;
  loadingText: string;
  className?: string;
  // children não é mais necessário, pois usamos initialText
}

export const ActionButton = ({
  onClick,
  initialText,
  loadingText,
  className,
  ...props
}: ActionButtonProps) => {
  const [scope, animate] = useAnimate();
  const [status, setStatus] = useState<"idle" | "loading" | "success">("idle");

  const handleClick = async (event: React.MouseEvent<HTMLButtonElement>) => {
    if (status !== "idle") return;

    setStatus("loading");
    animate(
      ".loader",
      { width: "20px", scale: 1, display: "block" },
      { duration: 0.3, ease: "easeIn" }
    );

    try {
      await onClick(); 
      setStatus("success");
      await animate(".loader", { width: "0px", scale: 0 }, { duration: 0.2 });
      await animate(
        ".check",
        { width: "20px", scale: 1, display: "block" },
        { duration: 0.3, type: "spring", stiffness: 400, damping: 25 }
      );

      setTimeout(() => {
        animate(".check", { scale: 0, width: "0px" }, { duration: 0.2 });
        setStatus("idle");
      }, 1500);

    } catch (error) {
      console.error("Ação do botão falhou:", error);
      animate(".loader", { scale: 0, width: "0px" }, { duration: 0.2 });
      setStatus("idle");
    }
  };

  const buttonText = 
      status === 'loading' ? loadingText 
    : status === 'success' ? "Sucesso!" 
    : initialText;

  return (
    <motion.button
      ref={scope}
      layout
      disabled={status !== "idle"}
      className={cn(
        "flex min-w-[150px] cursor-pointer items-center justify-center gap-2 rounded-full px-6 py-3 h-14 text-lg font-bold text-primary-foreground ring-offset-2 transition-colors duration-200",
        "bg-primary hover:bg-primary/90",
        status === 'loading' && "bg-primary/70 cursor-wait",
        status === 'success' && "bg-green-500",
        className,
      )}
      {...props}
      onClick={handleClick}
    >
      <motion.div layout className="flex items-center gap-2">
        <Loader />
        <CheckIcon />
        <motion.span layout key={buttonText}>{buttonText}</motion.span>
      </motion.div>
    </motion.button>
  );
};

// --- ÍCONES INTERNOS (sem alterações) ---

const Loader = () => (
  <motion.svg
    animate={{ rotate: 360 }}
    initial={{ width: 0, scale: 0, display: "none" }}
    transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }}
    xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"
    fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
    className="loader"
  >
    <path d="M12 3a9 9 0 1 0 9 9" />
  </motion.svg>
);

const CheckIcon = () => (
  <motion.svg
    initial={{ width: 0, scale: 0, display: "none" }}
    xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"
    fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
    className="check"
  >
    <path d="M12 12m-9 0a9 9 0 1 0 18 0a9 9 0 1 0 -18 0" />
    <path d="M9 12l2 2l4 -4" />
  </motion.svg>
);