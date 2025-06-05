// hooks/useTextToSpeech.ts
import { useState, useEffect, useRef } from 'react';
import { toast } from 'sonner';

export const useTextToSpeech = () => {
  const [isPlaying, setIsPlaying] = useState(false);
  // isLoading não é tão relevante para Web Speech API da mesma forma que para uma chamada de rede,
  // mas podemos mantê-lo para consistência se houver algum setup inicial.
  const [isLoading, setIsLoading] = useState(false); 
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  // Carrega as vozes e garante que o speechSynthesis está disponível
  useEffect(() => {
    const synth = window.speechSynthesis;
    if (!synth) {
      console.warn("Web Speech API não suportada neste navegador.");
      return;
    }

    // O evento 'voiceschanged' é importante para garantir que as vozes estão carregadas
    // antes de tentar usá-las.
    const loadVoices = () => {
      const voices = synth.getVoices();
      if (voices.length > 0) {
        // console.log("Vozes carregadas:", voices);
        // Você poderia adicionar lógica aqui para pré-selecionar uma voz, se quisesse.
      }
    };

    synth.onvoiceschanged = loadVoices;
    loadVoices(); // Chamar uma vez caso já estejam carregadas

    // Limpeza ao desmontar o hook
    return () => {
      if (synth.speaking) {
        synth.cancel();
      }
      synth.onvoiceschanged = null;
    };
  }, []);

  const playText = (text: string, lang: string = 'pt-BR') => {
    const synth = window.speechSynthesis;

    if (!synth) {
      toast.error("Funcionalidade de leitura não suportada neste navegador.");
      return;
    }

    if (isPlaying) { // Se já está falando, o clique deve parar
      stopAudio();
      return;
    }

    if (!text?.trim()) {
      toast.error("Não há conteúdo de texto para ler.");
      return;
    }

    setIsLoading(true); // Pode ser breve, apenas para indicar início

    // Remove HTML tags do conteúdo para obter apenas o texto
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = text;
    const textContent = tempDiv.textContent || tempDiv.innerText || '';

    if (!textContent.trim()) {
      toast.error("Não há conteúdo de texto puro para ler.");
      setIsLoading(false);
      return;
    }

    const utterance = new SpeechSynthesisUtterance(textContent);
    utteranceRef.current = utterance;

    // Tenta selecionar a voz apropriada
    const voices = synth.getVoices();
    let selectedVoice = voices.find(v => v.lang === lang && (v.localService || !v.name.toLowerCase().includes('network'))); // Prioriza vozes locais
    if (!selectedVoice) {
      selectedVoice = voices.find(v => v.lang.startsWith(lang.split('-')[0]) && (v.localService || !v.name.toLowerCase().includes('network')));
    }
    if (!selectedVoice && voices.length > 0) { // Fallback para qualquer voz se a específica não for encontrada
        selectedVoice = voices.find(v => v.lang === lang) || voices.find(v => v.lang.startsWith(lang.split('-')[0])) || voices[0];
    }
    
    if (selectedVoice) {
      utterance.voice = selectedVoice;
      // console.log("Voz selecionada:", selectedVoice.name, selectedVoice.lang);
    } else if (voices.length === 0) {
        // console.warn("Nenhuma voz de TTS disponível. O navegador usará a padrão do sistema.");
        // Definir a lang da utterance pode ajudar o navegador a escolher.
        utterance.lang = lang;
    } else {
        // console.warn(`Nenhuma voz encontrada para ${lang}. Usando a primeira voz disponível ou padrão.`);
        utterance.voice = voices[0]; // Usar a primeira como fallback se houver vozes
        utterance.lang = lang; // Ou utterance.lang = voices[0].lang;
    }


    utterance.onstart = () => {
      setIsPlaying(true);
      setIsLoading(false);
      console.log('Reprodução iniciada (Web Speech API)');
    };

    utterance.onend = () => {
      setIsPlaying(false);
      utteranceRef.current = null;
      console.log('Reprodução finalizada (Web Speech API)');
    };

    utterance.onerror = (event) => {
      console.error('Erro na Web Speech API:', event);
      toast.error(`Erro ao tentar ler: ${event.error || 'Erro desconhecido'}`);
      setIsPlaying(false);
      setIsLoading(false);
      utteranceRef.current = null;
    };
    
    // Cancela qualquer fala anterior antes de iniciar uma nova
    if (synth.speaking) {
        synth.cancel();
    }
    // Um pequeno timeout pode ajudar em alguns navegadores se as vozes ainda estiverem carregando
    // ou se o cancel() não for imediato.
    setTimeout(() => {
        synth.speak(utterance);
    }, 100);


  }; // Fim de playText

  const stopAudio = () => {
    const synth = window.speechSynthesis;
    if (synth && synth.speaking) {
      synth.cancel(); // Isso vai disparar o evento 'onend' ou 'onerror' da utterance
      setIsPlaying(false); // Força o estado caso o onend não seja imediato
      utteranceRef.current = null;
      console.log('Áudio interrompido (Web Speech API)');
    }
  };

  return {
    isPlaying,
    isLoading,
    playText,
    stopAudio,
  };
};