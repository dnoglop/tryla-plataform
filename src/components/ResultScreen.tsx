import { useEffect, useState } from "react";
import Showdown from "showdown";
import { Button } from "@/components/ui/button";
import { RefreshCw, ArrowLeft, Lightbulb, Users } from "lucide-react";

interface ResultScreenProps {
    markdownContent: string;
    onRestart: () => void;
    onBackToLab?: () => void; // Nova função para voltar ao /lab
}

export function ResultScreen({
    markdownContent,
    onRestart,
    onBackToLab,
}: ResultScreenProps) {
    const [htmlContent, setHtmlContent] = useState("");

    useEffect(() => {
        const converter = new Showdown.Converter({ simpleLineBreaks: true });
        const html = converter.makeHtml(markdownContent);
        setHtmlContent(html);
    }, [markdownContent]);

    const handleBackToLab = () => {
        // Tenta usar a função passada como prop primeiro
        if (onBackToLab) {
            onBackToLab();
        } else {
            // Fallback: navegar diretamente usando window.location
            window.location.href = "/lab";
        }
    };

    return (
        <div className="text-center animate-fadeIn space-y-8">
            {/* Card principal com gradiente laranja */}
            <div className="relative overflow-hidden bg-gradient-to-br from-orange-50 to-orange-100 rounded-3xl shadow-xl border border-orange-200">
                {/* Decoração de fundo */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-orange-200/30 to-transparent rounded-full -translate-y-16 translate-x-16"></div>
                <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-orange-300/20 to-transparent rounded-full translate-y-12 -translate-x-12"></div>

                {/* Conteúdo */}
                <div className="relative p-6 sm:p-8">
                    <div className="flex items-center justify-center mb-6">
                        <div className="p-3 bg-orange-500 rounded-full shadow-lg">
                            <Lightbulb className="h-6 w-6 text-white" />
                        </div>
                    </div>

                    <h2 className="text-2xl md:text-3xl font-bold text-orange-900 mb-4">
                        Seu Perfil Vocacional
                    </h2>

                    <div
                        className="bg-white/70 backdrop-blur-sm p-6 rounded-2xl shadow-inner prose max-w-none text-left border border-orange-200/50"
                        dangerouslySetInnerHTML={{ __html: htmlContent }}
                    />
                </div>
            </div>

            {/* Card de recomendação */}
            <div className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-2xl shadow-lg p-6 text-white">
                <div className="flex items-start gap-4">
                    <div className="p-2 bg-white/20 rounded-lg shrink-0">
                        <Users className="h-6 w-6 text-white" />
                    </div>
                    <div className="text-left">
                        <h3 className="font-bold text-lg mb-2">
                            Próximo Passo: Aprofunde seus Insights
                        </h3>
                        <p className="text-orange-100 leading-relaxed">
                            Estas informações são um ponto de partida para sua
                            jornada de autoconhecimento. Para explorar e
                            desenvolver ainda mais seu potencial, recomendamos
                            participar dos
                            <strong className="text-white">
                                {" "}
                                programas de mentoria do Joule
                            </strong>
                            , onde você poderá refletir e trabalhar essas
                            descobertas de forma mais profunda e personalizada.
                        </p>
                    </div>
                </div>
            </div>

            {/* Botões de ação */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button
                    onClick={onRestart}
                    className="bg-orange-500 hover:bg-orange-600 text-white text-lg px-8 py-6 shadow-lg rounded-xl transition-all duration-300 hover:scale-105 hover:shadow-xl"
                >
                    <RefreshCw className="mr-2 h-5 w-5" />
                    Refazer Teste
                </Button>

                <Button
                    onClick={handleBackToLab}
                    variant="outline"
                    className="border-2 border-orange-500 text-orange-600 hover:bg-orange-50 text-lg px-8 py-6 shadow-lg rounded-xl transition-all duration-300 hover:scale-105 hover:shadow-xl"
                >
                    <ArrowLeft className="mr-2 h-5 w-5" />
                    Voltar ao Lab
                </Button>
            </div>
        </div>
    );
}
