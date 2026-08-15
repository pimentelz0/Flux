import React, { useState } from 'react';
import { X, Copy, Check, Database, ExternalLink, ShieldCheck } from 'lucide-react';

interface SqlSetupModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SqlSetupModal: React.FC<SqlSetupModalProps> = ({ isOpen, onClose }) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const sqlCode = `-- Executar no SQL Editor do Supabase (https://supabase.com/dashboard)

-- 1. Criar extensão pgcrypto (caso não esteja ativa)
create extension if not exists "pgcrypto";

-- 2. Criar a tabela 'videos'
create table if not exists public.videos (
  id uuid default gen_random_uuid() primary key,
  user_id uuid not null default auth.uid(),
  tipo text not null check (tipo in ('planilha', 'para_chegar')),
  titulo text not null,
  data text not null,
  nincho text default 'Geral',
  mes_referencia text not null,
  observacoes text,
  status text default 'planejado',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 3. Criar a tabela 'ideias' (Bloco de Notas / Post-its)
create table if not exists public.ideias (
  id uuid default gen_random_uuid() primary key,
  user_id uuid not null default auth.uid(),
  titulo text not null,
  conteudo text,
  items jsonb default '[]'::jsonb,
  cor text default 'cream',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 4. Criar a tabela 'conteudos' (Planilhas de Stories e Vídeos)
create table if not exists public.conteudos (
  id uuid default gen_random_uuid() primary key,
  user_id uuid not null default auth.uid(),
  mes_referencia text not null default to_char(now(), 'YYYY-MM'),
  titulo text default 'Conteúdos do Mês',
  cor text default 'cream',
  linhas jsonb default '[]'::jsonb,
  observacoes text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now())
);

-- 5. Habilitar RLS nas tabelas
alter table public.videos enable row level security;
alter table public.ideias enable row level security;
alter table public.conteudos enable row level security;

-- 6. Políticas de RLS para a tabela conteudos
drop policy if exists "Usuários podem ver seus próprios conteúdos" on public.conteudos;
drop policy if exists "Usuários podem inserir seus próprios conteúdos" on public.conteudos;
drop policy if exists "Usuários podem atualizar seus próprios conteúdos" on public.conteudos;
drop policy if exists "Usuários podem deletar seus próprios conteúdos" on public.conteudos;

create policy "Usuários podem ver seus próprios conteúdos" on public.conteudos for select using (auth.uid() = user_id);
create policy "Usuários podem inserir seus próprios conteúdos" on public.conteudos for insert with check (auth.uid() = user_id);
create policy "Usuários podem atualizar seus próprios conteúdos" on public.conteudos for update using (auth.uid() = user_id);
create policy "Usuários podem deletar seus próprios conteúdos" on public.conteudos for delete using (auth.uid() = user_id);

-- 7. Criar Políticas de RLS para a tabela ideias
drop policy if exists "Usuários podem ver suas próprias ideias" on public.ideias;
drop policy if exists "Usuários podem inserir suas próprias ideias" on public.ideias;
drop policy if exists "Usuários podem atualizar suas próprias ideias" on public.ideias;
drop policy if exists "Usuários podem deletar suas próprias ideias" on public.ideias;

create policy "Usuários podem ver suas próprias ideias" on public.ideias for select using (auth.uid() = user_id);
create policy "Usuários podem inserir suas próprias ideias" on public.ideias for insert with check (auth.uid() = user_id);
create policy "Usuários podem atualizar suas próprias ideias" on public.ideias for update using (auth.uid() = user_id);
create policy "Usuários podem deletar suas próprias ideias" on public.ideias for delete using (auth.uid() = user_id);

-- 8. Criar Políticas de Segurança (RLS) para videos
drop policy if exists "Usuários podem ver seus próprios vídeos" on public.videos;
drop policy if exists "Usuários podem inserir seus próprios vídeos" on public.videos;
drop policy if exists "Usuários podem atualizar seus próprios vídeos" on public.videos;
drop policy if exists "Usuários podem deletar seus próprios vídeos" on public.videos;

create policy "Usuários podem ver seus próprios vídeos"
  on public.videos for select
  using (auth.uid() = user_id);

create policy "Usuários podem inserir seus próprios vídeos"
  on public.videos for insert
  with check (auth.uid() = user_id);

create policy "Usuários podem atualizar seus próprios vídeos"
  on public.videos for update
  using (auth.uid() = user_id);

create policy "Usuários podem deletar seus próprios vídeos"
  on public.videos for delete
  using (auth.uid() = user_id);
`;

  const handleCopy = () => {
    navigator.clipboard.writeText(sqlCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Background Overlay */}
      <div
        className="fixed inset-0 bg-[#2C1A0E]/60 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
        onClick={onClose}
      />

      {/* Modal Dialog */}
      <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-[#E8DDD0] text-[#4A301E] overflow-hidden z-10 animate-in zoom-in-95 duration-150 my-auto max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="p-4 sm:p-5 bg-[#79482B] text-[#FFFDF9] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#8C5332] flex items-center justify-center text-[#FFFDF9]">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-base sm:text-lg text-[#FFFDF9]">Estrutura do Banco Supabase</h3>
              <p className="text-xs text-[#E8DDD0]">Script SQL para tabelas 'videos' e 'ideias'</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#E8DDD0] hover:text-white hover:bg-[#8C5332] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 overflow-y-auto space-y-4 flex-1 text-xs sm:text-sm">
          <div className="p-3.5 bg-[#FAF6F0] border border-[#E8DDD0] rounded-xl text-[#79482B] space-y-1">
            <p className="font-bold flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-[#8C5332]" />
              Instruções de Inicialização do Banco:
            </p>
            <p className="text-xs text-[#836A5B]">
              Se as tabelas <code className="font-mono bg-[#F0E6D8] px-1 rounded">videos</code> ou <code className="font-mono bg-[#F0E6D8] px-1 rounded">ideias</code> ainda não existem no seu projeto do Supabase, copie o código SQL abaixo e cole no <strong>SQL Editor</strong> do painel do Supabase.
            </p>
          </div>

          <div className="relative">
            <div className="flex items-center justify-between px-3 py-2 bg-[#4A301E] text-[#E8DDD0] text-xs rounded-t-xl border-b border-[#79482B]">
              <span className="font-mono text-[11px]">schema_videos.sql</span>
              <button
                onClick={handleCopy}
                className="px-2.5 py-1 rounded bg-[#8C5332] hover:bg-[#A86E43] text-white text-[11px] font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copiado!' : 'Copiar SQL'}</span>
              </button>
            </div>
            <pre className="p-4 bg-[#2D1B10] text-[#E8DDD0] font-mono text-[11px] leading-relaxed rounded-b-xl overflow-x-auto border border-[#79482B] max-h-64">
              {sqlCode}
            </pre>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-[#FAF6F0] border-t border-[#E8DDD0] flex items-center justify-between">
          <a
            href="https://supabase.com/dashboard"
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs font-semibold text-[#8C5332] hover:underline flex items-center gap-1"
          >
            <span>Abrir Dashboard do Supabase</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>

          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-[#8C5332] text-[#FFFDF9] text-xs font-semibold hover:bg-[#724125] transition-colors cursor-pointer"
          >
            Entendido
          </button>
        </div>
      </div>
    </div>
  );
};
