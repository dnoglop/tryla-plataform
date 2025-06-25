import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';

// Definimos as propriedades que o nosso layout vai aceitar
interface AuthLayoutProps {
  children: React.ReactNode; // O conteúdo principal (o formulário)
  title: string;             // O título principal do card (ex: "Bem-vindo de volta!")
  description: string;       // A descrição abaixo do título
}

export const AuthLayout = ({ children, title, description }: AuthLayoutProps) => {
  return (
    // Container principal da página
    <div className="min-h-screen w-full bg-background font-nunito flex items-center justify-center p-4 relative overflow-hidden">

      {/* Efeitos de fundo com as cores do seu tema (exatamente como na SplashScreen) */}
      <div className="absolute inset-0 z-0 opacity-30 dark:opacity-20">
        <div className="absolute top-1/4 -left-1/4 w-96 h-96 lg:w-[32rem] lg:h-[32rem] bg-primary/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 -right-1/4 w-96 h-96 lg:w-[32rem] lg:h-[32rem] bg-secondary/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
      </div>
      <div className="absolute inset-0 z-0 animated-gradient-bg"></div>

      {/* Conteúdo Central Animado */}
      <motion.div
        className="relative z-10 w-full max-w-md"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
      >
        {/* Header com Logo e Títulos */}
        <motion.div
          className="text-center mb-8"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          {/* A logo agora é um link para a página inicial */}
          <Link to="/" className="inline-block">
            <motion.img 
              src="https://i.imgur.com/sxJhyH8.gif" 
              alt="Logo Tryla" 
              className="w-22 h-14 mx-auto"
              whileHover={{ scale: 1.05 }}
            />
          </Link>
          <h1 className="text-2xl font-bold mt-4 mb-2 text-foreground">
            {title}
          </h1>
          <p className="text-muted-foreground">
            {description}
          </p>
        </motion.div>

        {/* Card do Formulário: aqui é onde o {children} (seu formulário) será renderizado */}
        <motion.div
          className="bg-card/80 dark:bg-card/50 backdrop-blur-sm rounded-3xl p-6 sm:p-8 shadow-2xl shadow-primary/5 border border-border/50"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3, duration: 0.5 }}
        >
          {children}
        </motion.div>

        {/* Rodapé */}
        <motion.p 
          className="text-center text-xs text-muted-foreground/80 mt-8"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
        >
          © {new Date().getFullYear()} Tryla. Feito com carinho para o seu futuro.
        </motion.p>
      </motion.div>
    </div>
  );
};