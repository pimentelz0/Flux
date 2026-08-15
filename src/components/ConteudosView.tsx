import React, { useState, useEffect, useRef } from 'react';
import {
  Plus,
  Trash2,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Check,
  Palette,
  Columns,
  Save,
} from 'lucide-react';
import { ConteudoPlanilha, ConteudoRow, MonthOption } from '../types';

interface ConteudosViewProps {
  conteudos: ConteudoPlanilha[];
  currentMonthKey: string;
  onSelectMonth: (monthKey: string) => void;
  monthsList: MonthOption[];
  onSaveConteudoForMonth: (mes: string, linhas: ConteudoRow[], titulo?: string, cor?: any) => Promise<void>;
  loading?: boolean;
}

export const ConteudosView: React.FC<ConteudosViewProps> = ({
  conteudos,
  currentMonthKey,
  onSelectMonth,
  monthsList,
  onSaveConteudoForMonth,
  loading = false,
}) => {
  // Find current month's spreadsheet or create a local default
  const monthData = conteudos.find((c) => c.mes_referencia === currentMonthKey);

  const [linhas, setLinhas] = useState<ConteudoRow[]>([
    { id: '1', story: '', video: '' },
    { id: '2', story: '', video: '' },
    { id: '3', story: '', video: '' },
    { id: '4', story: '', video: '' },
  ]);
  const [cor, setCor] = useState<'white' | 'cream' | 'yellow' | 'pink' | 'mint' | 'blue'>('cream');
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');

  // Sync state whenever selected month changes or data loads
  useEffect(() => {
    if (monthData) {
      setCor(monthData.cor || 'cream');
      if (monthData.linhas && monthData.linhas.length > 0) {
        setLinhas(monthData.linhas);
      } else {
        setLinhas([
          { id: Date.now() + '-1', story: '', video: '' },
          { id: Date.now() + '-2', story: '', video: '' },
          { id: Date.now() + '-3', story: '', video: '' },
          { id: Date.now() + '-4', story: '', video: '' },
        ]);
      }
    } else {
      setCor('cream');
      setLinhas([
        { id: Date.now() + '-1', story: '', video: '' },
        { id: Date.now() + '-2', story: '', video: '' },
        { id: Date.now() + '-3', story: '', video: '' },
        { id: Date.now() + '-4', story: '', video: '' },
      ]);
    }
  }, [currentMonthKey, monthData]);

  // Debounced auto-save timer ref
  const saveTimeoutRef = useRef<any>(null);

  const triggerAutoSave = (updatedLinhas: ConteudoRow[], updatedCor: any) => {
    setSaveStatus('saving');
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    saveTimeoutRef.current = setTimeout(async () => {
      try {
        await onSaveConteudoForMonth(currentMonthKey, updatedLinhas, 'Conteúdos do Mês', updatedCor);
        setSaveStatus('saved');
        setTimeout(() => setSaveStatus('idle'), 2000);
      } catch (err) {
        console.error('Erro no auto-save:', err);
        setSaveStatus('idle');
      }
    }, 600);
  };

  const handleAddRow = () => {
    const newLinha: ConteudoRow = {
      id: `${Date.now()}-${linhas.length + 1}`,
      story: '',
      video: '',
    };
    const next = [...linhas, newLinha];
    setLinhas(next);
    triggerAutoSave(next, cor);
  };

  const handleUpdateRow = (index: number, field: 'story' | 'video', value: string) => {
    const next = [...linhas];
    next[index] = { ...next[index], [field]: value };
    setLinhas(next);
    triggerAutoSave(next, cor);
  };

  const handleRemoveRow = (index: number) => {
    let next = linhas.filter((_, i) => i !== index);
    if (next.length === 0) {
      next = [{ id: Date.now().toString(), story: '', video: '' }];
    }
    setLinhas(next);
    triggerAutoSave(next, cor);
  };

  const handleColorChange = (newColor: any) => {
    setCor(newColor);
    triggerAutoSave(linhas, newColor);
  };

  // Month navigation handlers
  const currentIndex = monthsList.findIndex((m) => m.key === currentMonthKey);

  const handlePrevMonth = () => {
    if (currentIndex > 0) {
      onSelectMonth(monthsList[currentIndex - 1].key);
    } else {
      const [yearStr, monthStr] = currentMonthKey.split('-');
      let year = parseInt(yearStr, 10);
      let month = parseInt(monthStr, 10) - 1;
      if (month < 1) {
        month = 12;
        year -= 1;
      }
      onSelectMonth(`${year}-${String(month).padStart(2, '0')}`);
    }
  };

  const handleNextMonth = () => {
    if (currentIndex >= 0 && currentIndex < monthsList.length - 1) {
      onSelectMonth(monthsList[currentIndex + 1].key);
    } else {
      const [yearStr, monthStr] = currentMonthKey.split('-');
      let year = parseInt(yearStr, 10);
      let month = parseInt(monthStr, 10) + 1;
      if (month > 12) {
        month = 1;
        year += 1;
      }
      onSelectMonth(`${year}-${String(month).padStart(2, '0')}`);
    }
  };

  const currentMonthLabel = monthsList.find((m) => m.key === currentMonthKey)?.label || currentMonthKey;

  return (
    <div className="space-y-4 pb-24 max-w-5xl mx-auto">
      {/* Centered Month Card Header */}
      <div className="bg-white rounded-2xl p-3 sm:p-4 shadow-sm border border-[#E8DDD0] flex items-center justify-center relative">
        {/* Centered Month Selector Controls */}
        <div className="flex items-center gap-1.5 bg-[#FAF6F0] p-1.5 rounded-xl border border-[#E8DDD0] shadow-2xs">
          <button
            onClick={handlePrevMonth}
            className="p-1 rounded-lg text-[#79482B] hover:bg-white hover:shadow-xs transition-all cursor-pointer"
            title="Mês Anterior"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <div className="relative flex items-center px-2">
            <Calendar className="w-4 h-4 text-[#8C5332] mr-2 pointer-events-none" />
            <select
              value={currentMonthKey}
              onChange={(e) => onSelectMonth(e.target.value)}
              className="bg-transparent text-sm sm:text-base font-extrabold text-[#58331C] focus:outline-none cursor-pointer py-0.5 pr-1"
            >
              {monthsList.map((m) => (
                <option key={m.key} value={m.key}>
                  {m.label}
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={handleNextMonth}
            className="p-1 rounded-lg text-[#79482B] hover:bg-white hover:shadow-xs transition-all cursor-pointer"
            title="Próximo Mês"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Status indicator absolute right on desktop/tablet */}
        <div className="absolute right-4 hidden sm:flex items-center gap-2">
          {saveStatus === 'saving' && (
            <span className="text-[11px] font-semibold text-[#8C5332] animate-pulse flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-[#8C5332]" />
              Salvando...
            </span>
          )}
          {saveStatus === 'saved' && (
            <span className="text-[11px] font-semibold text-emerald-700 flex items-center gap-1">
              <Check className="w-3.5 h-3.5" />
              Salvo
            </span>
          )}
        </div>
      </div>

      {/* Embedded Full-Screen Spreadsheet (Stories x Vídeos) */}
      <div className="bg-white rounded-2xl shadow-sm border border-[#E8DDD0] overflow-hidden">
        {/* Table Top Banner Header (Dark styled like reference photo) */}
        <div className="grid grid-cols-[40px_1fr_1fr_40px] sm:grid-cols-[48px_1fr_1fr_44px] bg-[#2C1A0E] text-[#FFFDF9] py-3.5 px-2 sm:px-3 border-b border-[#58331C] text-center font-serif items-center shadow-xs">
          <span className="text-[11px] font-mono text-[#E8DDD0] font-bold">Nº</span>
          
          {/* Column 1: Stories */}
          <div className="border-r border-white/20 pr-2 sm:pr-4">
            <div className="inline-block bg-white text-[#2C1A0E] px-4 py-1 rounded-lg text-xs sm:text-sm font-extrabold tracking-wide uppercase shadow-xs">
              Stories
            </div>
          </div>

          {/* Column 2: Vídeos */}
          <div className="pl-2 sm:pl-4">
            <div className="inline-block bg-white text-[#2C1A0E] px-4 py-1 rounded-lg text-xs sm:text-sm font-extrabold tracking-wide uppercase shadow-xs">
              Vídeos
            </div>
          </div>

          <span className="w-4"></span>
        </div>

        {/* Spreadsheet Rows */}
        <div className="divide-y divide-[#E8DDD0] bg-white">
          {linhas.map((linha, index) => (
            <div
              key={linha.id || index}
              className="grid grid-cols-[40px_1fr_1fr_40px] sm:grid-cols-[48px_1fr_1fr_44px] items-stretch hover:bg-[#FAF6F0]/40 transition-colors group"
            >
              {/* Row Index Number */}
              <div className="flex items-center justify-center text-xs font-mono font-bold text-[#8C5332] bg-[#FAF6F0] border-r border-[#E8DDD0]">
                {index + 1}
              </div>

              {/* Stories Cell */}
              <div className="p-2 sm:p-3 border-r border-[#E8DDD0]">
                <textarea
                  value={linha.story}
                  onChange={(e) => handleUpdateRow(index, 'story', e.target.value)}
                  rows={2}
                  className="w-full p-2 bg-transparent rounded-lg text-base sm:text-sm text-[#4A301E] focus:outline-none focus:bg-[#FAF6F0] resize-none border-none leading-relaxed transition-colors"
                />
              </div>

              {/* Vídeos Cell */}
              <div className="p-2 sm:p-3">
                <textarea
                  value={linha.video}
                  onChange={(e) => handleUpdateRow(index, 'video', e.target.value)}
                  rows={2}
                  className="w-full p-2 bg-transparent rounded-lg text-base sm:text-sm text-[#4A301E] focus:outline-none focus:bg-[#FAF6F0] resize-none border-none leading-relaxed transition-colors"
                />
              </div>

              {/* Row Delete Button */}
              <div className="flex items-center justify-center p-1 bg-[#FAF6F0]/30 border-l border-[#E8DDD0]">
                <button
                  type="button"
                  onClick={() => handleRemoveRow(index)}
                  className="p-1.5 text-[#A48B7B] hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                  title="Remover Linha"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Table Footer with Add Row Button */}
        <div className="p-3 sm:p-4 bg-[#FAF6F0] border-t border-[#E8DDD0] flex items-center justify-start">
          <button
            type="button"
            onClick={handleAddRow}
            className="px-4 py-2 bg-[#8C5332] hover:bg-[#724125] text-[#FFFDF9] text-xs sm:text-sm font-bold rounded-xl transition-all flex items-center gap-1.5 shadow-xs cursor-pointer active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>Adicionar Linha</span>
          </button>
        </div>
      </div>
    </div>
  );
};
