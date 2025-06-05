// src/components/GeminiReader.tsx
import React, { useState } from 'react';
import { supabase } from '@/lib/supabaseClient'; // Supondo que você tenha configurado o cliente Supabase
import TextToSpeechPlayer from './TextToSpeechPlayer';

const GeminiReader: React.FC = () => {
  const [prompt, setPrompt] = useState('');
  const [generatedText, setGeneratedText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGenerateText = async () => {
    if (!prompt.trim()) {
      setError("Por favor, insira um prompt.");
      return;
    }
    setIsLoading(true);
    setError(null);
    setGeneratedText('');

    try {
      const { data, error: functionError } = await supabase.functions.invoke('call-gemini', {
        body: { prompt },
      });

      if (functionError) throw functionError;

      if (data && data.generatedText) {
        setGeneratedText(data.generatedText);
      } else {
        throw new Error(data?.error || "Resposta inesperada da função.");
      }
    } catch (e: any) {
      console.error("Erro ao chamar a função do Supabase:", e);
      setError(e.message || "Falha ao gerar texto.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      <h2>Gerar Texto com Gemini e Ler</h2>
      <textarea
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        placeholder="Digite seu prompt para o Gemini..."
        rows={4}
        cols={50}
        disabled={isLoading}
      />
      <br />
      <button onClick={handleGenerateText} disabled={isLoading}>
        {isLoading ? 'Gerando...' : 'Gerar e Preparar Leitura'}
      </button>

      {error && <p style={{ color: 'red' }}>Erro: {error}</p>}

      {generatedText && (
        <div>
          <h3>Texto Gerado:</h3>
          <p>{generatedText}</p>
          <TextToSpeechPlayer text={generatedText} lang="pt-BR" />
        </div>
      )}
    </div>
  );
};

export default GeminiReader;