import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { supabase } from './lib/supabase';
import { User } from '@supabase/supabase-js';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { MonthSelector } from './components/MonthSelector';
import { VideoTable } from './components/VideoTable';
import { AddVideoModal } from './components/AddVideoModal';
import { LoginScreen } from './components/LoginScreen';
import { SqlSetupModal } from './components/SqlSetupModal';
import { IdeiasView } from './components/IdeiasView';
import { ConteudosView } from './components/ConteudosView';
import { VideoItem, TabType, MonthOption, IdeaItem, ConteudoPlanilha, ConteudoRow } from './types';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Database, AlertTriangle, Plus, Trash2 } from 'lucide-react';

// Helper to sort videos from most recent to oldest (newest date/creation at top)
const sortMostRecentFirst = (a: VideoItem, b: VideoItem) => {
  const dateA = (a.data || '').trim();
  const dateB = (b.data || '').trim();
  if (dateA && dateB && dateA !== dateB) {
    return dateB.localeCompare(dateA);
  }
  if (dateA && !dateB) return -1;
  if (!dateA && dateB) return 1;

  const createdA = a.created_at ? new Date(a.created_at).getTime() : 0;
  const createdB = b.created_at ? new Date(b.created_at).getTime() : 0;
  if (createdA !== createdB) {
    return createdB - createdA;
  }
  return (b.id || '').localeCompare(a.id || '');
};

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
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Ideas / Notes State
  const [ideas, setIdeas] = useState<IdeaItem[]>([]);

  // Contents (Stories x Videos Spreadsheets) State
  const [conteudos, setConteudos] = useState<ConteudoPlanilha[]>([]);

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

  // Filter and sort current tab videos (most recent first)
  const currentTabVideos = useMemo(() => {
    return videos
      .filter((v) => v.tipo === activeTab)
      .sort(sortMostRecentFirst);
  }, [videos, activeTab]);

  const countPlanilha = videos.filter((v) => v.tipo === 'planilha').length;
  const countParaChegar = videos.filter((v) => v.tipo === 'para_chegar').length;

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
      let query = supabase
        .from('videos')
        .select('*')
        .eq('user_id', currentUser.id);

      if (activeTab === 'planilha' || activeTab === 'para_chegar') {
        query = query.eq('mes_referencia', currentMonthKey);
      }

      const { data, error } = await query
        .order('data', { ascending: false, nullsFirst: false })
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
          const filtered = (activeTab === 'planilha' || activeTab === 'para_chegar')
            ? allLocal.filter((v) => (v.mes_referencia || '2026-08') === currentMonthKey)
            : allLocal;
          setVideos(filtered);
        } else {
          setVideos([]);
        }
      } catch (err) {
        console.error('Erro ao ler do localStorage:', err);
      }
    }

    setLoadingData(false);
  }, [currentUser, currentMonthKey, activeTab]);

  useEffect(() => {
    if (currentUser) {
      fetchVideos();
    }
  }, [currentUser, currentMonthKey, activeTab, fetchVideos]);

  // Fetch Ideas
  const fetchIdeas = useCallback(async () => {
    if (!currentUser) return;
    let fetchedFromSupabase = false;

    try {
      const { data, error } = await supabase
        .from('ideias')
        .select('*')
        .eq('user_id', currentUser.id)
        .order('created_at', { ascending: false });

      if (!error && data) {
        setIdeas(data as IdeaItem[]);
        fetchedFromSupabase = true;
      }
    } catch (err) {
      console.warn('Erro ao carregar ideias do Supabase, usando local:', err);
    }

    if (!fetchedFromSupabase) {
      try {
        const localKey = `ideias_store_${currentUser.id}`;
        const stored = localStorage.getItem(localKey);
        if (stored) {
          setIdeas(JSON.parse(stored));
        } else {
          setIdeas([]);
        }
      } catch (err) {
        console.error('Erro ao ler ideias do localStorage:', err);
      }
    }
  }, [currentUser]);

  // Fetch Conteúdos (Stories x Vídeos Spreadsheets)
  const fetchConteudos = useCallback(async () => {
    if (!currentUser) return;
    let fetchedFromSupabase = false;

    try {
      const { data, error } = await supabase
        .from('conteudos')
        .select('*')
        .eq('user_id', currentUser.id)
        .order('created_at', { ascending: false });

      if (!error && data) {
        setConteudos(data as ConteudoPlanilha[]);
        fetchedFromSupabase = true;
      }
    } catch (err) {
      console.warn('Erro ao carregar conteúdos do Supabase, usando local:', err);
    }

    if (!fetchedFromSupabase) {
      try {
        const localKey = `conteudos_store_${currentUser.id}`;
        const stored = localStorage.getItem(localKey);
        if (stored) {
          setConteudos(JSON.parse(stored));
        } else {
          setConteudos([]);
        }
      } catch (err) {
        console.error('Erro ao ler conteúdos do localStorage:', err);
      }
    }
  }, [currentUser]);

  useEffect(() => {
    if (currentUser) {
      fetchIdeas();
      fetchConteudos();
    }
  }, [currentUser, fetchIdeas, fetchConteudos]);

  // Handle saving spreadsheet for a specific month
  const handleSaveConteudoForMonth = async (
    mes: string,
    linhas: ConteudoRow[],
    titulo = 'Conteúdos do Mês',
    cor: 'white' | 'cream' | 'yellow' | 'pink' | 'mint' | 'blue' = 'cream'
  ) => {
    if (!currentUser) return;

    const existing = conteudos.find((c) => c.mes_referencia === mes);
    const nowIso = new Date().toISOString();

    const record: ConteudoPlanilha = {
      id: existing ? existing.id : (typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `conteudo_${Date.now()}_${Math.random()}`),
      user_id: currentUser.id,
      mes_referencia: mes,
      titulo,
      cor,
      linhas,
      created_at: existing ? existing.created_at : nowIso,
      updated_at: nowIso,
    };

    // Update state locally
    setConteudos((prev) => {
      const idx = prev.findIndex((c) => c.mes_referencia === mes);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = record;
        return next;
      }
      return [record, ...prev];
    });

    // Save to Supabase (upsert / update or insert)
    try {
      if (existing) {
        await supabase
          .from('conteudos')
          .update({
            linhas,
            titulo,
            cor,
            updated_at: nowIso,
          })
          .eq('id', existing.id)
          .eq('user_id', currentUser.id);
      } else {
        await supabase.from('conteudos').insert([record]);
      }
    } catch (err) {
      console.warn('Erro ao salvar conteúdo no Supabase:', err);
    }

    // Save to LocalStorage
    const localKey = `conteudos_store_${currentUser.id}`;
    try {
      const stored = localStorage.getItem(localKey);
      const allLocal: ConteudoPlanilha[] = stored ? JSON.parse(stored) : [];
      const idx = allLocal.findIndex((c) => c.mes_referencia === mes);
      if (idx >= 0) {
        allLocal[idx] = record;
      } else {
        allLocal.unshift(record);
      }
      localStorage.setItem(localKey, JSON.stringify(allLocal));
    } catch {}
  };

  const handleAddIdea = async (ideaData: Partial<IdeaItem>) => {
    if (!currentUser) return;
    const newIdea: IdeaItem = {
      id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `idea_${Date.now()}_${Math.random()}`,
      user_id: currentUser.id,
      titulo: ideaData.titulo || 'Nova Ideia',
      conteudo: ideaData.conteudo || '',
      items: ideaData.items || [],
      cor: ideaData.cor || 'cream',
      created_at: new Date().toISOString(),
    };

    setIdeas((prev) => [newIdea, ...prev]);

    try {
      await supabase.from('ideias').insert([newIdea]);
    } catch (err) {
      console.warn('Erro ao salvar ideia no Supabase:', err);
    }

    const localKey = `ideias_store_${currentUser.id}`;
    try {
      const stored = localStorage.getItem(localKey);
      const allLocal: IdeaItem[] = stored ? JSON.parse(stored) : [];
      allLocal.unshift(newIdea);
      localStorage.setItem(localKey, JSON.stringify(allLocal));
    } catch {}
  };

  const handleUpdateIdea = async (updatedIdea: IdeaItem) => {
    if (!currentUser) return;

    setIdeas((prev) =>
      prev.map((i) => (i.id === updatedIdea.id ? updatedIdea : i))
    );

    try {
      await supabase
        .from('ideias')
        .update(updatedIdea)
        .eq('id', updatedIdea.id)
        .eq('user_id', currentUser.id);
    } catch (err) {
      console.warn('Erro ao atualizar ideia no Supabase:', err);
    }

    const localKey = `ideias_store_${currentUser.id}`;
    try {
      const stored = localStorage.getItem(localKey);
      if (stored) {
        const allLocal: IdeaItem[] = JSON.parse(stored);
        const nextLocal = allLocal.map((i) => (i.id === updatedIdea.id ? updatedIdea : i));
        localStorage.setItem(localKey, JSON.stringify(nextLocal));
      }
    } catch {}
  };

  const handleDeleteIdea = async (id: string) => {
    if (!currentUser) return;

    setIdeas((prev) => prev.filter((i) => i.id !== id));

    try {
      await supabase
        .from('ideias')
        .delete()
        .eq('id', id)
        .eq('user_id', currentUser.id);
    } catch (err) {
      console.warn('Erro ao excluir ideia no Supabase:', err);
    }

    const localKey = `ideias_store_${currentUser.id}`;
    try {
      const stored = localStorage.getItem(localKey);
      if (stored) {
        const allLocal: IdeaItem[] = JSON.parse(stored);
        const nextLocal = allLocal.filter((i) => i.id !== id);
        localStorage.setItem(localKey, JSON.stringify(nextLocal));
      }
    } catch {}
  };

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
  const confirmDeleteVideo = async (id: string) => {
    if (!currentUser) return;

    // Immediate UI removal
    setVideos((prev) => prev.filter((v) => v.id !== id));

    try {
      await supabase
        .from('videos')
        .delete()
        .eq('id', id)
        .eq('user_id', currentUser.id);
    } catch (err) {
      console.warn('Aviso de exclusão no Supabase:', err);
    }

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

  const handleDeleteVideo = (id: string) => {
    setDeletingId(id);
  };

  // Duplicate video to the other tab ("Planilha" <-> "Para Chegar")
  const handleToggleTabType = async (video: VideoItem) => {
    if (!currentUser) return;
    const targetTipo: TabType = video.tipo === 'planilha' ? 'para_chegar' : 'planilha';
    const duplicatedId = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `vid_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

    const duplicatedItem: VideoItem = {
      ...video,
      id: duplicatedId,
      tipo: targetTipo,
      created_at: new Date().toISOString(),
    };

    try {
      await supabase.from('videos').insert([duplicatedItem]);
    } catch (err) {
      console.warn('Aviso ao duplicar vídeo no Supabase:', err);
    }

    setVideos((prev) => [duplicatedItem, ...prev]);

    const localKey = `videos_store_${currentUser.id}`;
    try {
      const stored = localStorage.getItem(localKey);
      const allLocal: VideoItem[] = stored ? JSON.parse(stored) : [];
      allLocal.unshift(duplicatedItem);
      localStorage.setItem(localKey, JSON.stringify(allLocal));
    } catch {}
  };

  // PDF Export (Data, Vídeo, Nicho with app theme styling)
  const handleExportPdf = () => {
    const activeVideos = currentTabVideos;
    if (activeVideos.length === 0) {
      alert('Nenhum registro para exportar nesta lista.');
      return;
    }

    const currentMonthObj = monthsList.find((m) => m.key === currentMonthKey);
    const monthLabel = currentMonthObj ? currentMonthObj.label : currentMonthKey;
    const tabTitle = activeTab === 'para_chegar' ? 'Marcas Para Chegar' : 'Planilha de Vídeos';

    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });

    // Header Background (#79482B)
    doc.setFillColor(121, 72, 43);
    doc.rect(0, 0, 210, 28, 'F');

    // Title: Agenda
    doc.setTextColor(255, 253, 249);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(18);
    doc.text('Agenda', 14, 18);

    // Subtitle
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(11);
    doc.setTextColor(232, 221, 208);
    doc.text(`${tabTitle} - ${monthLabel}`, 196, 18, { align: 'right' });

    // Table Header Data: Data, Vídeo, Nicho (exactly 3 fields)
    const tableData = activeVideos.map((v) => {
      let formattedDate = v.data || '';
      if (formattedDate.includes('-')) {
        const parts = formattedDate.split('-');
        if (parts.length === 3) {
          formattedDate = `${parts[2]}/${parts[1]}/${parts[0]}`;
        }
      }
      return [formattedDate, v.titulo || '', v.nincho || '-'];
    });

    autoTable(doc, {
      startY: 36,
      head: [['Data', 'Vídeo', 'Nicho']],
      body: tableData,
      theme: 'grid',
      headStyles: {
        fillColor: [140, 83, 50], // #8C5332
        textColor: [255, 253, 249], // #FFFDF9
        fontStyle: 'bold',
        fontSize: 10,
        halign: 'left',
      },
      bodyStyles: {
        textColor: [74, 48, 30], // #4A301E
        fontSize: 9,
        cellPadding: 4,
      },
      alternateRowStyles: {
        fillColor: [250, 246, 240], // #FAF6F0
      },
      tableLineColor: [232, 221, 208], // #E8DDD0
      tableLineWidth: 0.1,
      columnStyles: {
        0: { cellWidth: 32 }, // Data
        1: { cellWidth: 'auto' }, // Vídeo
        2: { cellWidth: 45 }, // Nicho
      },
      margin: { left: 14, right: 14 },
    });

    doc.save(`Agenda_${activeTab}_${currentMonthKey}.pdf`);
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

  return (
    <div className="min-h-screen bg-[#FAF6F0] text-[#4A301E] pb-12 font-sans selection:bg-[#F0E6D8]">
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
        videos={videos}
        countIdeias={ideas.length}
        countConteudos={conteudos.length}
        userEmail={currentUser.email}
        onOpenSqlModal={() => setIsSqlModalOpen(true)}
        onExportPdf={handleExportPdf}
      />

      {/* Main Content Area */}
      <main className="pt-20 pb-10 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto">
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

        {activeTab === 'ideias' ? (
          <IdeiasView
            ideas={ideas}
            onAddIdea={handleAddIdea}
            onUpdateIdea={handleUpdateIdea}
            onDeleteIdea={handleDeleteIdea}
          />
        ) : activeTab === 'conteudos' ? (
          <ConteudosView
            conteudos={conteudos}
            currentMonthKey={currentMonthKey}
            onSelectMonth={setCurrentMonthKey}
            monthsList={monthsList}
            onSaveConteudoForMonth={handleSaveConteudoForMonth}
          />
        ) : (
          <>
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
              onSaveQuickItem={handleSaveVideo}
            />
          </>
        )}
      </main>

      {/* Floating Fixed Add Button for Spreadsheet Tabs */}
      {activeTab !== 'ideias' && activeTab !== 'conteudos' && (
        <button
          onClick={() => {
            setEditingVideo(null);
            setIsAddModalOpen(true);
          }}
          className="fixed bottom-6 right-6 z-40 bg-[#8C5332] hover:bg-[#724125] text-[#FFFDF9] text-xs font-bold py-2.5 px-4 rounded-full shadow-lg border border-[#A86E43] flex items-center gap-2 hover:scale-105 active:scale-95 transition-all cursor-pointer"
          title={activeTab === 'para_chegar' ? 'Adicionar Marca' : 'Adicionar Vídeo'}
        >
          <Plus className="w-4 h-4" />
          <span>Adicionar</span>
        </button>
      )}

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

      {/* Delete Confirmation Modal */}
      {deletingId && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl border border-[#E8DDD0] space-y-4">
            <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto shrink-0">
              <Trash2 className="w-6 h-6" />
            </div>
            <div className="text-center">
              <h3 className="text-base font-extrabold text-[#58331C]">Confirmar Exclusão</h3>
              <p className="text-xs text-[#836A5B] mt-1">
                Tem certeza que deseja excluir este registro? Essa ação não pode ser desfeita.
              </p>
            </div>
            <div className="flex items-center gap-3 pt-2">
              <button
                onClick={() => setDeletingId(null)}
                className="flex-1 py-2.5 px-4 rounded-xl border border-[#E8DDD0] bg-[#FAF6F0] hover:bg-[#F0E6D8] text-[#79482B] text-xs font-bold transition-all cursor-pointer"
              >
                Cancelar
              </button>
              <button
                onClick={() => {
                  confirmDeleteVideo(deletingId);
                  setDeletingId(null);
                }}
                className="flex-1 py-2.5 px-4 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold transition-all shadow-xs cursor-pointer"
              >
                Sim, Excluir
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
