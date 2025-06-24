// src/components/journey/AudioVisualizer.tsx
import React, { useRef, useEffect } from 'react';

interface AudioVisualizerProps {
  audioElement: HTMLAudioElement | null;
  isPlaying: boolean;
}

// Criando um contexto de áudio reutilizável
let audioContext: AudioContext | null = null;
let sourceNode: MediaElementAudioSourceNode | null = null;

export const AudioVisualizer = ({ audioElement, isPlaying }: AudioVisualizerProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);

  useEffect(() => {
    if (audioElement && !audioContext) {
      audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      sourceNode = audioContext.createMediaElementSource(audioElement);
      analyserRef.current = audioContext.createAnalyser();
      analyserRef.current.fftSize = 256;
      sourceNode.connect(analyserRef.current);
      analyserRef.current.connect(audioContext.destination);
    }

    const analyser = analyserRef.current;
    if (!isPlaying || !analyser || !canvasRef.current || !audioContext) return;

    // Resume o contexto de áudio se estiver suspenso (necessário para o autoplay em alguns navegadores)
    if (audioContext.state === 'suspended') {
      audioContext.resume();
    }

    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    const canvas = canvasRef.current;
    const canvasCtx = canvas.getContext('2d');
    let animationFrameId: number;

    const draw = () => {
      animationFrameId = requestAnimationFrame(draw);
      analyser.getByteFrequencyData(dataArray);

      if (!canvasCtx || !canvas) return;
      canvasCtx.clearRect(0, 0, canvas.width, canvas.height);
      const barWidth = (canvas.width / bufferLength) * 2;
      let x = 0;

      for (let i = 0; i < bufferLength; i++) {
        const barHeight = dataArray[i] / 2.5;
        // Usando a cor primária via variável CSS
        const primaryColor = getComputedStyle(document.documentElement).getPropertyValue('--primary').trim();
        canvasCtx.fillStyle = `hsl(${primaryColor}, ${barHeight / 100 * 50 + 50}%, ${barHeight / 100 * 30 + 40}%)`;
        canvasCtx.fillRect(x, canvas.height - barHeight, barWidth, barHeight);
        x += barWidth + 1;
      }
    };

    draw();

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [isPlaying, audioElement]);

  return (
    <canvas 
      ref={canvasRef} 
      width="150" 
      height="40" 
      className="transition-opacity duration-500" 
      style={{ opacity: isPlaying ? 1 : 0.2 }} 
    />
  );
};