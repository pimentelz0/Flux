import React from 'react';
import { Table, Clock } from 'lucide-react';
import { TabType } from '../types';

interface BottomNavProps {
  activeTab: TabType;
  onChangeTab: (tab: TabType) => void;
  countPlanilha: number;
  countParaChegar: number;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  activeTab,
  onChangeTab,
  countPlanilha,
  countParaChegar,
}) => {
  return (
    <nav className="fixed bottom-0 left-0 right-0 h-16 bg-white border-t border-[#E8DDD0] shadow-[0_-4px_12px_rgba(0,0,0,0.05)] z-40 flex items-center justify-around px-2">
      {/* Tab: Planilha */}
      <button
        onClick={() => onChangeTab('planilha')}
        className={`flex-1 max-w-[180px] h-12 rounded-xl flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 px-3 transition-all cursor-pointer ${
          activeTab === 'planilha'
            ? 'bg-[#8C5332] text-[#FFFDF9] font-semibold shadow-sm'
            : 'text-[#9C8272] hover:bg-[#FAF6F0] hover:text-[#79482B]'
        }`}
      >
        <Table className="w-5 h-5 shrink-0" />
        <span className="text-xs sm:text-sm tracking-tight">Planilha</span>
        {countPlanilha > 0 && (
          <span
            className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ml-0.5 ${
              activeTab === 'planilha'
                ? 'bg-[#A86E43] text-white'
                : 'bg-[#F0E6D8] text-[#79482B]'
            }`}
          >
            {countPlanilha}
          </span>
        )}
      </button>

      {/* Tab: Para Chegar */}
      <button
        onClick={() => onChangeTab('para_chegar')}
        className={`flex-1 max-w-[180px] h-12 rounded-xl flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 px-3 transition-all cursor-pointer ${
          activeTab === 'para_chegar'
            ? 'bg-[#8C5332] text-[#FFFDF9] font-semibold shadow-sm'
            : 'text-[#9C8272] hover:bg-[#FAF6F0] hover:text-[#79482B]'
        }`}
      >
        <Clock className="w-5 h-5 shrink-0" />
        <span className="text-xs sm:text-sm tracking-tight">Para Chegar</span>
        {countParaChegar > 0 && (
          <span
            className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ml-0.5 ${
              activeTab === 'para_chegar'
                ? 'bg-[#A86E43] text-white'
                : 'bg-[#F0E6D8] text-[#79482B]'
            }`}
          >
            {countParaChegar}
          </span>
        )}
      </button>
    </nav>
  );
};
