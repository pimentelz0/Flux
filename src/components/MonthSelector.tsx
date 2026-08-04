import React from 'react';
import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react';
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

  if (activeTab === 'para_chegar') {
    return (
      <div className="bg-white rounded-2xl p-3 sm:p-4 shadow-sm border border-[#E8DDD0] mb-4 flex items-center justify-between">
        <h2 className="text-lg sm:text-xl font-extrabold text-[#58331C]">
          Para chegar
        </h2>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl p-3 sm:p-4 shadow-sm border border-[#E8DDD0] mb-4 flex items-center justify-between gap-3">
      {/* Title + Month Selector side-by-side */}
      <div className="flex items-center gap-2.5 flex-wrap">
        <h2 className="text-lg sm:text-xl font-extrabold text-[#58331C]">
          Planilha
        </h2>

        {/* Small Month Selector Controls */}
        <div className="flex items-center gap-1 bg-[#FAF6F0] p-1 rounded-xl border border-[#E8DDD0]">
          <button
            onClick={handlePrev}
            className="p-1 rounded-lg text-[#79482B] hover:bg-white hover:shadow-xs transition-all cursor-pointer"
            title="Mês Anterior"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <div className="relative flex items-center px-1">
            <Calendar className="w-3.5 h-3.5 text-[#8C5332] mr-1.5 pointer-events-none" />
            <select
              value={currentMonthKey}
              onChange={(e) => onSelectMonth(e.target.value)}
              className="bg-transparent text-xs sm:text-sm font-bold text-[#58331C] focus:outline-none cursor-pointer py-0.5"
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
            className="p-1 rounded-lg text-[#79482B] hover:bg-white hover:shadow-xs transition-all cursor-pointer"
            title="Próximo Mês"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
