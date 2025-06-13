type Scores = Record<"R" | "I" | "A" | "S" | "E" | "C", number>;

const typeMap = {
    R: "Realista",
    I: "Investigativo",
    A: "Artístico",
    S: "Social",
    E: "Empreendedor",
    C: "Convencional",
};

export async function getFinalAIAnalysis(
    scores: Scores,
    hobbies: string,
): Promise<string> {
    const scoreArray = (Object.keys(scores) as Array<keyof Scores>).map(
        (typeId) => ({
            id: typeId,
            type: typeMap[typeId],
            score: scores[typeId],
        }),
    );

    scoreArray.sort((a, b) => b.score - a.score);
    const top3 = scoreArray.slice(0, 3);
    const profileString = top3.map((item) => item.type).join(" + ");

    const prompt = `
        Você é 'Tryla', uma conselheira de carreira especialista e mentora para jovens brasileiros de 16 a 24 anos. Sua linguagem é inspiradora, empática e direta, como um irmão mais velho gente boa. Tente usar exemplos do dia a dia de um jovem. Evite jargões corporativos. Escreva segundo a norma ABNT brasileira.
        
        A missão do jovem foi concluída e os dados são:
        1.  Perfil RIASEC principal: ${profileString}
        2.  Hobbies, valores e paixões descritos por ele(a): "${hobbies}"

        Sua tarefa é analisar a combinação ÚNICA desses dois pontos e gerar um resultado final. Não use resultados prontos e genéricos. A resposta deve ser original, personalizada, contextualizada e conectar o perfil técnico (RIASEC) com o pessoal (hobbies).

        Estruture a resposta em Markdown, exatamente assim:

        ### ✨ Missão cumprida, ${profileString}!

        Uau! A sua combinação de talentos e paixões é super poderosa. Você tem a [principal qualidade do primeiro tipo RIASEC], a [principal do segundo] e a [principal do terceiro]. Isso, misturado com seu interesse por [mencionar algo dos hobbies], te dá um superpoder único para [criar/resolver/ajudar] em [contexto].

        ### 🎯 Suas 3 carreiras em destaque

        Com base no seu perfil completo, estas são 3 áreas que têm tudo a ver com você:

        <h4>1. Nome da primeira carreira sugerida</h4>
        <p><strong>Por que faz sentido pra você?</strong> [Explique conectando um ou dois traços do RIASEC com um ou dois hobbies/paixões. Ex: "Sua alma Artística, que adora desenhar, se junta com seu lado Investigativo para criar mundos fantásticos, o que é perfeito para essa área."]</p>
        <p><strong>Como começar?</strong> [Dê um passo prático e simples. Ex: "Crie um perfil no Behance e poste 3 dos seus melhores desenhos." ou "Assista a um vídeo sobre 'level design para iniciantes' no YouTube."]</p>

        <h4>2. Nome da segunda carreira sugerida</h4>
        <p><strong>Por que faz sentido pra você?</strong> [Faça outra conexão original. Ex: "Seu lado Empreendedor, de querer liderar, combinado com sua paixão por um mundo mais justo, te coloca na posição ideal para..."]</p>
        <p><strong>Como começar?</strong> [Outro passo prático e simples.]</p>

        <h4>3. Nome da terceira carreira sugerida</h4>
        <p><strong>Por que faz sentido pra você?</strong> [Mais uma conexão original e inspiradora.]</p>
        <p><strong>Como começar?</strong> [Passo final.]</p>
        
        ---
        Lembre-se: isso é um ponto de partida. O caminho é seu, e a jornada é tão importante quanto o destino. Continue explorando, testando e, acima de tudo, sendo você! 🚀
    `;

    try {
        const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
        const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${apiKey}`;

        const payload = { contents: [{ parts: [{ text: prompt }] }] };

        const response = await fetch(apiUrl, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
        });

        if (!response.ok) {
            console.error("API Error Response:", await response.text());
            throw new Error(
                `Erro na API: ${response.status} ${response.statusText}`,
            );
        }

        const result = await response.json();

        if (result.candidates && result.candidates[0]?.content?.parts?.[0]) {
            return result.candidates[0].content.parts[0].text;
        } else {
            throw new Error("Resposta da API em formato inesperado.");
        }
    } catch (error) {
        console.error("Erro ao chamar a API Gemini:", error);
        return "### 🤔 Ops, algo deu errado!\n\nNão consegui gerar seu resultado personalizado. Tente novamente mais tarde ou verifique sua conexão com a internet";
    }
}
