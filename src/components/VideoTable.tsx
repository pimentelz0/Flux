import React, { useState } from 'react';
import {
  Edit2,
  Trash2,
  ArrowRightLeft,
  Search,
  Calendar,
  Tag,
  Video,
  Plus,
  Filter,
  CheckCircle,
  FileSpreadsheet,
  AlertCircle,
  Clock,
} from 'lucide-react';
import { VideoItem, TabType } from '../types';

interface VideoTableProps {
  videos: VideoItem[];
  activeTab: TabType;
  onEdit: (video: VideoItem) => void;
  onDelete: (id: string) => void;
  onToggleTabType: (video: VideoItem) => void;
  onOpenAddModal: () => void;
  loading: boolean;
  onInlineUpdate?: (id: string, field: keyof VideoItem, value: string) => Promise<void>;
}

export const VideoTable: React.FC<VideoTableProps> = ({
  videos,
  activeTab,
  onEdit,
  onDelete,
  onToggleTabType,
  onOpenAddModal,
  loading,
  onInlineUpdate,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedNincho, setSelectedNincho] = useState<string>('todos');
  const [editingCell, setEditingCell] = useState<{ id: string; field: 'titulo' | 'data' | 'nincho' } | null>(null);
  const [tempValue, setTempValue] = useState('');

  // Extract unique ninchos for quick category filter
  const uniqueNinchos = Array.from(new Set(videos.map((v) => v.nincho || 'Geral'))).filter(Boolean);

  // Filter videos for display
  const filteredVideos = videos.filter((v) => {
    const matchesSearch =
      v.titulo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (v.nincho && v.nincho.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (v.data && v.data.includes(searchTerm));

    const matchesNincho =
      selectedNincho === 'todos' || (v.nincho || 'Geral').toLowerCase() === selectedNincho.toLowerCase();

    return matchesSearch && matchesNincho;
  });

  const handleStartInlineEdit = (video: VideoItem, field: 'titulo' | 'data' | 'nincho') => {
    setEditingCell({ id: video.id, field });
    setTempValue(video[field] || '');
  };

  const handleSaveInlineEdit = async (id: string) => {
    if (!editingCell || !onInlineUpdate) {
      setEditingCell(null);
      return;
    }
    const { field } = editingCell;
    try {
      await onInlineUpdate(id, field, tempValue);
    } catch (err) {
      console.error('Erro ao salvar edicão rápida:', err);
    } finally {
      setEditingCell(null);
    }
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return 'Sem data';
    try {
      const parts = dateStr.split('-');
      if (parts.length === 3) {
        return `${parts[2]}/${parts[1]}/${parts[0]}`;
      }
      return dateStr;
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="space-y-4">
      {/* Search & Filter Toolbar */}
      <div className="bg-white rounded-2xl p-3.5 sm:p-4 shadow-sm border border-[#E8DDD0] flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-[#A48B7B] absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por título ou nincho..."
            className="w-full pl-10 pr-4 py-2 bg-[#FAF6F0] border border-[#E8DDD0] rounded-xl text-xs sm:text-sm text-[#4A301E] placeholder-[#B5A092] focus:outline-none focus:ring-2 focus:ring-[#8C5332]"
          />
        </div>

        {/* Filter by Nincho */}
        <div className="flex items-center gap-2">
          {uniqueNinchos.length > 0 && (
            <div className="relative">
              <select
                value={selectedNincho}
                onChange={(e) => setSelectedNincho(e.target.value)}
                className="bg-[#FAF6F0] border border-[#E8DDD0] text-[#79482B] text-xs font-semibold py-2 px-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#8C5332] cursor-pointer"
              >
                <option value="todos">Todos os Ninchos</option>
                {uniqueNinchos.map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </select>
            </div>
          )}

          <button
            onClick={onOpenAddModal}
            className="py-2 px-3.5 rounded-xl bg-[#8C5332] hover:bg-[#724125] text-[#FFFDF9] text-xs font-semibold shadow-xs transition-all flex items-center gap-1.5 shrink-0 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Adicionar Vídeo</span>
            <span className="sm:hidden">Novo</span>
          </button>
        </div>
      </div>

      {/* Spreadsheet Table Container */}
      <div className="bg-white rounded-2xl shadow-sm border border-[#E8DDD0] overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-[#836A5B]">
            <div className="w-8 h-8 border-3 border-[#8C5332] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-xs font-medium">Carregando dados do Supabase...</p>
          </div>
        ) : filteredVideos.length === 0 ? (
          <div className="p-10 text-center text-[#836A5B]">
            <div className="w-12 h-12 rounded-full bg-[#FAF6F0] border border-[#E8DDD0] text-[#8C5332] flex items-center justify-center mx-auto mb-3">
              <FileSpreadsheet className="w-6 h-6" />
            </div>
            <h3 className="font-extrabold text-[#58331C] text-sm sm:text-base">Nenhum vídeo nesta lista</h3>
            <p className="text-xs text-[#9C8272] max-w-sm mx-auto mt-1 mb-4">
              {searchTerm || selectedNincho !== 'todos'
                ? 'Nenhum vídeo encontrado para os filtros aplicados.'
                : activeTab === 'planilha'
                ? 'Sua planilha para este mês ainda está vazia. Adicione o primeiro vídeo!'
                : 'Nenhum vídeo em "Para Chegar". Adicione ideias para produzir futuramente.'}
            </p>
            <button
              onClick={onOpenAddModal}
              className="py-2.5 px-4 bg-[#8C5332] text-[#FFFDF9] text-xs font-semibold rounded-xl hover:bg-[#724125] transition-all inline-flex items-center gap-2 shadow-xs cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Adicionar Vídeo Agora</span>
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[640px]">
              {/* Table Header (Required Columns: Vídeos | Data | Nincho) */}
              <thead>
                <tr className="bg-[#79482B] text-[#FFFDF9] text-xs font-bold border-b border-[#8C5332] uppercase tracking-wider">
                  <th className="py-3 px-3 w-12 text-center text-[#E8DDD0] font-mono">#</th>
                  <th className="py-3 px-4">
                    <div className="flex items-center gap-1.5">
                      <Video className="w-3.5 h-3.5 text-[#E8DDD0]" />
                      <span>Vídeos</span>
                    </div>
                  </th>
                  <th className="py-3 px-4 w-40">
                    <div className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-[#E8DDD0]" />
                      <span>Data</span>
                    </div>
                  </th>
                  <th className="py-3 px-4 w-44">
                    <div className="flex items-center gap-1.5">
                      <Tag className="w-3.5 h-3.5 text-[#E8DDD0]" />
                      <span>Nincho</span>
                    </div>
                  </th>
                  <th className="py-3 px-4 w-32 text-right">Ações</th>
                </tr>
              </thead>

              {/* Table Body */}
              <tbody className="divide-y divide-[#F3ECE0] text-xs sm:text-sm text-[#4A301E]">
                {filteredVideos.map((item, index) => (
                  <tr
                    key={item.id}
                    className="hover:bg-[#FAF6F0] transition-colors group"
                  >
                    {/* Index */}
                    <td className="py-3 px-3 text-center text-xs font-mono text-[#9C8272] font-medium bg-[#FAF6F0]/50">
                      {index + 1}
                    </td>

                    {/* Coluna: Vídeos (Título) */}
                    <td className="py-3 px-4 font-medium">
                      {editingCell?.id === item.id && editingCell?.field === 'titulo' ? (
                        <div className="flex items-center gap-1">
                          <input
                            type="text"
                            value={tempValue}
                            onChange={(e) => setTempValue(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') handleSaveInlineEdit(item.id);
                              if (e.key === 'Escape') setEditingCell(null);
                            }}
                            autoFocus
                            className="w-full px-2 py-1 bg-white border border-[#8C5332] rounded text-xs focus:outline-none"
                          />
                          <button
                            onClick={() => handleSaveInlineEdit(item.id)}
                            className="px-2 py-1 bg-[#8C5332] text-white rounded text-[10px] font-bold"
                          >
                            OK
                          </button>
                        </div>
                      ) : (
                        <div
                          onClick={() => handleStartInlineEdit(item, 'titulo')}
                          className="cursor-pointer hover:text-[#8C5332] flex flex-col justify-center group-hover:translate-x-0.5 transition-transform"
                          title="Clique para editar título diretamente"
                        >
                          <span className="text-[#58331C] font-semibold text-xs sm:text-sm leading-tight">
                            {item.titulo}
                          </span>
                          {item.observacoes && (
                            <span className="text-[11px] text-[#9C8272] font-normal truncate max-w-md mt-0.5">
                              {item.observacoes}
                            </span>
                          )}
                        </div>
                      )}
                    </td>

                    {/* Coluna: Data */}
                    <td className="py-3 px-4 text-[#79482B] font-medium whitespace-nowrap">
                      {editingCell?.id === item.id && editingCell?.field === 'data' ? (
                        <input
                          type="date"
                          value={tempValue}
                          onChange={(e) => setTempValue(e.target.value)}
                          onBlur={() => handleSaveInlineEdit(item.id)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleSaveInlineEdit(item.id);
                            if (e.key === 'Escape') setEditingCell(null);
                          }}
                          autoFocus
                          className="px-2 py-1 bg-white border border-[#8C5332] rounded text-xs focus:outline-none"
                        />
                      ) : (
                        <span
                          onClick={() => handleStartInlineEdit(item, 'data')}
                          className="cursor-pointer inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#FAF6F0] border border-[#E8DDD0] text-xs hover:border-[#8C5332]"
                          title="Clique para editar data"
                        >
                          <Calendar className="w-3.5 h-3.5 text-[#8C5332]" />
                          <span>{formatDate(item.data)}</span>
                        </span>
                      )}
                    </td>

                    {/* Coluna: Nincho */}
                    <td className="py-3 px-4 font-medium whitespace-nowrap">
                      {editingCell?.id === item.id && editingCell?.field === 'nincho' ? (
                        <input
                          type="text"
                          value={tempValue}
                          onChange={(e) => setTempValue(e.target.value)}
                          onBlur={() => handleSaveInlineEdit(item.id)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleSaveInlineEdit(item.id);
                            if (e.key === 'Escape') setEditingCell(null);
                          }}
                          autoFocus
                          className="px-2 py-1 bg-white border border-[#8C5332] rounded text-xs focus:outline-none"
                        />
                      ) : (
                        <span
                          onClick={() => handleStartInlineEdit(item, 'nincho')}
                          className="cursor-pointer inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-[#F0E6D8] text-[#79482B] border border-[#E0D1BF] hover:bg-[#E8DDD0]"
                          title="Clique para editar nincho"
                        >
                          <Tag className="w-3 h-3 text-[#8C5332]" />
                          <span>{item.nincho || 'Geral'}</span>
                        </span>
                      )}
                    </td>

                    {/* Coluna: Ações */}
                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1">
                        {/* Mover entre Planilha e Para Chegar */}
                        <button
                          onClick={() => onToggleTabType(item)}
                          className="p-1.5 rounded-lg text-[#8C5332] hover:bg-[#F0E6D8] transition-colors cursor-pointer"
                          title={
                            item.tipo === 'planilha'
                              ? 'Mover para "Para Chegar"'
                              : 'Mover para "Planilha"'
                          }
                        >
                          <ArrowRightLeft className="w-4 h-4" />
                        </button>

                        {/* Editar em Modal */}
                        <button
                          onClick={() => onEdit(item)}
                          className="p-1.5 rounded-lg text-[#79482B] hover:bg-[#F0E6D8] transition-colors cursor-pointer"
                          title="Editar detalhes do vídeo"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>

                        {/* Excluir */}
                        <button
                          onClick={() => onDelete(item.id)}
                          className="p-1.5 rounded-lg text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                          title="Excluir vídeo"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Table Footer with Summary Stats */}
        <div className="p-3 bg-[#FAF6F0] border-t border-[#E8DDD0] flex flex-wrap items-center justify-between text-xs text-[#836A5B] gap-2">
          <span>
            Exibindo <strong>{filteredVideos.length}</strong> de{' '}
            <strong>{videos.length}</strong> vídeos cadastrados neste mês.
          </span>
          <span className="text-[11px] font-medium text-[#8C5332]">
            Dica: Clique em qualquer célula do vídeo para rápida edição inline!
          </span>
        </div>
      </div>
    </div>
  );
};
