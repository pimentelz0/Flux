import React from 'react';
import { ChevronLeft, ChevronRight, Calendar, Sparkles } from 'lucide-react';
import { MonthOption, TabType } from '../types';

interface MonthSelectorProps {
  currentMonthKey: string;
  onSelectMonth: (monthKey: string) => void;
  monthsList: MonthOption[];
  activeTab: TabType;
}

export const MonthSelector: React.FC<MonthSelectorProps> = ({
  currentMonthKey,
  onSelectMonth,
  monthsList,
  activeTab,
}) => {
  const currentIndex = monthsList.findIndex((m) => m.key === currentMonthKey);
  const currentMonthObj = monthsList[currentIndex] || {
    key: currentMonthKey,
    label: currentMonthKey,
    shortLabel: currentMonthKey,
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      onSelectMonth(monthsList[currentIndex - 1].key);
    } else {
      // Generate previous month
      const [yearStr, monthStr] = currentMonthKey.split('-');
      let year = parseInt(yearStr, 10);
      let month = parseInt(monthStr, 10) - 1;
      if (month < 1) {
        month = 12;
        year -= 1;
      }
      const newKey = `${year}-${String(month).padStart(2, '0')}`;
      onSelectMonth(newKey);
    }
  };

  const handleNext = () => {
    if (currentIndex >= 0 && currentIndex < monthsList.length - 1) {
      onSelectMonth(monthsList[currentIndex + 1].key);
    } else {
      // Generate next month
      const [yearStr, monthStr] = currentMonthKey.split('-');
      let year = parseInt(yearStr, 10);
      let month = parseInt(monthStr, 10) + 1;
      if (month > 12) {
        month = 1;
        year += 1;
      }
      const newKey = `${year}-${String(month).padStart(2, '0')}`;
      onSelectMonth(newKey);
    }
  };

  const tabTitle = activeTab === 'planilha' ? 'Planilha Vídeo' : 'Ideias Para Chegar';

  return (
    <div className="bg-white rounded-2xl p-4 sm:p-5 shadow-sm border border-[#E8DDD0] mb-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        {/* Dynamic Title */}
        <div>
          <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#8C5332] bg-[#FAF6F0] px-2.5 py-1 rounded-md border border-[#E8DDD0] mb-1">
            <Sparkles className="w-3.5 h-3.5 text-[#8C5332]" />
            <span>{tabTitle}</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-[#58331C]">
            {tabTitle} — {currentMonthObj.label}
          </h2>
        </div>

        {/* Month Selector Controls */}
        <div className="flex items-center gap-2 bg-[#FAF6F0] p-1.5 rounded-xl border border-[#E8DDD0] shrink-0 self-start sm:self-auto">
          <button
            onClick={handlePrev}
            className="p-2 rounded-lg text-[#79482B] hover:bg-white hover:shadow-xs transition-all cursor-pointer"
            title="Mês Anterior"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>

          <div className="relative flex items-center px-2">
            <Calendar className="w-4 h-4 text-[#8C5332] mr-2 pointer-events-none" />
            <select
              value={currentMonthKey}
              onChange={(e) => onSelectMonth(e.target.value)}
              className="bg-transparent text-xs sm:text-sm font-extrabold text-[#58331C] focus:outline-none cursor-pointer pr-1 py-1"
            >
              {monthsList.map((m) => (
                <option key={m.key} value={m.key}>
                  {m.label}
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={handleNext}
            className="p-2 rounded-lg text-[#79482B] hover:bg-white hover:shadow-xs transition-all cursor-pointer"
            title="Próximo Mês"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};
