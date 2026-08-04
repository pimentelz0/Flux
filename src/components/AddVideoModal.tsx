import React, { useState, useEffect } from 'react';
import { X, Video, Calendar, Tag, Check, Plus } from 'lucide-react';
import { VideoItem, VideoType, MonthOption } from '../types';

interface AddVideoModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (videoData: Partial<VideoItem>) => Promise<void>;
  initialData?: VideoItem | null;
  defaultTab: VideoType;
  defaultMonthKey: string;
  monthsList: MonthOption[];
}

export const AddVideoModal: React.FC<AddVideoModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialData,
  defaultTab,
  defaultMonthKey,
  monthsList,
}) => {
  const [titulo, setTitulo] = useState('');
  const [data, setData] = useState('');
  const [nincho, setNincho] = useState('');
  const [tipo, setTipo] = useState<VideoType>('planilha');
  const [mesReferencia, setMesReferencia] = useState('');
  const [observacoes, setObservacoes] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (initialData) {
      setTitulo(initialData.titulo || '');
      setData(initialData.data || '');
      setNincho(initialData.nincho || '');
      setTipo(initialData.tipo || defaultTab);
      setMesReferencia(initialData.mes_referencia || defaultMonthKey);
      setObservacoes(initialData.observacoes || '');
    } else {
      // Set defaults for new video
      setTitulo('');
      const today = new Date().toISOString().split('T')[0];
      setData(today);
      setNincho('');
      setTipo(defaultTab);
      setMesReferencia(defaultMonthKey);
      setObservacoes('');
    }
    setErrorMsg(null);
  }, [initialData, isOpen, defaultTab, defaultMonthKey]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!titulo.trim()) {
      setErrorMsg(tipo === 'para_chegar' ? 'Por favor, informe o nome da marca.' : 'Por favor, informe o título do vídeo.');
      return;
    }

    setLoading(true);
    setErrorMsg(null);

    try {
      await onSave({
        id: initialData?.id,
        titulo: titulo.trim(),
        data: data || new Date().toISOString().split('T')[0],
        nincho: nincho.trim() || 'Geral',
        tipo,
        mes_referencia: mesReferencia || defaultMonthKey,
        observacoes: observacoes.trim(),
      });
      onClose();
    } catch (err: any) {
      console.error('Erro ao salvar:', err);
      setErrorMsg(err.message || 'Ocorreu um erro ao salvar o registro.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-[#2C1A0E]/60 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
        onClick={onClose}
      />

      {/* Modal Card */}
      <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-[#E8DDD0] text-[#4A301E] overflow-hidden z-10 animate-in zoom-in-95 duration-150 my-auto max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="p-4 sm:p-5 bg-[#79482B] text-[#FFFDF9] flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#8C5332] flex items-center justify-center text-[#FFFDF9]">
              {initialData ? <Video className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
            </div>
            <div>
              <h3 className="font-extrabold text-base sm:text-lg text-[#FFFDF9]">
                {tipo === 'para_chegar'
                  ? initialData ? 'Editar Marca' : 'Adicionar Marca'
                  : initialData ? 'Editar Registro de Vídeo' : 'Adicionar Novo Vídeo'}
              </h3>
              <p className="text-xs text-[#E8DDD0]">
                {tipo === 'planilha' ? 'Planilha de Produção' : 'Aba Para Chegar'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#E8DDD0] hover:text-white hover:bg-[#8C5332] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 overflow-y-auto space-y-4 flex-1">
          {errorMsg && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-800 text-xs rounded-xl font-medium">
              {errorMsg}
            </div>
          )}

          {/* Titulo / Nome da Marca */}
          <div>
            <label className="block text-xs font-semibold text-[#79482B] uppercase tracking-wider mb-1.5">
              {tipo === 'para_chegar' ? 'Nome da Marca *' : 'Título do Vídeo *'}
            </label>
            <div className="relative">
              <Tag className="w-4 h-4 text-[#A48B7B] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                required
                value={titulo}
                onChange={(e) => setTitulo(e.target.value)}
                placeholder={tipo === 'para_chegar' ? 'Ex: Nike, Sephora, Zara...' : 'Ex: Como organizar sua rotina'}
                className="w-full pl-10 pr-4 py-2.5 bg-[#FAF6F0] border border-[#E8DDD0] rounded-xl text-xs sm:text-sm text-[#4A301E] placeholder-[#B5A092] focus:outline-none focus:ring-2 focus:ring-[#8C5332]"
              />
            </div>
          </div>

          {tipo === 'planilha' && (
            <>
              {/* Data & Mês de Referência */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#79482B] uppercase tracking-wider mb-1.5">
                    Data do Vídeo
                  </label>
                  <div>
                    <input
                      type="date"
                      value={data}
                      onChange={(e) => setData(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-[#FAF6F0] border border-[#E8DDD0] rounded-xl text-xs sm:text-sm text-[#4A301E] focus:outline-none focus:ring-2 focus:ring-[#8C5332]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#79482B] uppercase tracking-wider mb-1.5">
                    Mês de Referência
                  </label>
                  <select
                    value={mesReferencia}
                    onChange={(e) => setMesReferencia(e.target.value)}
                    className="w-full px-3 py-2.5 bg-[#FAF6F0] border border-[#E8DDD0] rounded-xl text-xs sm:text-sm text-[#4A301E] focus:outline-none focus:ring-2 focus:ring-[#8C5332]"
                  >
                    {monthsList.map((m) => (
                      <option key={m.key} value={m.key}>
                        {m.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Nincho / Nicho */}
              <div>
                <label className="block text-xs font-semibold text-[#79482B] uppercase tracking-wider mb-1.5">
                  Nincho (Categoria / Tema)
                </label>
                <div className="relative">
                  <Tag className="w-4 h-4 text-[#A48B7B] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    value={nincho}
                    onChange={(e) => setNincho(e.target.value)}
                    placeholder="Ex: Tutorial, Tecnologia, VLOG"
                    className="w-full pl-10 pr-4 py-2.5 bg-[#FAF6F0] border border-[#E8DDD0] rounded-xl text-xs sm:text-sm text-[#4A301E] placeholder-[#B5A092] focus:outline-none focus:ring-2 focus:ring-[#8C5332]"
                  />
                </div>
              </div>

              {/* Observações */}
              <div>
                <label className="block text-xs font-semibold text-[#79482B] uppercase tracking-wider mb-1.5">
                  Observações (Opcional)
                </label>
                <textarea
                  rows={2}
                  value={observacoes}
                  onChange={(e) => setObservacoes(e.target.value)}
                  placeholder="Anotações adicionais sobre o roteiro, links ou equipamentos..."
                  className="w-full p-3 bg-[#FAF6F0] border border-[#E8DDD0] rounded-xl text-xs sm:text-sm text-[#4A301E] placeholder-[#B5A092] focus:outline-none focus:ring-2 focus:ring-[#8C5332]"
                />
              </div>
            </>
          )}

          {/* Submit Buttons */}
          <div className="pt-3 border-t border-[#F3ECE0] flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-[#E8DDD0] text-xs font-semibold text-[#79482B] hover:bg-[#FAF6F0] transition-colors cursor-pointer"
            >
              Cancelar
            </button>

            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2.5 rounded-xl bg-[#8C5332] hover:bg-[#724125] text-[#FFFDF9] text-xs font-semibold shadow-md transition-all flex items-center gap-1.5 disabled:opacity-60 cursor-pointer"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  <span>{initialData ? 'Atualizar' : 'Salvar'}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
