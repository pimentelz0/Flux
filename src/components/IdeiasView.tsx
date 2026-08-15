import React, { useState, useMemo } from 'react';
import {
  Plus,
  CheckCircle2,
  Circle,
  Trash2,
  Edit3,
  StickyNote,
  X,
  Check,
  Palette,
} from 'lucide-react';
import { IdeaItem, IdeaCheckItem } from '../types';

interface IdeiasViewProps {
  ideas: IdeaItem[];
  onAddIdea: (idea: Partial<IdeaItem>) => Promise<void>;
  onUpdateIdea: (idea: IdeaItem) => Promise<void>;
  onDeleteIdea: (id: string) => Promise<void>;
  loading?: boolean;
}

export const IdeiasView: React.FC<IdeiasViewProps> = ({
  ideas,
  onAddIdea,
  onUpdateIdea,
  onDeleteIdea,
  loading = false,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingIdea, setEditingIdea] = useState<IdeaItem | null>(null);

  // Custom Delete Confirmation State
  const [deletingIdeaId, setDeletingIdeaId] = useState<string | null>(null);

  // Form state for Modal
  const [modalTitle, setModalTitle] = useState('');
  const [modalContent, setModalContent] = useState('');
  const [modalColor, setModalColor] = useState<'white' | 'cream' | 'yellow' | 'pink' | 'mint' | 'blue'>('cream');
  const [modalItems, setModalItems] = useState<IdeaCheckItem[]>([]);
  const [newItemText, setNewItemText] = useState('');
  const [saving, setSaving] = useState(false);

  const openCreateModal = () => {
    setEditingIdea(null);
    setModalTitle('');
    setModalContent('');
    setModalColor('cream');
    setModalItems([]);
    setNewItemText('');
    setIsModalOpen(true);
  };

  const openEditModal = (idea: IdeaItem) => {
    setEditingIdea(idea);
    setModalTitle(idea.titulo || '');
    setModalContent(idea.conteudo || '');
    setModalColor(idea.cor || 'cream');
    setModalItems(idea.items ? [...idea.items] : []);
    setNewItemText('');
    setIsModalOpen(true);
  };

  const handleAddItemToModal = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!newItemText.trim()) return;
    setModalItems((prev) => [
      ...prev,
      {
        id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `item_${Date.now()}_${Math.random()}`,
        texto: newItemText.trim(),
        concluido: false,
      },
    ]);
    setNewItemText('');
  };

  const handleRemoveModalItem = (itemId: string) => {
    setModalItems((prev) => prev.filter((i) => i.id !== itemId));
  };

  const handleToggleModalItem = (itemId: string) => {
    setModalItems((prev) =>
      prev.map((i) => (i.id === itemId ? { ...i, concluido: !i.concluido } : i))
    );
  };

  const handleSaveModal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!modalTitle.trim() && modalItems.length === 0 && !modalContent.trim()) {
      return;
    }

    setSaving(true);
    try {
      const finalTitle = modalTitle.trim() || (modalItems[0]?.texto ? modalItems[0].texto : 'Minha Ideia');
      if (editingIdea) {
        await onUpdateIdea({
          ...editingIdea,
          titulo: finalTitle,
          conteudo: modalContent.trim(),
          items: modalItems,
          cor: modalColor,
        });
      } else {
        await onAddIdea({
          titulo: finalTitle,
          conteudo: modalContent.trim(),
          items: modalItems,
          cor: modalColor,
        });
      }
      setIsModalOpen(false);
    } catch (err) {
      console.error('Erro ao salvar ideia:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleToggleCardItem = async (idea: IdeaItem, itemId: string) => {
    const updatedItems = (idea.items || []).map((item) =>
      item.id === itemId ? { ...item, concluido: !item.concluido } : item
    );
    await onUpdateIdea({
      ...idea,
      items: updatedItems,
    });
  };

  const sortedIdeas = useMemo(() => {
    return [...ideas].sort((a, b) => {
      const timeA = a.created_at ? new Date(a.created_at).getTime() : 0;
      const timeB = b.created_at ? new Date(b.created_at).getTime() : 0;
      return timeB - timeA;
    });
  }, [ideas]);

  const getColorClasses = (color?: string) => {
    switch (color) {
      case 'yellow':
        return 'bg-[#FEF9C3] border-[#FDE047] text-[#713F12]';
      case 'pink':
        return 'bg-[#FCE7F3] border-[#F472B6] text-[#831843]';
      case 'mint':
        return 'bg-[#D1FAE5] border-[#34D399] text-[#065F46]';
      case 'blue':
        return 'bg-[#E0F2FE] border-[#38BDF8] text-[#075985]';
      case 'cream':
        return 'bg-[#FAF6F0] border-[#E8DDD0] text-[#58331C]';
      default:
        return 'bg-white border-[#E8DDD0] text-[#58331C]';
    }
  };

  const formatItemTime = (isoString?: string) => {
    if (!isoString) return '';
    try {
      const d = new Date(isoString);
      const now = new Date();
      if (d.toDateString() === now.toDateString()) {
        return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      }
      return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
    } catch {
      return '';
    }
  };

  return (
    <div className="space-y-6 pb-24">
      {/* Ideas List */}
      {sortedIdeas.length === 0 ? (
        <div className="bg-white rounded-2xl p-8 text-center shadow-sm border border-[#E8DDD0] space-y-3">
          <div className="w-14 h-14 rounded-2xl bg-[#FAF6F0] border border-[#E8DDD0] text-[#8C5332] flex items-center justify-center mx-auto">
            <StickyNote className="w-7 h-7" />
          </div>
          <h3 className="font-extrabold text-[#58331C] text-base">Nenhuma ideia cadastrada</h3>
          <p className="text-xs text-[#9C8272] max-w-sm mx-auto">
            Crie seu primeiro Post-it de anotações rápidas clicando no botão abaixo!
          </p>
          <button
            onClick={openCreateModal}
            className="py-2.5 px-4 bg-[#8C5332] text-[#FFFDF9] text-xs font-bold rounded-xl hover:bg-[#724125] transition-all inline-flex items-center gap-1.5 shadow-xs cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Criar Nova Ideia</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 sm:gap-4">
          {sortedIdeas.map((idea) => {
            const cardColorClass = getColorClasses(idea.cor);

            return (
              <div
                key={idea.id}
                className={`group relative rounded-2xl p-3.5 sm:p-4 border shadow-xs hover:shadow-md transition-all flex flex-col justify-between ${cardColorClass} min-h-[160px] cursor-pointer`}
                onClick={() => openEditModal(idea)}
              >
                {/* Post-it Content Preview */}
                <div className="space-y-2">
                  {/* Checklist / Content Items */}
                  {idea.items && idea.items.length > 0 ? (
                    <div className="space-y-1 max-h-28 overflow-hidden text-[11px] sm:text-xs">
                      {idea.items.slice(0, 5).map((item) => (
                        <div
                          key={item.id}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleToggleCardItem(idea, item.id);
                          }}
                          className="flex items-center gap-1.5 hover:opacity-80 cursor-pointer"
                        >
                          {item.concluido ? (
                            <CheckCircle2 className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                          ) : (
                            <Circle className="w-3.5 h-3.5 text-[#B5A092] shrink-0" />
                          )}
                          <span
                            className={`truncate ${
                              item.concluido ? 'line-through opacity-50' : 'font-medium'
                            }`}
                          >
                            {item.texto}
                          </span>
                        </div>
                      ))}
                      {idea.items.length > 5 && (
                        <p className="text-[10px] text-[#8C5332] font-bold pt-0.5">
                          + {idea.items.length - 5} itens
                        </p>
                      )}
                    </div>
                  ) : (
                    <p className="text-xs line-clamp-4 leading-relaxed font-normal opacity-90">
                      {idea.conteudo || 'Sem conteúdo.'}
                    </p>
                  )}
                </div>

                {/* Card Footer: Title & Date & Actions */}
                <div className="pt-3 border-t border-black/10 mt-3 flex items-end justify-between gap-1">
                  <div className="min-w-0 flex-1">
                    <h4 className="text-xs sm:text-sm font-extrabold truncate leading-tight">
                      {idea.titulo}
                    </h4>
                    <p className="text-[10px] opacity-60 font-medium">
                      {formatItemTime(idea.created_at)}
                    </p>
                  </div>

                  {/* Quick Delete */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setDeletingIdeaId(idea.id);
                    }}
                    className="p-1.5 rounded-lg opacity-80 hover:opacity-100 hover:bg-black/10 text-red-600 transition-all cursor-pointer"
                    title="Excluir"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Floating Button / Bottom Quick Add Bar */}
      <div className="fixed bottom-6 right-4 sm:right-8 z-40">
        <button
          onClick={openCreateModal}
          className="py-3 px-5 bg-[#8C5332] hover:bg-[#724125] text-[#FFFDF9] rounded-2xl shadow-xl hover:shadow-2xl transition-all flex items-center gap-2 font-extrabold text-xs sm:text-sm cursor-pointer transform hover:scale-105"
        >
          <Plus className="w-5 h-5" />
          <span>Nova Ideia</span>
        </button>
      </div>

      {/* Modal Create/Edit Idea */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-[#2C1A0E]/60 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
            onClick={() => setIsModalOpen(false)}
          />

          <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-[#E8DDD0] text-[#4A301E] overflow-hidden z-10 animate-in zoom-in-95 duration-150 my-auto max-h-[90vh] flex flex-col">
            {/* Header */}
            <div className="p-4 sm:p-5 bg-[#79482B] text-[#FFFDF9] flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-[#8C5332] flex items-center justify-center text-[#FFFDF9]">
                  <StickyNote className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-base sm:text-lg text-[#FFFDF9]">
                    {editingIdea ? 'Editar Bloco de Notas' : 'Nova Ideia em Post-it'}
                  </h3>
                  <p className="text-xs text-[#E8DDD0]">Anote tarefas, checklists ou rascunhos</p>
                </div>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-lg text-[#E8DDD0] hover:text-white hover:bg-[#8C5332] transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSaveModal} className="p-5 overflow-y-auto space-y-4 flex-1">
              {/* Post-it Color Picker */}
              <div>
                <label className="block text-xs font-semibold text-[#79482B] uppercase tracking-wider mb-1.5 flex items-center gap-1">
                  <Palette className="w-3.5 h-3.5" />
                  <span>Cor do Post-it</span>
                </label>
                <div className="flex items-center gap-2">
                  {[
                    { id: 'cream', name: 'Creme', bg: 'bg-[#FAF6F0] border-[#E8DDD0]' },
                    { id: 'yellow', name: 'Amarelo', bg: 'bg-[#FEF9C3] border-[#FDE047]' },
                    { id: 'pink', name: 'Rosa', bg: 'bg-[#FCE7F3] border-[#F472B6]' },
                    { id: 'mint', name: 'Menta', bg: 'bg-[#D1FAE5] border-[#34D399]' },
                    { id: 'blue', name: 'Azul', bg: 'bg-[#E0F2FE] border-[#38BDF8]' },
                    { id: 'white', name: 'Branco', bg: 'bg-white border-[#E8DDD0]' },
                  ].map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => setModalColor(c.id as any)}
                      className={`w-7 h-7 rounded-full border-2 ${c.bg} transition-all cursor-pointer flex items-center justify-center ${
                        modalColor === c.id ? 'ring-2 ring-[#8C5332] scale-110' : 'opacity-80'
                      }`}
                      title={c.name}
                    >
                      {modalColor === c.id && <Check className="w-3.5 h-3.5 text-[#58331C]" />}
                    </button>
                  ))}
                </div>
              </div>

              {/* Title */}
              <div>
                <label className="block text-xs font-semibold text-[#79482B] uppercase tracking-wider mb-1.5">
                  Título da Ideia / Nota
                </label>
                <input
                  type="text"
                  value={modalTitle}
                  onChange={(e) => setModalTitle(e.target.value)}
                  placeholder=""
                  className="w-full px-3.5 py-2.5 bg-[#FAF6F0] border border-[#E8DDD0] rounded-xl text-xs sm:text-sm text-[#4A301E] focus:outline-none focus:ring-2 focus:ring-[#8C5332] font-extrabold"
                />
              </div>

              {/* Checklist Items */}
              <div>
                <label className="block text-xs font-semibold text-[#79482B] uppercase tracking-wider mb-1.5">
                  Lista de Tarefas (Checklist)
                </label>

                {/* List of current items */}
                <div className="space-y-1.5 mb-2 max-h-40 overflow-y-auto">
                  {modalItems.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center gap-2 p-2 bg-[#FAF6F0] rounded-xl border border-[#E8DDD0]"
                    >
                      <button
                        type="button"
                        onClick={() => handleToggleModalItem(item.id)}
                        className="text-amber-600 cursor-pointer"
                      >
                        {item.concluido ? (
                          <CheckCircle2 className="w-4 h-4 text-amber-600" />
                        ) : (
                          <Circle className="w-4 h-4 text-[#A48B7B]" />
                        )}
                      </button>
                      <span
                        className={`flex-1 text-xs text-[#4A301E] ${
                          item.concluido ? 'line-through opacity-50' : 'font-medium'
                        }`}
                      >
                        {item.texto}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleRemoveModalItem(item.id)}
                        className="text-red-500 hover:text-red-700 p-1 cursor-pointer"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>

                {/* Add new item row */}
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={newItemText}
                    onChange={(e) => setNewItemText(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddItemToModal();
                      }
                    }}
                    placeholder=""
                    className="flex-1 px-3 py-2 bg-[#FAF6F0] border border-[#E8DDD0] rounded-xl text-xs text-[#4A301E] focus:outline-none focus:ring-2 focus:ring-[#8C5332]"
                  />
                  <button
                    type="button"
                    onClick={() => handleAddItemToModal()}
                    className="py-2 px-3 bg-[#8C5332] text-white text-xs font-bold rounded-xl hover:bg-[#724125] transition-all cursor-pointer shrink-0"
                  >
                    + Add
                  </button>
                </div>
              </div>

              {/* Freeform Content Text */}
              <div>
                <label className="block text-xs font-semibold text-[#79482B] uppercase tracking-wider mb-1.5">
                  Texto Adicional / Rascunho
                </label>
                <textarea
                  rows={3}
                  value={modalContent}
                  onChange={(e) => setModalContent(e.target.value)}
                  placeholder=""
                  className="w-full p-3 bg-[#FAF6F0] border border-[#E8DDD0] rounded-xl text-xs text-[#4A301E] focus:outline-none focus:ring-2 focus:ring-[#8C5332]"
                />
              </div>

              {/* Action Buttons */}
              <div className="pt-3 border-t border-[#F3ECE0] flex items-center justify-between gap-2">
                <div>
                  {editingIdea && (
                    <button
                      type="button"
                      onClick={() => setDeletingIdeaId(editingIdea.id)}
                      className="px-3 py-2 rounded-xl text-xs font-semibold text-red-600 hover:bg-red-50 border border-red-200 transition-colors cursor-pointer flex items-center gap-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Excluir</span>
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2.5 rounded-xl border border-[#E8DDD0] text-xs font-semibold text-[#79482B] hover:bg-[#FAF6F0] transition-colors cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="px-5 py-2.5 rounded-xl bg-[#8C5332] hover:bg-[#724125] text-[#FFFDF9] text-xs font-extrabold shadow-md transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-60"
                  >
                    {saving ? (
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <>
                        <Check className="w-4 h-4" />
                        <span>Salvar Ideia</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Custom Delete Confirmation Dialog */}
      {deletingIdeaId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-[#2C1A0E]/60 backdrop-blur-xs transition-opacity animate-in fade-in"
            onClick={() => setDeletingIdeaId(null)}
          />
          <div className="relative bg-white rounded-2xl shadow-2xl border border-[#E8DDD0] p-6 max-w-sm w-full z-10 text-center space-y-4 my-auto">
            <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-extrabold text-[#58331C] text-base">Excluir Nota</h3>
              <p className="text-xs text-[#9C8272] mt-1">
                Tem certeza que deseja excluir esta anotação? Esta ação não poderá ser desfeita.
              </p>
            </div>
            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDeletingIdeaId(null)}
                className="flex-1 py-2.5 rounded-xl border border-[#E8DDD0] text-xs font-bold text-[#58331C] hover:bg-[#FAF6F0] transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={async () => {
                  const idToDelete = deletingIdeaId;
                  setDeletingIdeaId(null);
                  if (editingIdea && editingIdea.id === idToDelete) {
                    setIsModalOpen(false);
                  }
                  await onDeleteIdea(idToDelete);
                }}
                className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold shadow-md transition-colors cursor-pointer"
              >
                Excluir
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
