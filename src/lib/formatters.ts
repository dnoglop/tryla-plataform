// ARQUIVO: src/utils/formatters.ts

/**
 * Formata um tempo em milissegundos para o formato mm:ss.
 * @param milliseconds - O tempo em milissegundos a ser formatado.
 * @returns Uma string no formato "mm:ss" ou "00:00" se a entrada for inválida.
 */
export const formatTime = (milliseconds: number): string => {
    if (typeof milliseconds !== 'number' || milliseconds < 0) {
      return '00:00';
    }
  
    const totalSeconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
  
    const formattedMinutes = String(minutes).padStart(2, '0');
    const formattedSeconds = String(seconds).padStart(2, '0');
  
    return `${formattedMinutes}:${formattedSeconds}`;
  };