import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { supabase } from './lib/supabase';
import { User } from '@supabase/supabase-js';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { BottomNav } from './components/BottomNav';
import { MonthSelector } from './components/MonthSelector';
import { VideoTable } from './components/VideoTable';
import { AddVideoModal } from './components/AddVideoModal';
import { LoginScreen } from './components/LoginScreen';
import { SqlSetupModal } from './components/SqlSetupModal';
import { VideoItem, TabType, MonthOption } from './types';
import { Plus, Database, AlertTriangle, FileSpreadsheet } from 'lucide-react';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  const currentUser = user;

  // Layout & Navigation State
  const [activeTab, setActiveTab] = useState<TabType>('planilha');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSqlModalOpen, setIsSqlModalOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingVideo, setEditingVideo] = useState<VideoItem | null>(null);

  // Month Selection State (e.g., "2026-08")
  const todayKey = useMemo(() => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    return `${year}-${month}`;
  }, []);

  const [currentMonthKey, setCurrentMonthKey] = useState<string>(todayKey);

  // Data State
  const [videos, setVideos] = useState<VideoItem[]>([]);
  const [loadingData, setLoadingData] = useState(false);
  const [tableMissingError, setTableMissingError] = useState(false);
  const [generalError, setGeneralError] = useState<string | null>(null);

  // Generate Months List (e.g. 12 months surrounding current year)
  const monthsList = useMemo<MonthOption[]>(() => {
    const monthsNamesPt = [
      'Janeiro',
      'Fevereiro',
      'Março',
      'Abril',
      'Maio',
      'Junho',
      'Julho',
      'Agosto',
      'Setembro',
      'Outubro',
      'Novembro',
      'Dezembro',
    ];

    const currentYear = new Date().getFullYear();
    const list: MonthOption[] = [];

    // Generate for previous year, current year, and next year
    for (let yr = currentYear - 1; yr <= currentYear + 1; yr++) {
      for (let m = 1; m <= 12; m++) {
        const monthPad = String(m).padStart(2, '0');
        const key = `${yr}-${monthPad}`;
        const name = monthsNamesPt[m - 1];
        list.push({
          key,
          label: `${name} ${yr}`,
          shortLabel: `${name.substring(0, 3)} ${yr}`,
        });
      }
    }
    return list;
  }, []);

  // Listen to Supabase Auth state changes
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setAuthLoading(false);
    }).catch(() => {
      setAuthLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setAuthLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Fetch videos for current logged in user & month from Supabase or Local Storage
  const fetchVideos = useCallback(async () => {
    if (!currentUser) return;
    setLoadingData(true);
    setGeneralError(null);
    setTableMissingError(false);

    let fetchedFromSupabase = false;

    // Try Supabase first
    try {
      const { data, error } = await supabase
        .from('videos')
        .select('*')
        .eq('user_id', currentUser.id)
        .eq('mes_referencia', currentMonthKey)
        .order('created_at', { ascending: false });

      if (!error && data) {
        setVideos(data as VideoItem[]);
        fetchedFromSupabase = true;
      } else if (error) {
        if (
          error.message?.includes('relation "public.videos" does not exist') ||
          error.code === '42P01' ||
          error.message?.includes('does not exist')
        ) {
          setTableMissingError(true);
        }
      }
    } catch (err: any) {
      console.warn('Supabase fetch failed, falling back to local storage:', err);
    }

    // Local Storage Fallback if Supabase was unavailable or table missing
    if (!fetchedFromSupabase) {
      try {
        const localKey = `videos_store_${currentUser.id}`;
        const storedJson = localStorage.getItem(localKey);
        if (storedJson) {
          const allLocal: VideoItem[] = JSON.parse(storedJson);
          const filtered = allLocal.filter((v) => v.mes_referencia === currentMonthKey);
          setVideos(filtered);
        } else {
          setVideos([]);
        }
      } catch (err) {
        console.error('Erro ao ler do localStorage:', err);
      }
    }

    setLoadingData(false);
  }, [currentUser, currentMonthKey]);

  useEffect(() => {
    if (currentUser) {
      fetchVideos();
    }
  }, [currentUser, currentMonthKey, fetchVideos]);

  // Handle Save (Add or Update)
  const handleSaveVideo = async (videoData: Partial<VideoItem>) => {
    if (!currentUser) return;

    const payload: VideoItem = {
      id: videoData.id || (typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : String(Date.now())),
      user_id: currentUser.id,
      tipo: videoData.tipo || activeTab,
      titulo: videoData.titulo!,
      data: videoData.data || new Date().toISOString().split('T')[0],
      nincho: videoData.nincho || 'Geral',
      mes_referencia: videoData.mes_referencia || currentMonthKey,
      observacoes: videoData.observacoes || '',
      status: videoData.status || 'planejado',
      created_at: new Date().toISOString(),
    };

    // Try Supabase
    try {
      if (videoData.id) {
        await supabase
          .from('videos')
          .update(payload)
          .eq('id', videoData.id)
          .eq('user_id', currentUser.id);
      } else {
        await supabase.from('videos').insert([payload]);
      }
    } catch (err) {
      console.warn('Erro ao salvar no Supabase, salvando localmente:', err);
    }

    // Backup to local storage
    const localKey = `videos_store_${currentUser.id}`;
    let allLocal: VideoItem[] = [];
    try {
      const stored = localStorage.getItem(localKey);
      if (stored) allLocal = JSON.parse(stored);
    } catch {}

    if (videoData.id) {
      allLocal = allLocal.map((v) => (v.id === videoData.id ? { ...v, ...payload } : v));
    } else {
      allLocal.unshift(payload);
    }

    localStorage.setItem(localKey, JSON.stringify(allLocal));
    fetchVideos();
  };

  // Handle Inline Update
  const handleInlineUpdate = async (id: string, field: keyof VideoItem, value: string) => {
    if (!currentUser) return;

    try {
      await supabase
        .from('videos')
        .update({ [field]: value })
        .eq('id', id)
        .eq('user_id', currentUser.id);
    } catch (err) {
      console.warn('Aviso de atualização inline no Supabase:', err);
    }

    setVideos((prev) =>
      prev.map((v) => (v.id === id ? { ...v, [field]: value } : v))
    );

    const localKey = `videos_store_${currentUser.id}`;
    try {
      const stored = localStorage.getItem(localKey);
      if (stored) {
        const allLocal: VideoItem[] = JSON.parse(stored);
        const updated = allLocal.map((v) => (v.id === id ? { ...v, [field]: value } : v));
        localStorage.setItem(localKey, JSON.stringify(updated));
      }
    } catch {}
  };

  // Handle Delete
  const handleDeleteVideo = async (id: string) => {
    if (!currentUser) return;
    if (!window.confirm('Tem certeza que deseja excluir este vídeo da planilha?')) return;

    try {
      await supabase
        .from('videos')
        .delete()
        .eq('id', id)
        .eq('user_id', currentUser.id);
    } catch (err) {
      console.warn('Aviso de exclusão no Supabase:', err);
    }

    setVideos((prev) => prev.filter((v) => v.id !== id));

    const localKey = `videos_store_${currentUser.id}`;
    try {
      const stored = localStorage.getItem(localKey);
      if (stored) {
        const allLocal: VideoItem[] = JSON.parse(stored);
        const updated = allLocal.filter((v) => v.id !== id);
        localStorage.setItem(localKey, JSON.stringify(updated));
      }
    } catch {}
  };

  // Toggle video between "Planilha" and "Para Chegar"
  const handleToggleTabType = async (video: VideoItem) => {
    if (!currentUser) return;
    const newTipo: TabType = video.tipo === 'planilha' ? 'para_chegar' : 'planilha';

    try {
      await supabase
        .from('videos')
        .update({ tipo: newTipo })
        .eq('id', video.id)
        .eq('user_id', currentUser.id);
    } catch (err) {
      console.warn('Aviso ao mover vídeo no Supabase:', err);
    }

    setVideos((prev) =>
      prev.map((v) => (v.id === video.id ? { ...v, tipo: newTipo } : v))
    );

    const localKey = `videos_store_${currentUser.id}`;
    try {
      const stored = localStorage.getItem(localKey);
      if (stored) {
        const allLocal: VideoItem[] = JSON.parse(stored);
        const updated = allLocal.map((v) => (v.id === video.id ? { ...v, tipo: newTipo } : v));
        localStorage.setItem(localKey, JSON.stringify(updated));
      }
    } catch {}
  };

  // CSV Export
  const handleExportCsv = () => {
    const activeVideos = videos.filter((v) => v.tipo === activeTab);
    if (activeVideos.length === 0) {
      alert('Nenhum vídeo para exportar neste mês.');
      return;
    }

    const currentMonthObj = monthsList.find((m) => m.key === currentMonthKey);
    const monthLabel = currentMonthObj ? currentMonthObj.label : currentMonthKey;

    let csvContent = 'data:text/csv;charset=utf-8,';
    csvContent += 'ID;Vídeo;Data;Nincho;Aba;Mês de Referência;Observações\n';

    activeVideos.forEach((v) => {
      const row = [
        v.id,
        `"${(v.titulo || '').replace(/"/g, '""')}"`,
        v.data || '',
        `"${(v.nincho || '').replace(/"/g, '""')}"`,
        v.tipo,
        v.mes_referencia,
        `"${(v.observacoes || '').replace(/"/g, '""')}"`,
      ].join(';');
      csvContent += row + '\n';
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute(
      'download',
      `Planilha_Videos_${activeTab}_${currentMonthKey}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Screen loading indicator during initial auth check
  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#FAF6F0] flex items-center justify-center text-[#58331C]">
        <div className="text-center">
          <div className="w-10 h-10 border-3 border-[#8C5332] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-xs font-semibold text-[#9C8272]">Carregando Flux...</p>
        </div>
      </div>
    );
  }

  // If not logged in, render LoginScreen
  if (!currentUser) {
    return <LoginScreen onSuccess={() => {}} />;
  }

  // Filter current tab videos
  const currentTabVideos = videos.filter((v) => v.tipo === activeTab);
  const countPlanilha = videos.filter((v) => v.tipo === 'planilha').length;
  const countParaChegar = videos.filter((v) => v.tipo === 'para_chegar').length;

  return (
    <div className="min-h-screen bg-[#FAF6F0] text-[#4A301E] pb-24 font-sans selection:bg-[#F0E6D8]">
      {/* Top Fixed Header */}
      <Header
        onToggleSidebar={() => setIsSidebarOpen(true)}
        userEmail={currentUser.email}
        onOpenSqlModal={() => setIsSqlModalOpen(true)}
      />

      {/* Drawer Sidebar */}
      <Sidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        activeTab={activeTab}
        onChangeTab={setActiveTab}
        currentMonthKey={currentMonthKey}
        onSelectMonth={setCurrentMonthKey}
        monthsList={monthsList}
        videos={videos}
        userEmail={currentUser.email}
        onOpenSqlModal={() => setIsSqlModalOpen(true)}
        onExportCsv={handleExportCsv}
      />

      {/* Main Content Area */}
      <main className="pt-20 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto">
        {/* Banner if Supabase table 'videos' is missing */}
        {tableMissingError && (
          <div className="mb-6 p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <h4 className="font-bold text-xs sm:text-sm">Tabela 'videos' não encontrada no Supabase</h4>
                <p className="text-xs text-amber-700 mt-0.5">
                  Execute o script de criação da tabela no SQL Editor do Supabase para habilitar o armazenamento seguro.
                </p>
              </div>
            </div>
            <button
              onClick={() => setIsSqlModalOpen(true)}
              className="px-3.5 py-2 bg-[#8C5332] text-white text-xs font-semibold rounded-xl hover:bg-[#724125] transition-colors shrink-0 flex items-center gap-1.5 cursor-pointer"
            >
              <Database className="w-4 h-4" />
              <span>Ver Script SQL</span>
            </button>
          </div>
        )}

        {generalError && (
          <div className="mb-6 p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-800 text-xs font-medium">
            {generalError}
          </div>
        )}

        {/* Month Selector Component */}
        <MonthSelector
          currentMonthKey={currentMonthKey}
          onSelectMonth={setCurrentMonthKey}
          monthsList={monthsList}
          activeTab={activeTab}
        />

        {/* Video Spreadsheet / Table */}
        <VideoTable
          videos={currentTabVideos}
          activeTab={activeTab}
          onEdit={(v) => {
            setEditingVideo(v);
            setIsAddModalOpen(true);
          }}
          onDelete={handleDeleteVideo}
          onToggleTabType={handleToggleTabType}
          onOpenAddModal={() => {
            setEditingVideo(null);
            setIsAddModalOpen(true);
          }}
          loading={loadingData}
          onInlineUpdate={handleInlineUpdate}
        />
      </main>

      {/* Botão Fixo "+ Adicionar vídeo" em cada aba */}
      <div className="fixed bottom-20 right-4 sm:right-6 z-30">
        <button
          onClick={() => {
            setEditingVideo(null);
            setIsAddModalOpen(true);
          }}
          className="py-3 px-5 rounded-full bg-[#8C5332] hover:bg-[#724125] text-[#FFFDF9] font-bold text-xs sm:text-sm shadow-xl hover:shadow-2xl transition-all duration-200 flex items-center gap-2 border border-[#A86E43] hover:scale-105 active:scale-95 cursor-pointer"
        >
          <Plus className="w-5 h-5" />
          <span>+ Adicionar vídeo</span>
        </button>
      </div>

      {/* Fixed Bottom Tab Bar */}
      <BottomNav
        activeTab={activeTab}
        onChangeTab={setActiveTab}
        countPlanilha={countPlanilha}
        countParaChegar={countParaChegar}
      />

      {/* Add / Edit Video Modal */}
      <AddVideoModal
        isOpen={isAddModalOpen}
        onClose={() => {
          setIsAddModalOpen(false);
          setEditingVideo(null);
        }}
        onSave={handleSaveVideo}
        initialData={editingVideo}
        defaultTab={activeTab}
        defaultMonthKey={currentMonthKey}
        monthsList={monthsList}
      />

      {/* Supabase SQL Setup Modal */}
      <SqlSetupModal
        isOpen={isSqlModalOpen}
        onClose={() => setIsSqlModalOpen(false)}
      />
    </div>
  );
}
