export type VideoType = 'planilha' | 'para_chegar';

export interface VideoItem {
  id: string;
  user_id: string;
  tipo: VideoType;
  titulo: string;
  data: string; // Format YYYY-MM-DD or readable string
  nincho: string; // Nicho / Category
  mes_referencia: string; // Format YYYY-MM (e.g. "2026-08")
  status?: 'planejado' | 'em_producao' | 'gravado' | 'concluido';
  observacoes?: string;
  created_at?: string;
}

export type TabType = 'planilha' | 'para_chegar';

export interface MonthOption {
  key: string; // e.g. "2026-08"
  label: string; // e.g. "Agosto 2026"
  shortLabel: string; // e.g. "Ago 2026"
}
