import React, { useState } from 'react';
import {
  Edit2,
  Trash2,
  ArrowRightLeft,
  Calendar,
  Tag,
  Video,
  Plus,
  FileSpreadsheet,
  CheckCircle2,
  Circle,
  Package,
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
  onSaveQuickItem?: (videoData: Partial<VideoItem>) => Promise<void>;
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
  onSaveQuickItem,
}) => {
  const [editingCell, setEditingCell] = useState<{ id: string; field: 'titulo' | 'data' | 'nincho' } | null>(null);
  const [tempValue, setTempValue] = useState('');
  const [newBrand, setNewBrand] = useState('');
  const [addingBrand, setAddingBrand] = useState(false);

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
      console.error('Erro ao salvar edição rápida:', err);
    } finally {
      setEditingCell(null);
    }
  };

  const handleToggleCheck = async (item: VideoItem) => {
    if (!onInlineUpdate) return;
    const nextStatus = item.status === 'concluido' ? 'planejado' : 'concluido';
    await onInlineUpdate(item.id, 'status', nextStatus);
  };

  const handleAddQuickBrand = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBrand.trim() || !onSaveQuickItem) return;
    setAddingBrand(true);
    try {
      await onSaveQuickItem({
        titulo: newBrand.trim(),
        tipo: 'para_chegar',
        status: 'planejado',
      });
      setNewBrand('');
    } catch (err) {
      console.error('Erro ao adicionar marca:', err);
    } finally {
      setAddingBrand(false);
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

  // Render for "Para Chegar" (Checklist mode - brand only)
  if (activeTab === 'para_chegar') {
    return (
      <div className="space-y-4">
        {/* Brand Checklist List */}
        <div className="bg-white rounded-2xl shadow-sm border border-[#E8DDD0] overflow-hidden">
          {loading ? (
            <div className="p-10 text-center text-[#836A5B]">
              <div className="w-8 h-8 border-3 border-[#8C5332] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
              <p className="text-xs font-medium">Carregando marcas...</p>
            </div>
          ) : videos.length === 0 ? (
            <div className="p-8 text-center text-[#836A5B]">
              <div className="w-12 h-12 rounded-full bg-[#FAF6F0] border border-[#E8DDD0] text-[#8C5332] flex items-center justify-center mx-auto mb-3">
                <Package className="w-6 h-6" />
              </div>
              <h3 className="font-extrabold text-[#58331C] text-sm sm:text-base">Nenhuma marca registrada</h3>
              <p className="text-xs text-[#9C8272] max-w-sm mx-auto mt-1 mb-3">
                Clique no botão de adicionar para cadastrar sua primeira marca!
              </p>
              <button
                onClick={onOpenAddModal}
                className="py-2 px-3.5 bg-[#8C5332] text-[#FFFDF9] text-xs font-semibold rounded-xl hover:bg-[#724125] transition-all inline-flex items-center gap-1.5 shadow-xs cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Adicionar Marca</span>
              </button>
            </div>
          ) : (
            <div className="divide-y divide-[#F3ECE0]">
              {videos.map((item) => {
                const isChecked = item.status === 'concluido';
                return (
                  <div key={item.id} className="p-3 sm:p-4 hover:bg-[#FAF6F0] transition-colors flex items-center justify-between gap-2">
                    {/* Status Button */}
                    <button
                      onClick={() => handleToggleCheck(item)}
                      className={`inline-flex items-center justify-center gap-1 px-2.5 py-1.5 rounded-xl border text-[11px] sm:text-xs font-bold transition-all cursor-pointer shrink-0 ${
                        isChecked
                          ? 'bg-emerald-50 border-emerald-300 text-emerald-700 hover:bg-emerald-100'
                          : 'bg-[#FAF6F0] border-[#E8DDD0] text-[#79482B] hover:border-[#8C5332]'
                      }`}
                      title={isChecked ? 'Marcar como não entregue' : 'Dar checkout (Chegou!)'}
                    >
                      {isChecked ? (
                        <>
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Chegou</span>
                        </>
                      ) : (
                        <>
                          <Circle className="w-3.5 h-3.5 text-[#A48B7B]" />
                          <span>Aguardando</span>
                        </>
                      )}
                    </button>

                    {/* Brand Name */}
                    <div className="flex-1 min-w-0 px-2">
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
                            className="px-2 py-1 bg-[#8C5332] text-white rounded text-xs font-bold cursor-pointer"
                          >
                            OK
                          </button>
                        </div>
                      ) : (
                        <span
                          onClick={() => handleStartInlineEdit(item, 'titulo')}
                          className={`cursor-pointer font-bold text-xs sm:text-sm block truncate ${
                            isChecked ? 'line-through text-[#9C8272]' : 'text-[#58331C] hover:text-[#8C5332]'
                          }`}
                          title="Clique para editar"
                        >
                          {item.titulo}
                        </span>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => onToggleTabType(item)}
                        className="p-1.5 rounded-lg text-[#8C5332] hover:bg-[#F0E6D8] transition-colors cursor-pointer"
                        title="Copiar para Planilha"
                      >
                        <ArrowRightLeft className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => onEdit(item)}
                        className="p-1.5 rounded-lg text-[#79482B] hover:bg-[#F0E6D8] transition-colors cursor-pointer"
                        title="Editar Marca"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => onDelete(item.id)}
                        className="p-1.5 rounded-lg text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                        title="Excluir Marca"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Table Footer */}
          <div className="p-3 bg-[#FAF6F0] border-t border-[#E8DDD0] text-xs text-[#836A5B]">
            Exibindo <strong>{videos.length}</strong> marca(s) na lista Para Chegar.
          </div>
        </div>
      </div>
    );
  }

  // Render for "Planilha" (Standard Video Table & Responsive Mobile Cards)
  return (
    <div className="space-y-4">
      {/* Container */}
      <div className="bg-white rounded-2xl shadow-sm border border-[#E8DDD0] overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-[#836A5B]">
            <div className="w-8 h-8 border-3 border-[#8C5332] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-xs font-medium">Carregando dados da planilha...</p>
          </div>
        ) : videos.length === 0 ? (
          <div className="p-10 text-center text-[#836A5B]">
            <div className="w-12 h-12 rounded-full bg-[#FAF6F0] border border-[#E8DDD0] text-[#8C5332] flex items-center justify-center mx-auto mb-3">
              <FileSpreadsheet className="w-6 h-6" />
            </div>
            <h3 className="font-extrabold text-[#58331C] text-sm sm:text-base">Nenhum vídeo nesta lista</h3>
            <p className="text-xs text-[#9C8272] max-w-sm mx-auto mt-1 mb-4">
              Sua planilha para este mês ainda está vazia. Adicione o primeiro vídeo!
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
          <div>
            {/* Mobile View: Clean Card List (< sm screens) */}
            <div className="block sm:hidden divide-y divide-[#F3ECE0]">
              {videos.map((item, index) => (
                <div key={item.id} className="p-3 hover:bg-[#FAF6F0] transition-colors space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-start gap-2 min-w-0 flex-1">
                      <span className="text-[10px] font-mono font-bold text-[#8C5332] bg-[#FAF6F0] px-1.5 py-0.5 rounded border border-[#E8DDD0] shrink-0 mt-0.5">
                        #{index + 1}
                      </span>
                      {editingCell?.id === item.id && editingCell?.field === 'titulo' ? (
                        <div className="flex items-center gap-1 w-full">
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
                            className="px-2 py-1 bg-[#8C5332] text-white rounded text-[10px] font-bold cursor-pointer"
                          >
                            OK
                          </button>
                        </div>
                      ) : (
                        <div
                          onClick={() => handleStartInlineEdit(item, 'titulo')}
                          className="cursor-pointer min-w-0"
                        >
                          <h4 className="text-xs font-bold text-[#58331C] leading-snug break-words">
                            {item.titulo}
                          </h4>
                          {item.observacoes && (
                            <p className="text-[11px] text-[#9C8272] mt-0.5 line-clamp-2">
                              {item.observacoes}
                            </p>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-0.5 shrink-0">
                      <button
                        onClick={() => onToggleTabType(item)}
                        className="p-1 rounded text-[#8C5332] hover:bg-[#F0E6D8] cursor-pointer"
                        title='Copiar para "Para Chegar"'
                      >
                        <ArrowRightLeft className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => onEdit(item)}
                        className="p-1 rounded text-[#79482B] hover:bg-[#F0E6D8] cursor-pointer"
                        title="Editar"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => onDelete(item.id)}
                        className="p-1 rounded text-red-600 hover:bg-red-50 cursor-pointer"
                        title="Excluir"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Metadata Row: Date & Nincho */}
                  <div className="flex items-center gap-2 pt-0.5 text-[11px]">
                    <span
                      onClick={() => handleStartInlineEdit(item, 'data')}
                      className="cursor-pointer inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-[#FAF6F0] border border-[#E8DDD0] text-[#79482B] font-medium"
                    >
                      <Calendar className="w-3 h-3 text-[#8C5332]" />
                      <span>{formatDate(item.data)}</span>
                    </span>

                    <span
                      onClick={() => handleStartInlineEdit(item, 'nincho')}
                      className="cursor-pointer inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#F0E6D8] text-[#79482B] font-semibold border border-[#E0D1BF]"
                    >
                      <Tag className="w-2.5 h-2.5 text-[#8C5332]" />
                      <span>{item.nincho || 'Geral'}</span>
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* Desktop / Tablet View (>= sm screens) */}
            <div className="hidden sm:block overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-[#79482B] text-[#FFFDF9] text-xs font-bold border-b border-[#8C5332] uppercase tracking-wider">
                    <th className="py-3 px-3 w-10 text-center text-[#E8DDD0] font-mono">#</th>
                    <th className="py-3 px-4">
                      <div className="flex items-center gap-1.5">
                        <Video className="w-3.5 h-3.5 text-[#E8DDD0]" />
                        <span>Vídeos</span>
                      </div>
                    </th>
                    <th className="py-3 px-4 w-36">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-[#E8DDD0]" />
                        <span>Data</span>
                      </div>
                    </th>
                    <th className="py-3 px-4 w-36">
                      <div className="flex items-center gap-1.5">
                        <Tag className="w-3.5 h-3.5 text-[#E8DDD0]" />
                        <span>Nincho</span>
                      </div>
                    </th>
                    <th className="py-3 px-4 w-28 text-right">Ações</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-[#F3ECE0] text-xs sm:text-sm text-[#4A301E]">
                  {videos.map((item, index) => (
                    <tr key={item.id} className="hover:bg-[#FAF6F0] transition-colors group">
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
                              className="px-2 py-1 bg-[#8C5332] text-white rounded text-[10px] font-bold cursor-pointer"
                            >
                              OK
                            </button>
                          </div>
                        ) : (
                          <div
                            onClick={() => handleStartInlineEdit(item, 'titulo')}
                            className="cursor-pointer hover:text-[#8C5332] flex flex-col justify-center"
                            title="Clique para editar título"
                          >
                            <span className="text-[#58331C] font-semibold text-xs sm:text-sm leading-tight">
                              {item.titulo}
                            </span>
                            {item.observacoes && (
                              <span className="text-[11px] text-[#9C8272] font-normal truncate max-w-xs sm:max-w-md mt-0.5">
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
                          <button
                            onClick={() => onToggleTabType(item)}
                            className="p-1.5 rounded-lg text-[#8C5332] hover:bg-[#F0E6D8] transition-colors cursor-pointer"
                            title='Copiar para "Para Chegar"'
                          >
                            <ArrowRightLeft className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => onEdit(item)}
                            className="p-1.5 rounded-lg text-[#79482B] hover:bg-[#F0E6D8] transition-colors cursor-pointer"
                            title="Editar detalhes do vídeo"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
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
          </div>
        )}

        {/* Table Footer */}
        <div className="p-3 bg-[#FAF6F0] border-t border-[#E8DDD0] flex flex-wrap items-center justify-between text-xs text-[#836A5B] gap-2">
          <span>
            Exibindo <strong>{videos.length}</strong> vídeo(s) cadastrado(s) neste mês.
          </span>
        </div>
      </div>
    </div>
  );
};
