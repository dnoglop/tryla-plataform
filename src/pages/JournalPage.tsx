// src/pages/JournalPage.tsx

import React, { useState, useEffect } from "react";
import { useJournal } from "@/hooks/useJournal";
import { getJournalEntry } from "@/services/journalService";
import { getProfile, Profile } from "@/services/profileService";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";

// Componentes
import BottomNavigation from "@/components/BottomNavigation";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import JournalForm from "@/components/journal/JournalForm";
import DeleteJournalDialog from "@/components/journal/DeleteJournalDialog";

// Ícones
import {
  Plus,
  Search,
  Edit,
  Trash2,
  Heart,
  BookOpen,
  PenSquare,
  Lightbulb,
  Sparkles,
  ArrowLeft,
  X,
} from "lucide-react";

// --- SUBCOMPONENTES DA PÁGINA ---

const JournalHeader = ({ onNewEntryClick, onBackClick }) => ( // Adicionado onBackClick
  <motion.div
    variants={{ hidden: { y: -20, opacity: 0 }, visible: { y: 0, opacity: 1 } }}
    className="bg-gradient-to-br from-neutral-900 to-neutral-800 p-6 text-white"
  >
    <div className="flex justify-between items-center">
      {/* Botão de Voltar Adicionado */}
      <motion.button
        onClick={onBackClick}
        className="text-white/70 hover:text-white transition-colors -ml-2 p-2"
        aria-label="Voltar"
      >
        <ArrowLeft className="h-6 w-6" />
      </motion.button>

      <div className="text-center"> {/* Centralizando o título */}
        <h1 className="text-2xl font-extrabold text-white">Diário de Bordo</h1>
        <p className="text-white/70 text-sm mt-1">
          Suas ideias e 'eurekas'.
        </p>
      </div>

      <motion.button
        onClick={onNewEntryClick}
        className="bg-primary h-12 w-12 rounded-full flex items-center justify-center shadow-lg"
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        aria-label="Criar nova anotação"
      >
        <Plus className="h-6 w-6 text-primary-foreground" />
      </motion.button>
    </div>
  </motion.div>
);

const StatsBar = ({ entries }) => {
  const totalEntries = entries.length;
  const favoriteEntries = entries.filter((e) => e.is_favorite).length;
  const modulesWithEntries = new Set(
    entries.map((e) => e.module_id).filter(Boolean),
  ).size;
  return (
    <motion.div
      variants={{
        hidden: { y: 20, opacity: 0 },
        visible: { y: 0, opacity: 1 },
      }}
      className="grid grid-cols-3 gap-3 text-center bg-card p-3 rounded-2xl border"
    >
      <div>
        <p className="text-2xl font-bold text-foreground">{totalEntries}</p>
        <p className="text-xs text-muted-foreground">Anotações</p>
      </div>
      <div>
        <p className="text-2xl font-bold text-primary">{favoriteEntries}</p>
        <p className="text-xs text-muted-foreground">Favoritas</p>
      </div>
      <div>
        <p className="text-2xl font-bold text-foreground">
          {modulesWithEntries}
        </p>
        <p className="text-xs text-muted-foreground">Módulos</p>
      </div>
    </motion.div>
  );
};

const JournalEntryCard = ({ entry, onCardClick, onToggleFavorite }) => (
  <motion.div
    layout
    variants={{ hidden: { y: 20, opacity: 0 }, visible: { y: 0, opacity: 1 } }}
    exit={{ opacity: 0, y: -10 }}
    className="bg-card border rounded-2xl p-4 cursor-pointer group"
    onClick={() => onCardClick(entry)}
  >
    <div className="flex items-start justify-between gap-4">
      <div className="flex-1 min-w-0">
        <h3 className="font-bold text-foreground group-hover:text-primary transition-colors break-words">
          {entry.title}
        </h3>
        <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
          {entry.content_preview || entry.content}
        </p>
      </div>
      <motion.button
        onClick={(e) => {
          e.stopPropagation();
          onToggleFavorite(entry.id);
        }}
        whileTap={{ scale: 0.8 }}
        className="p-1 -mr-1"
        aria-label="Favoritar"
      >
        <Heart
          className={cn(
            "w-5 h-5 transition-colors",
            entry.is_favorite
              ? "text-red-500 fill-current"
              : "text-muted-foreground hover:text-red-400",
          )}
        />
      </motion.button>
    </div>
  </motion.div>
);

