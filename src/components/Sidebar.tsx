import React from 'react';
import { X, Table, Clock, Calendar, Download, Database, LogOut, Video, FileText, CheckCircle2 } from 'lucide-react';
import { TabType, MonthOption, VideoItem } from '../types';
import { supabase } from '../lib/supabase';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  activeTab: TabType;
  onChangeTab: (tab: TabType) => void;
  currentMonthKey: string;
  onSelectMonth: (monthKey: string) => void;
  monthsList: MonthOption[];
  videos: VideoItem[];
  userEmail?: string;
  onOpenSqlModal: () => void;
  onExportCsv: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  isOpen,
  onClose,
  activeTab,
  onChangeTab,
  currentMonthKey,
  onSelectMonth,
  monthsList,
  videos,
  userEmail,
  onOpenSqlModal,
  onExportCsv,
}) => {
  if (!isOpen) return null;

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      onClose();
    } catch (err) {
      console.error('Erro ao sair:', err);
    }
  };

  const planilhaVideos = videos.filter((v) => v.tipo === 'planilha');
  const paraChegarVideos = videos.filter((v) => v.tipo === 'para_chegar');

  return (
    <div className="fixed inset-0 z-50 flex">
      {/* Overlay background */}
      <div
        className="fixed inset-0 bg-[#2C1A0E]/50 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
        onClick={onClose}
      />

      {/* Drawer content */}
      <div className="relative w-80 max-w-[85vw] bg-[#F9F6F0] text-[#4A301E] h-full shadow-2xl flex flex-col z-10 animate-in slide-in-from-left duration-200 border-r border-[#E8DDD0]">
        {/* Drawer Header */}
        <div className="p-5 bg-[#79482B] text-[#FFFDF9] flex items-center justify-between shadow-md">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#8C5332] flex items-center justify-center text-[#FFFDF9]">
              <Video className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-extrabold text-base tracking-tight text-[#FFFDF9]">Flux</h2>
              <p className="text-[11px] text-[#E8DDD0]">Painel de Conteúdo</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#E8DDD0] hover:text-white hover:bg-[#8C5332] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          {/* Section: Abas Principais */}
          <div>
            <p className="text-[11px] font-bold text-[#9C8272] uppercase tracking-wider mb-2 px-2">
              Navegação
            </p>
            <div className="space-y-1">
              <button
                onClick={() => { onChangeTab('planilha'); onClose(); }}
                className={`w-full px-3 py-2.5 rounded-xl flex items-center justify-between text-xs font-semibold transition-all cursor-pointer ${
                  activeTab === 'planilha'
                    ? 'bg-[#8C5332] text-[#FFFDF9] shadow-xs'
                    : 'text-[#58331C] hover:bg-[#F0E6D8]'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Table className="w-4 h-4" />
                  <span>Planilha Principal</span>
                </div>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/20 font-bold">
                  {planilhaVideos.length}
                </span>
              </button>

              <button
                onClick={() => { onChangeTab('para_chegar'); onClose(); }}
                className={`w-full px-3 py-2.5 rounded-xl flex items-center justify-between text-xs font-semibold transition-all cursor-pointer ${
                  activeTab === 'para_chegar'
                    ? 'bg-[#8C5332] text-[#FFFDF9] shadow-xs'
                    : 'text-[#58331C] hover:bg-[#F0E6D8]'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Clock className="w-4 h-4" />
                  <span>Para Chegar</span>
                </div>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/20 font-bold">
                  {paraChegarVideos.length}
                </span>
              </button>
            </div>
          </div>

          {/* Section: Meses de Referência */}
          <div>
            <p className="text-[11px] font-bold text-[#9C8272] uppercase tracking-wider mb-2 px-2 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5" />
              <span>Seletor de Mês</span>
            </p>
            <div className="space-y-1 max-h-48 overflow-y-auto pr-1">
              {monthsList.map((m) => {
                const isSelected = m.key === currentMonthKey;
                return (
                  <button
                    key={m.key}
                    onClick={() => { onSelectMonth(m.key); onClose(); }}
                    className={`w-full px-3 py-2 rounded-xl text-left text-xs font-medium transition-all flex items-center justify-between cursor-pointer ${
                      isSelected
                        ? 'bg-[#A86E43] text-white font-semibold shadow-xs'
                        : 'text-[#58331C] hover:bg-[#F0E6D8]'
                    }`}
                  >
                    <span>{m.label}</span>
                    {isSelected && <CheckCircle2 className="w-3.5 h-3.5 text-white" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Section: Ações & Ferramentas */}
          <div>
            <p className="text-[11px] font-bold text-[#9C8272] uppercase tracking-wider mb-2 px-2">
              Ferramentas
            </p>
            <div className="space-y-1">
              <button
                onClick={() => { onExportCsv(); onClose(); }}
                className="w-full px-3 py-2.5 rounded-xl text-xs font-medium text-[#58331C] hover:bg-[#F0E6D8] flex items-center gap-2.5 transition-colors cursor-pointer"
              >
                <Download className="w-4 h-4 text-[#8C5332]" />
                <span>Baixar Planilha (CSV)</span>
              </button>

              <button
                onClick={() => { onOpenSqlModal(); onClose(); }}
                className="w-full px-3 py-2.5 rounded-xl text-xs font-medium text-[#58331C] hover:bg-[#F0E6D8] flex items-center gap-2.5 transition-colors cursor-pointer"
              >
                <Database className="w-4 h-4 text-[#8C5332]" />
                <span>Script de Instalação Supabase</span>
              </button>
            </div>
          </div>
        </div>

        {/* Drawer Footer */}
        <div className="p-4 border-t border-[#E8DDD0] bg-[#F0E6D8]/50 space-y-3">
          <div className="text-xs text-[#79482B]">
            <span className="text-[10px] uppercase font-bold text-[#9C8272] block">Conectado como</span>
            <span className="font-semibold truncate block mt-0.5">{userEmail || 'Usuário'}</span>
          </div>

          <button
            onClick={handleLogout}
            className="w-full py-2 px-3 rounded-xl bg-red-100 hover:bg-red-200 text-red-800 text-xs font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            <span>Sair do App</span>
          </button>
        </div>
      </div>
    </div>
  );
};
