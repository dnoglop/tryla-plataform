import { useState, useEffect, useRef } from 'react';
import { toast } from 'sonner';

interface PlayTextOptions {
  lang?: string;
  rate?: number;
  pitch?: number;
  voice?: SpeechSynthesisVoice | null;
}

export const useTextToSpeech = () => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([]);
  const synthRef = useRef<SpeechSynthesis | null>(null);

  const watchdogTimerRef = useRef<number | null>(null);
  const speakAttemptTimerRef = useRef<number | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      synthRef.current = window.speechSynthesis;
    } else {
      console.warn("SpeechSynthesis API não é suportada neste navegador.");
      return;
    }

    const currentSynth = synthRef.current;

    const loadVoices = () => {
      if (currentSynth) {
        const voices = currentSynth.getVoices();
        if (voices.length > 0) {
          setAvailableVoices(voices);
        }
      }
    };

    if (currentSynth) {
      // Chamar uma vez, pois em alguns navegadores as vozes já podem estar disponíveis
      loadVoices();
      // O evento 'onvoiceschanged' é a forma mais confiável de obter as vozes
      currentSynth.onvoiceschanged = loadVoices;
    }

    return () => {
      const synth = synthRef.current;
      if (synth) {
        if (utteranceRef.current) {
            utteranceRef.current.onstart = null;
            utteranceRef.current.onend = null;
            utteranceRef.current.onerror = null;
        }
        if (synth.speaking || synth.pending) {
          synth.cancel();
        }
        synth.onvoiceschanged = null;
      }
      utteranceRef.current = null;
      if (watchdogTimerRef.current !== null) window.clearTimeout(watchdogTimerRef.current);
      if (speakAttemptTimerRef.current !== null) window.clearTimeout(speakAttemptTimerRef.current);
    };
  }, []);


  const playText = (
    text: string,
    options: PlayTextOptions = {}
  ) => {
    const synth = synthRef.current;
    const {
      lang = 'pt-BR',
      rate = 1.0,
      pitch = 1.0,
      voice = null
    } = options;

    if (!synth) {
      toast.error("Funcionalidade de leitura não suportada.");
      return;
    }
    
    // Limpa timers pendentes de execuções anteriores
    if (speakAttemptTimerRef.current !== null) window.clearTimeout(speakAttemptTimerRef.current);
    if (watchdogTimerRef.current !== null) window.clearTimeout(watchdogTimerRef.current);

    // Se já está tocando ou carregando, a ação do usuário é parar
    if (isLoading || isPlaying) {
      stopAudio();
      return;
    }

    if (!text?.trim()) {
      toast.error("Não há conteúdo para ler.");
      return;
    }

    setIsLoading(true);
    setIsPlaying(false);

    // Extrai texto puro do HTML para leitura
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = text;
    const textContent = tempDiv.textContent || tempDiv.innerText || '';
    if (!textContent.trim()) {
      toast.error("Não há conteúdo de texto puro para ler.");
      setIsLoading(false);
      return;
    }

    // Limpa listeners da utterance anterior, se houver
    if (utteranceRef.current) {
      utteranceRef.current.onstart = null;
      utteranceRef.current.onend = null;
      utteranceRef.current.onerror = null;
    }

    const newUtterance = new SpeechSynthesisUtterance(textContent);
    
    newUtterance.lang = lang;
    newUtterance.rate = Math.max(0.1, Math.min(rate, 10)); // Garante que a velocidade esteja no range válido
    newUtterance.pitch = Math.max(0, Math.min(pitch, 2)); // Garante que o tom esteja no range válido

    if (voice) {
      newUtterance.voice = voice;
    } else if (availableVoices.length > 0) {
      // Fallback para encontrar a melhor voz pt-BR disponível
      const fallbackVoice = availableVoices.find(v => v.lang === 'pt-BR' && v.name.includes('Google') && !v.localService) ||
                          availableVoices.find(v => v.lang === 'pt-BR' && !v.localService) ||
                          availableVoices.find(v => v.lang === 'pt-BR' && v.default) ||
                          availableVoices.find(v => v.lang === 'pt-BR') ||
                          availableVoices.find(v => v.lang.startsWith('pt'));
      if (fallbackVoice) {
        newUtterance.voice = fallbackVoice;
      }
    }
    
    const clearWatchdogLocal = () => {
      if (watchdogTimerRef.current !== null) {
        window.clearTimeout(watchdogTimerRef.current);
        watchdogTimerRef.current = null;
      }
    };

    newUtterance.onstart = () => {
      clearWatchdogLocal();
      // Garante que o estado seja atualizado apenas para a utterance atual
      if (utteranceRef.current === newUtterance) {
        setIsLoading(false);
        setIsPlaying(true);
      }
    };

    newUtterance.onend = () => {
      clearWatchdogLocal();
      if (utteranceRef.current === newUtterance) {
        setIsPlaying(false);
        utteranceRef.current = null;
      }
    };

    newUtterance.onerror = (event: SpeechSynthesisErrorEvent) => {
      clearWatchdogLocal();
      console.error(`Erro na síntese de fala: ${event.error}`);
      if (utteranceRef.current === newUtterance) {
        toast.error(`Erro ao ler: ${event.error || 'desconhecido'}`);
        setIsPlaying(false);
        setIsLoading(false);
        utteranceRef.current = null;
      }
    };
    
    // Cancela qualquer fala pendente antes de iniciar uma nova
    if (synth.speaking || synth.pending) {
      synth.cancel();
    }
    
    utteranceRef.current = newUtterance;

    // Pequeno delay para garantir que 'cancel' tenha tempo de executar
    speakAttemptTimerRef.current = window.setTimeout(() => {
      if (utteranceRef.current === newUtterance) {
        synth.speak(utteranceRef.current);

        // Watchdog para caso o 'onstart' não dispare (bug em alguns navegadores)
        watchdogTimerRef.current = window.setTimeout(() => {
          if (isLoading && utteranceRef.current === newUtterance) {
            setIsLoading(false); // Força o estado de loading para false
          }
        }, 2500);
      }
    }, 100);
  };

  const stopAudio = () => {
    const synth = synthRef.current;

    if (speakAttemptTimerRef.current !== null) window.clearTimeout(speakAttemptTimerRef.current);
    if (watchdogTimerRef.current !== null) window.clearTimeout(watchdogTimerRef.current);
    speakAttemptTimerRef.current = null;
    watchdogTimerRef.current = null;

    if (synth) {
      if (utteranceRef.current) {
        utteranceRef.current.onstart = null;
        utteranceRef.current.onend = null;
        utteranceRef.current.onerror = null;
      }
      if (synth.speaking || synth.pending) {
        synth.cancel();
      }
      utteranceRef.current = null;
    }
    setIsPlaying(false);
    setIsLoading(false);
  };

  const getVoicesByLang = (targetLang: string = 'pt-BR'): SpeechSynthesisVoice[] => {
    // Filtra vozes que começam com o código de idioma principal (ex: 'pt' para pegar 'pt-BR' e 'pt-PT')
    return availableVoices.filter(v => v.lang.startsWith(targetLang.split('-')[0]));
  };

  return {
    isPlaying,
    isLoading,
    playText,
    stopAudio,
    getVoicesByLang,
  };
};