const JournalFormModal = ({ isOpen, onCancel, ...props }) => (
  <AnimatePresence>
    {isOpen && (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 pb-24"
        onClick={onCancel}
      >
        <motion.div
          initial={{ scale: 0.9, y: 20 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.9, y: -20 }}
          className="bg-card rounded-2xl p-6 w-full max-w-lg border"
          onClick={(e) => e.stopPropagation()}
        >
          <JournalForm {...props} onCancel={onCancel} />
        </motion.div>
      </motion.div>
    )}
  </AnimatePresence>
);

const JournalDetailModal = ({ entry, moduleName, moduleTags, isOpen, onClose, onEdit, onDelete }) => ( // <-- Adicionado 'onDelete'
    <AnimatePresence>{isOpen && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4 pb-24" onClick={onClose}>
            <motion.div initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: -20 }} transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                className="bg-card rounded-3xl w-full max-w-xl max-h-full border flex flex-col" onClick={(e) => e.stopPropagation()}>

                {/* Cabeçalho (sem alterações) */}
                <div className="p-6 pb-4 flex-shrink-0">
                    <div className="flex justify-between items-center">
                        <div className="flex items-center gap-3">
                            <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center", entry.module_id ? 'bg-primary/10' : 'bg-purple-500/10')}>
                                {entry.module_id ? <BookOpen className="w-6 h-6 text-primary" /> : <PenSquare className="w-6 h-6 text-purple-600" />}
                            </div>
                            <div>
                                <span className="text-sm font-semibold text-muted-foreground">{entry.module_id ? 'Anotação de Módulo' : 'Anotação Pessoal'}</span>
                                <p className="text-xs text-muted-foreground">{new Date(entry.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}</p>
                            </div>
                        </div>
                        <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full"><X className="w-5 h-5" /></Button>
                    </div>
                </div>

                {/* Conteúdo com Scroll (sem alterações) */}
                <div className="px-6 flex-grow overflow-y-auto"> 
                    <h2 className="text-2xl font-bold text-foreground mb-4">{entry.title}</h2>
                    <p className="text-base text-muted-foreground leading-relaxed whitespace-pre-wrap mb-6">{entry.content}</p>
                    {moduleTags && moduleTags.length > 0 && <div className="mb-6"><h4 className="text-sm font-semibold text-foreground mb-2">Tags do Módulo</h4><div className="flex flex-wrap gap-2">{moduleTags.map(tag => <div key={tag} className="bg-muted px-3 py-1 text-sm rounded-full text-muted-foreground">{tag}</div>)}</div></div>}
                    {moduleName && <div className="bg-muted p-4 rounded-xl mb-6"><h4 className="text-sm font-semibold text-foreground">Anotação do Módulo</h4><p className="text-sm text-muted-foreground">{moduleName}</p></div>}
                    <div className="bg-gradient-to-tr from-primary/10 to-transparent p-4 rounded-xl border border-primary/20">
                        <h4 className="text-base font-bold text-foreground mb-2 flex items-center gap-2"><Sparkles className="w-5 h-5 text-primary" />Feedback do Mentor IA</h4>
                        <p className="text-sm text-muted-foreground italic">{entry.ia_feedback || "Gerando feedback... Isso pode levar alguns segundos. Tente reabrir em instantes."}</p>
                    </div>
                </div>

                {/* Rodapé (COM BOTÃO DE DELETAR) */}
                <div className="p-6 pt-6 flex-shrink-0">
                    <div className="flex gap-3">
                        <Button variant="outline" className="w-full" onClick={onClose}>Fechar</Button>
                        <Button className="w-full" onClick={() => { onClose(); onEdit(entry); }}>Editar</Button>
                        {/* BOTÃO DE APAGAR ADICIONADO AQUI */}
                        <Button
                            variant="destructive"
                            onClick={() => {
                                onClose();
                                onDelete(entry.id);
                            }}
                        >
                            <Trash2 className="w-4 h-4" />
                        </Button>
                    </div>
                </div>
            </motion.div>
        </motion.div>
    )}</AnimatePresence>
);

