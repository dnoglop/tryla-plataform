// src/components/TextToSpeechPlayer.tsx
import React, { useState, useEffect } from 'react';

interface TextToSpeechPlayerProps {
  text: string; // O texto que será lido
  lang?: string; // Opcional: código do idioma (ex: 'pt-BR', 'en-US')
}

const TextToSpeechPlayer: React.FC<TextToSpeechPlayerProps> = ({ text, lang = 'pt-BR' }) => {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [selectedVoice, setSelectedVoice] = useState<SpeechSynthesisVoice | null>(null);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);

  // Carrega as vozes disponíveis
  useEffect(() => {
    const loadVoices = () => {
      const availableVoices = window.speechSynthesis.getVoices();
      if (availableVoices.length > 0) {
        setVoices(availableVoices);
        // Tenta selecionar uma voz para o idioma desejado
        const defaultVoice = availableVoices.find(voice => voice.lang === lang) || availableVoices[0];
        setSelectedVoice(defaultVoice);
      }
    };

    // 'voiceschanged' é disparado quando a lista de vozes está pronta
    window.speechSynthesis.onvoiceschanged = loadVoices;
    loadVoices(); // Chamar também caso já estejam carregadas

    return () => {
      window.speechSynthesis.onvoiceschanged = null; // Limpeza
      if (window.speechSynthesis.speaking) {
        window.speechSynthesis.cancel(); // Cancela a fala ao desmontar
      }
    };
  }, [lang]);

  const handlePlay = () => {
    if (!text || !selectedVoice) {
      console.warn("Texto ou voz não selecionados para TTS.");
      return;
    }
    if (window.speechSynthesis.speaking) {
      window.speechSynthesis.cancel(); // Se já estiver falando, pare antes de começar de novo
    }

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.voice = selectedVoice;
    utterance.lang = selectedVoice.lang; // Garante que o lang da utterance corresponda à voz
    utterance.pitch = 1;
    utterance.rate = 1;

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = (event) => {
      console.error('SpeechSynthesisUtterance.onerror', event);
      setIsSpeaking(false);
    };

    window.speechSynthesis.speak(utterance);
  };

  const handleStop = () => {
    window.speechSynthesis.cancel();
    setIsSpeaking(false);
  };

  const handlePause = () => {
    window.speechSynthesis.pause();
    setIsSpeaking(false); // Ou um estado 'isPaused'
  }

  const handleResume = () => {
    window.speechSynthesis.resume();
    setIsSpeaking(true); // Ou um estado 'isPaused'
  }


  return (
    <div>
      {voices.length > 0 && (
        <select
          value={selectedVoice?.name}
          onChange={(e) => {
            const newVoice = voices.find(v => v.name === e.target.value);
            if (newVoice) setSelectedVoice(newVoice);
          }}
          disabled={isSpeaking}
        >
          {voices.filter(v => v.lang.startsWith(lang.split('-')[0])) // Filtra por idioma base, ex: 'pt'
            .map((voice) => (
            <option key={voice.name} value={voice.name}>
              {voice.name} ({voice.lang})
            </option>
          ))}
           {voices.length > 0 && <option disabled>--- Outras Línguas ---</option>}
           {voices.filter(v => !v.lang.startsWith(lang.split('-')[0]))
            .map((voice) => (
            <option key={voice.name} value={voice.name}>
              {voice.name} ({voice.lang})
            </option>
          ))}
        </select>
      )}

      <button onClick={handlePlay} disabled={isSpeaking || !text || !selectedVoice}>
        {isSpeaking ? 'Falando...' : 'Ler Texto'}
      </button>
      {isSpeaking && (
        <>
          <button onClick={handlePause}>Pausar</button>
          <button onClick={handleResume}>Retomar</button>
          <button onClick={handleStop}>Parar</button>
        </>
      )}
    </div>
  );
};

export default TextToSpeechPlayer;