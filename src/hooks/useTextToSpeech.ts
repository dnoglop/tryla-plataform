
import { useState, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export const useTextToSpeech = () => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const playText = async (text: string, voice: string = 'nova') => {
    if (isPlaying) {
      // Para o áudio atual
      stopAudio();
      return;
    }

    if (!text?.trim()) {
      toast.error("Não há conteúdo de texto para ler.");
      return;
    }

    setIsLoading(true);

    try {
      // Remove HTML tags do conteúdo para obter apenas o texto
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = text;
      const textContent = tempDiv.textContent || tempDiv.innerText || '';

      if (!textContent.trim()) {
        toast.error("Não há conteúdo de texto para ler.");
        setIsLoading(false);
        return;
      }

      console.log('Gerando áudio para o texto:', textContent.substring(0, 100) + '...');

      // Chama a edge function para gerar o áudio
      const { data, error } = await supabase.functions.invoke('text-to-speech', {
        body: { text: textContent, voice }
      });

      if (error) {
        console.error('Erro na edge function:', error);
        throw error;
      }

      if (!data?.audioContent) {
        throw new Error('Nenhum conteúdo de áudio foi gerado');
      }

      console.log('Áudio gerado com sucesso');

      // Converte base64 para blob e cria URL
      const audioBlob = base64ToBlob(data.audioContent, 'audio/mp3');
      const audioUrl = URL.createObjectURL(audioBlob);

      // Cria elemento de áudio e reproduz
      const audio = new Audio(audioUrl);
      audioRef.current = audio;

      audio.onplay = () => {
        setIsPlaying(true);
        setIsLoading(false);
        console.log('Reprodução iniciada');
      };

      audio.onended = () => {
        setIsPlaying(false);
        URL.revokeObjectURL(audioUrl);
        audioRef.current = null;
        console.log('Reprodução finalizada');
      };

      audio.onerror = (e) => {
        console.error('Erro ao reproduzir áudio:', e);
        setIsPlaying(false);
        setIsLoading(false);
        toast.error("Erro ao reproduzir o áudio.");
        URL.revokeObjectURL(audioUrl);
        audioRef.current = null;
      };

      await audio.play();

    } catch (error: any) {
      console.error('Erro ao gerar áudio:', error);
      toast.error(error.message || "Erro ao gerar áudio. Tente novamente.");
      setIsLoading(false);
      setIsPlaying(false);
    }
  };

  const stopAudio = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      setIsPlaying(false);
      console.log('Áudio interrompido');
    }
  };

  // Função utilitária para converter base64 para blob
  const base64ToBlob = (base64: string, mimeType: string) => {
    const byteCharacters = atob(base64);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    return new Blob([byteArray], { type: mimeType });
  };

  return {
    isPlaying,
    isLoading,
    playText,
    stopAudio
  };
};
