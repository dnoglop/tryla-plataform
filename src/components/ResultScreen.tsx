
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
            {/* Card principal com gradiente adaptado ao tema */}
            <div className="relative overflow-hidden bg-gradient-to-br from-primary/10 to-primary/20 dark:from-primary/20 dark:to-primary/30 rounded-3xl shadow-xl border border-border">
                {/* Decoração de fundo */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-primary/20 to-transparent rounded-full -translate-y-16 translate-x-16"></div>
                <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-primary/30 to-transparent rounded-full translate-y-12 -translate-x-12"></div>

                {/* Conteúdo */}
                <div className="relative p-6 sm:p-8">
                    <div className="flex items-center justify-center mb-6">
                        <div className="p-3 bg-primary rounded-full shadow-lg">
                            <Lightbulb className="h-6 w-6 text-primary-foreground" />
                        </div>
                    </div>

                    <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-4">
                        Seu Perfil Vocacional
                    </h2>

                    <div
                        className="bg-card/80 backdrop-blur-sm p-6 rounded-2xl shadow-inner prose prose-slate dark:prose-invert max-w-none text-left border border-border/50"
                        dangerouslySetInnerHTML={{ __html: htmlContent }}
                    />
                </div>
            </div>

            {/* Card de recomendação adaptado ao tema */}
            <div className="bg-gradient-to-r from-primary to-primary/80 rounded-2xl shadow-lg p-6 text-primary-foreground">
                <div className="flex items-start gap-4">
                    <div className="p-2 bg-primary-foreground/20 rounded-lg shrink-0">
                        <Users className="h-6 w-6 text-primary-foreground" />
                    </div>
                    <div className="text-left">
                        <h3 className="font-bold text-lg mb-2">
                            Próximo Passo: Aprofunde seus Insights
                        </h3>
                        <p className="text-primary-foreground/80 leading-relaxed">
                            Estas informações são um ponto de partida para sua
                            jornada de autoconhecimento. Para explorar e
                            desenvolver ainda mais seu potencial, recomendamos
                            participar dos
                            <strong className="text-primary-foreground">
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
                    className="bg-primary hover:bg-primary/90 text-primary-foreground text-lg px-8 py-6 shadow-lg rounded-xl transition-all duration-300 hover:scale-105 hover:shadow-xl"
                >
                    <RefreshCw className="mr-2 h-5 w-5" />
                    Refazer Teste
                </Button>

                <Button
                    onClick={handleBackToLab}
                    variant="outline"
                    className="border-2 border-primary text-primary hover:bg-primary/10 text-lg px-8 py-6 shadow-lg rounded-xl transition-all duration-300 hover:scale-105 hover:shadow-xl"
                >
                    <ArrowLeft className="mr-2 h-5 w-5" />
                    Voltar ao Lab
                </Button>
            </div>
        </div>
    );
}
