import React from 'react';
import { X, Table, Clock, Download, Database, LogOut, NotebookPen } from 'lucide-react';
import { TabType, MonthOption, VideoItem } from '../types';
import { supabase } from '../lib/supabase';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  activeTab: TabType;
  onChangeTab: (tab: TabType) => void;
  currentMonthKey?: string;
  onSelectMonth?: (monthKey: string) => void;
  monthsList?: MonthOption[];
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
              <NotebookPen className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-extrabold text-base tracking-tight text-[#FFFDF9]">Agenda</h2>
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
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
