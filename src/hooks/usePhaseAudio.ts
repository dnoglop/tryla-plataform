
import { useState, useCallback } from 'react';
import { useTextToSpeech } from '@/hooks/useTextToSpeech';
import { toast } from 'sonner';

export const usePhaseAudio = () => {
    const {
        isPlaying,
        isLoading: isLoadingAudio,
        playText,
        stopAudio,
    } = useTextToSpeech();
    
    const [speechRate, setSpeechRate] = useState(1.15);
    const [lastReadPosition, setLastReadPosition] = useState(0);
    const [isPaused, setIsPaused] = useState(false);
    const speedOptions = [1.15, 1.25, 1.5];

    const getTextFromPosition = useCallback((text: string, position: number): string => {
        const words = text.split(' ');
        return words.slice(position).join(' ');
    }, []);

    const handleReadContent = useCallback((textContent: string | null) => {
        if (!textContent) return;
        
        if (isPlaying) {
            stopAudio();
            setIsPaused(true);
        } else {
            const cleanText = textContent.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
            
            const textToRead = isPaused ? getTextFromPosition(cleanText, lastReadPosition) : cleanText;
            
            if (!isPaused) {
                setLastReadPosition(0);
            }
            
            playText(textToRead, { lang: 'pt-BR', rate: speechRate });
            setIsPaused(false);
        }
    }, [isPlaying, isPaused, lastReadPosition, speechRate, stopAudio, playText, getTextFromPosition]);

    const handleSpeedChange = useCallback((textContent: string | null) => {
        const currentIndex = speedOptions.indexOf(speechRate);
        const nextIndex = (currentIndex + 1) % speedOptions.length;
        const newSpeed = speedOptions[nextIndex];
        setSpeechRate(newSpeed);
        
        if (isPlaying && textContent) {
            stopAudio();
            setTimeout(() => {
                const cleanText = textContent.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
                const textToRead = getTextFromPosition(cleanText, lastReadPosition);
                playText(textToRead, { lang: 'pt-BR', rate: newSpeed });
            }, 100);
        }
        
        toast.info(`Velocidade alterada para ${newSpeed}x`);
    }, [speechRate, isPlaying, lastReadPosition, stopAudio, playText, getTextFromPosition]);

    const handleResetAudio = useCallback(() => {
        stopAudio();
        setLastReadPosition(0);
        setIsPaused(false);
        toast.info("Posição do áudio resetada");
    }, [stopAudio]);

    return {
        isPlaying,
        isLoadingAudio,
        isPaused,
        speechRate,
        handleReadContent,
        handleSpeedChange,
        handleResetAudio,
        stopAudio,
    };
};
