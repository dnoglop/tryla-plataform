-- Criar tabela para rastrear reivindicações de XP diário
create table if not exists public.daily_xp_claims (
  id uuid not null default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  claimed_at date not null,
  xp_amount integer not null default 50,
  created_at timestamp with time zone not null default now(),
  
  -- Chave primária
  constraint daily_xp_claims_pkey primary key (id),
  
  -- Garantir que cada usuário só possa reivindicar XP uma vez por dia
  constraint daily_xp_claims_user_date_unique unique (user_id, claimed_at)
);

-- Adicionar políticas RLS para segurança
alter table public.daily_xp_claims enable row level security;

-- Política para permitir que usuários vejam apenas suas próprias reivindicações
create policy "Usuários podem ver suas próprias reivindicações de XP"
  on public.daily_xp_claims for select
  using (auth.uid() = user_id);

-- Política para permitir que usuários insiram suas próprias reivindicações
create policy "Usuários podem inserir suas próprias reivindicações de XP"
  on public.daily_xp_claims for insert
  with check (auth.uid() = user_id);

-- Comentário para documentação
comment on table public.daily_xp_claims is 'Tabela para rastrear reivindicações de XP diário dos usuários';