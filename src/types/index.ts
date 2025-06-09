// src/types/index.ts

export interface Profile {
    id: string;                      // Chave primária, geralmente UUID do Supabase Auth
    created_at?: string;             // Data de criação, opcional se o Supabase gerencia
    updated_at?: string;             // Data da última atualização, opcional
    username: string | null;         // Nome de usuário
    full_name: string | null;        // Nome completo
    avatar_url: string | null;       // URL da imagem de perfil
    bio: string | null;              // Biografia do usuário
    linkedin_url: string | null;     // URL do perfil do LinkedIn
    xp?: number;                     // Pontos de experiência (opcional)
    level?: number;                  // Nível do usuário (opcional)
    streak_days?: number;            // Dias de ofensiva (opcional)
    last_login?: string;             // Data do último login (opcional)
    
    // Adicione aqui QUALQUER OUTRO CAMPO que exista na sua tabela 'profiles' no Supabase.
    // Exemplos:
    // email?: string; // Se você armazena o email na tabela profiles também
    // phone?: string | null;
    // birthday?: string | null; // Datas geralmente são strings no formato ISO (YYYY-MM-DD)
  }
  
  // Se você tiver outras entidades no seu aplicativo, como Módulos, Fases, etc.,
  // você pode definir as interfaces para elas aqui também.
  // Exemplo:
  /*
  export interface Module {
    id: string;
    name: string;
    description: string | null;
    created_at?: string;
    // ...outros campos do módulo
  }
  
  export interface Phase {
    id: string;
    module_id: string; // Chave estrangeira para o módulo
    name: string;
    order: number;
    content: string | null; // Ou um tipo mais específico se for JSON, por exemplo
    // ...outros campos da fase
  }
  */