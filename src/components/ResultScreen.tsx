import { useEffect, useState } from 'react';
import Showdown from 'showdown';
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';

interface ResultScreenProps {
  markdownContent: string;
  onRestart: () => void; // Função para reiniciar o teste
}

export function ResultScreen({ markdownContent, onRestart }: ResultScreenProps) {
  const [htmlContent, setHtmlContent] = useState('');

  useEffect(() => {
    const converter = new Showdown.Converter({ simpleLineBreaks: true });
    const html = converter.makeHtml(markdownContent);
    setHtmlContent(html);
  }, [markdownContent]);

  return (
    // O container principal que será renderizado na página
    <div className="text-center animate-fadeIn">
        {/* O card com o resultado */}
        <div
            className="bg-white p-6 sm:p-8 rounded-2xl shadow-md border border-slate-200/80 prose max-w-none text-left"
            dangerouslySetInnerHTML={{ __html: htmlContent }}
        />
        {/* Botão para refazer o teste */}
        <Button 
            onClick={onRestart}
            className="mt-8 bg-orange-500 hover:bg-orange-600 text-lg px-8 py-6 shadow-lg"
        >
            <RefreshCw className="mr-2 h-5 w-5" />
            Fazer novamente
        </Button>
    </div>
  );
}