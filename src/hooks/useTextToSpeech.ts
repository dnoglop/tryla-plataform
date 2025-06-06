import { useState, useEffect, useCallback } from 'react';

// Opções para a função de tocar texto
export interface PlayTextOptions {
  lang?: string;
  rate?: number;
  voice?: SpeechSynthesisVoice | null;
}

// O que o hook retorna
export interface TextToSpeechControls {
  isPlaying: boolean;
  isLoading: boolean;
  playText: (text: string, options?: PlayTextOptions) => void;
  stopAudio: () => void;
  getVoicesByLang: (targetLang?: string) => SpeechSynthesisVoice[];
}

export const useTextToSpeech = (): TextToSpeechControls => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false); // Para carregar as vozes
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);

  // Carrega as vozes disponíveis quando o componente é montado
  useEffect(() => {
    const loadVoices = () => {
      const availableVoices = window.speechSynthesis.getVoices();
      if (availableVoices.length > 0) {
        setVoices(availableVoices);
        setIsLoading(false);
      }
    };

    // A lista de vozes pode carregar de forma assíncrona
    if ('onvoiceschanged' in window.speechSynthesis) {
      window.speechSynthesis.onvoiceschanged = loadVoices;
    }
    
    // Carrega vozes que já possam estar disponíveis
    loadVoices();

    // Limpeza
    return () => {
      window.speechSynthesis.onvoiceschanged = null;
    };
  }, []);

  // Função para parar a fala
  const stopAudio = useCallback(() => {
    window.speechSynthesis.cancel();
    setIsPlaying(false);
  }, []);

  // Função para iniciar a fala
  const playText = useCallback((text: string, options: PlayTextOptions = {}) => {
    // Se já estiver falando, para primeiro
    if (window.speechSynthesis.speaking) {
      stopAudio();
      return;
    }
    
    // Limpa o texto para uma melhor pronúncia
    const cleanText = text.replace(/<[^>]*>?/gm, ' ').replace(/\s+/g, ' ').trim();
    if (!cleanText) return;

    const utterance = new SpeechSynthesisUtterance(cleanText);
    
    // Configurações
    utterance.lang = options.lang || 'pt-BR';
    utterance.rate = options.rate || 1.1;
    
    // Tenta encontrar uma voz preferida
    if (options.voice) {
      utterance.voice = options.voice;
    } else {
      const ptVoice = voices.find(v => v.lang === 'pt-BR');
      if (ptVoice) utterance.voice = ptVoice;
    }

    // Eventos para controlar o estado
    utterance.onstart = () => {
      setIsPlaying(true);
    };

    utterance.onend = () => {
      setIsPlaying(false);
    };

    utterance.onerror = (event) => {
      console.error("Erro na síntese de fala:", event);
      setIsPlaying(false);
    };

    window.speechSynthesis.speak(utterance);
  }, [voices, stopAudio]);


  // Função para obter vozes por idioma
  const getVoicesByLang = useCallback((targetLang = 'pt-BR') => {
    return voices.filter(voice => voice.lang.startsWith(targetLang));
  }, [voices]);


  // Garante que a fala pare se o componente for desmontado
  useEffect(() => {
    return () => {
      stopAudio();
    };
  }, [stopAudio]);

  return { isPlaying, isLoading, playText, stopAudio, getVoicesByLang };
};