
-- Adicionar coluna last_login à tabela profiles para rastreamento de streak
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS last_login timestamp with time zone;

-- Comentário para documentação
COMMENT ON COLUMN public.profiles.last_login IS 'Timestamp do último login do usuário para cálculo de streak';