// --- COMPONENTE PRINCIPAL ---
const JournalPage: React.FC = () => {
  const [profile, setProfile] = useState<Profile | null>(null);
  const navigate = useNavigate();
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);
  const {
    entries,
    filteredEntries,
    isLoading: isLoadingJournal,
    isCreating,
    setIsCreating,
    searchTerm,
    setSearchTerm,
    activeTab,
    setActiveTab,
    editingEntry,
    setEditingEntry,
    deleteId,
    setDeleteId,
    handleCreateEntry,
    handleUpdateEntry,
    handleToggleFavorite,
    handleConfirmDelete,
    getModuleNameById,
    modules,
  } = useJournal();
  const [selectedEntryDetail, setSelectedEntryDetail] = useState(null);

  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (user) setProfile(await getProfile(user.id));
      } catch (error) {
        console.error("Erro ao carregar o perfil:", error);
      } finally {
        setIsLoadingProfile(false);
      }
    };
    fetchUserProfile();
  }, []);

  const handleCardClick = async (entry) => {
    const fullEntry = await getJournalEntry(entry.id);
    if (fullEntry) {
      const module = fullEntry.module_id
        ? modules.find((m) => m.id === fullEntry.module_id)
        : null;
      setSelectedEntryDetail({
        ...fullEntry,
        moduleName: module ? module.name : null,
        moduleTags: module ? module.tags : [],
      });
    }
  };

  const handleEditFromDetail = (entry) => {
    setSelectedEntryDetail(null);
    setTimeout(() => setEditingEntry(entry), 150); // Pequeno delay para a animação de fechar acontecer
  };

  if (isLoadingJournal || isLoadingProfile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-10 font-nunito">
      <motion.div
        initial="hidden"
        animate="visible"
        variants={{
          hidden: {},
          visible: { transition: { staggerChildren: 0.1 } },
        }}
      >
        <JournalHeader
          onBackClick={() => navigate(-1)}
          onNewEntryClick={() => {
            setEditingEntry(null);
            setIsCreating(true);
          }}
        />
        <div className="p-4 space-y-6">
          <StatsBar entries={entries} />
          <motion.div
            variants={{
              hidden: { y: 20, opacity: 0 },
              visible: { y: 0, opacity: 1 },
            }}
            className="relative"
          >
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <input
              type="text"
              placeholder="Buscar anotações..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-card border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </motion.div>
          <motion.div
            variants={{
              hidden: { y: 20, opacity: 0 },
              visible: { y: 0, opacity: 1 },
            }}
            className="flex gap-2"
          >
            <Button
              variant={activeTab === "all" ? "default" : "outline"}
              onClick={() => setActiveTab("all")}
              className="flex-1"
            >
              Todas
            </Button>
            <Button
              variant={activeTab === "favorites" ? "default" : "outline"}
              onClick={() => setActiveTab("favorites")}
              className="flex-1"
            >
              Favoritas
            </Button>
          </motion.div>
          <AnimatePresence>
            {filteredEntries.length > 0 ? (
              <motion.div className="space-y-4">
                {filteredEntries.map((entry) => (
                  <JournalEntryCard
                    key={entry.id}
                    entry={entry}
                    onCardClick={handleCardClick}
                    onToggleFavorite={handleToggleFavorite}
                  />
                ))}
              </motion.div>
            ) : (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-10 bg-card rounded-lg"
              >
                <Lightbulb className="mx-auto h-12 w-12 text-muted-foreground/50 mb-4" />
                <h3 className="font-bold text-foreground">
                  Seu diário está em branco.
                </h3>
                <p className="text-sm text-muted-foreground">
                  Clique no botão '+' para registrar sua primeira ideia!
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>

      {/* CORREÇÃO APLICADA AQUI */}
      <JournalFormModal
        isOpen={isCreating || editingEntry !== null}
        onCancel={() => {
          setIsCreating(false);
          setEditingEntry(null);
        }}
        entry={editingEntry}
        userId={profile?.id}
        onSubmit={editingEntry ? handleUpdateEntry : handleCreateEntry}
      />

      <DeleteJournalDialog
        isOpen={deleteId !== null}
        onOpenChange={(open) => !open && setDeleteId(null)}
        onConfirmDelete={handleConfirmDelete}
      />

      <JournalDetailModal
        isOpen={!!selectedEntryDetail}
        entry={selectedEntryDetail}
        moduleName={selectedEntryDetail?.moduleName}
        moduleTags={selectedEntryDetail?.moduleTags}
        onClose={() => setSelectedEntryDetail(null)}
        onEdit={handleEditFromDetail}
        onDelete={setDeleteId}
      />

      <BottomNavigation />
    </div>
  );
};

export default JournalPage;
