
-- Criar tabela para desafios diários
CREATE TABLE IF NOT EXISTS public.daily_challenges (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  challenge_text TEXT NOT NULL,
  created_date DATE NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  completed BOOLEAN NOT NULL DEFAULT false,
  related_phase TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  -- Garantir que cada usuário só tenha um desafio por dia
  CONSTRAINT daily_challenges_user_date_unique UNIQUE (user_id, created_date)
);

-- Adicionar políticas RLS para segurança
ALTER TABLE public.daily_challenges ENABLE ROW LEVEL SECURITY;

-- Política para permitir que usuários vejam apenas seus próprios desafios
CREATE POLICY "Usuários podem ver seus próprios desafios"
  ON public.daily_challenges FOR SELECT
  USING (auth.uid() = user_id);

-- Política para permitir que usuários insiram seus próprios desafios
CREATE POLICY "Usuários podem inserir seus próprios desafios"
  ON public.daily_challenges FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Política para permitir que usuários atualizem seus próprios desafios
CREATE POLICY "Usuários podem atualizar seus próprios desafios"
  ON public.daily_challenges FOR UPDATE
  USING (auth.uid() = user_id);

-- Criar índices para performance
CREATE INDEX idx_daily_challenges_user_date ON public.daily_challenges(user_id, created_date);
CREATE INDEX idx_daily_challenges_expires ON public.daily_challenges(expires_at);

-- Comentário para documentação
COMMENT ON TABLE public.daily_challenges IS 'Tabela para armazenar desafios diários personalizados dos usuários';
