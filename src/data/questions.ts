// src/data/questions.ts
export interface Question {
    text: string;
    type: "R" | "I" | "A" | "S" | "E" | "C";
  }
  
  export const questions: Question[] = [
      { text: "Gosto de consertar coisas ou montar equipamentos.", type: "R" },
      { text: "Prefiro trabalhar ao ar livre, com plantas ou animais.", type: "R" },
      { text: "Tenho habilidade com ferramentas e gosto de construir coisas com as mãos.", type: "R" },
      { text: "Curto pesquisar a fundo sobre temas que me deixam curioso(a).", type: "I" },
      { text: "Gosto de resolver quebra-cabeças e problemas que exigem lógica.", type: "I" },
      { text: "Me interesso por teorias científicas e em entender como o universo funciona.", type: "I" },
      { text: "Me sinto à vontade criando arte, conteúdo ou algo original.", type: "A" },
      { text: "Tenho uma imaginação fértil e gosto de me expressar de formas não convencionais.", type: "A" },
      { text: "Prefiro ambientes de trabalho com mais liberdade e sem muitas regras.", type: "A" },
      { text: "Gosto de ajudar pessoas e ouvir o que elas têm a dizer.", type: "S" },
      { text: "Me sinto bem trabalhando em equipe e colaborando com os outros.", type: "S" },
      { text: "Tenho facilidade em ensinar ou explicar coisas para as pessoas.", type: "S" },
      { text: "Tenho ideias e curto convencer os outros a acreditarem nelas.", type: "E" },
      { text: "Gosto de liderar projetos e assumir responsabilidades para fazer acontecer.", type: "E" },
      { text: "Sou uma pessoa competitiva e me sinto motivado(a) por metas e desafios.", type: "E" },
      { text: "Me dou bem com rotinas e processos organizados.", type: "C" },
      { text: "Gosto de trabalhar com números, dados e deixar tudo em ordem.", type: "C" },
      { text: "Prefiro ter instruções claras e um plano definido sobre o que preciso fazer.", type: "C" }
  ];