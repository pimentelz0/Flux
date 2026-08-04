import React, { useState, useRef, useEffect } from 'react';
import { Menu, LogOut, NotebookPen, Camera, Trash2 } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface HeaderProps {
  onToggleSidebar: () => void;
  userEmail?: string;
  onOpenSqlModal: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onToggleSidebar, userEmail }) => {
  const [profileOpen, setProfileOpen] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const profileRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const storageKey = `agenda_profile_avatar_${userEmail || 'default'}`;

  useEffect(() => {
    const saved = localStorage.getItem(storageKey);
    if (saved) {
      setAvatarUrl(saved);
    } else {
      setAvatarUrl(null);
    }
  }, [storageKey]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setProfileOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
    } catch (err) {
      console.error('Erro ao sair:', err);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Por favor, selecione um arquivo de imagem.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      if (result) {
        setAvatarUrl(result);
        localStorage.setItem(storageKey, result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleRemovePhoto = () => {
    setAvatarUrl(null);
    localStorage.removeItem(storageKey);
  };

  const userInitial = userEmail ? userEmail.charAt(0).toUpperCase() : 'U';

  return (
    <header className="fixed top-0 left-0 right-0 h-16 bg-[#79482B] text-[#FFFDF9] z-40 px-4 flex items-center justify-between shadow-md border-b border-[#8C5332]">
      {/* Hidden file input for photo upload */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="image/*"
        className="hidden"
      />

      {/* Lado esquerdo: ícone de menu (☰) */}
      <button
        onClick={onToggleSidebar}
        className="p-2.5 rounded-xl text-[#F3ECE0] hover:text-white hover:bg-[#8C5332] transition-colors focus:outline-none cursor-pointer"
        aria-label="Abrir menu"
      >
        <Menu className="w-6 h-6" />
      </button>

      {/* Centro: nome do app */}
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-lg bg-[#8C5332] flex items-center justify-center text-[#FFFDF9] shadow-inner">
          <NotebookPen className="w-4 h-4" />
        </div>
        <h1 className="text-lg sm:text-xl font-extrabold tracking-tight text-[#FFFDF9]">
          Agenda
        </h1>
      </div>

      {/* Lado direito: perfil circular e menu popup */}
      <div className="relative" ref={profileRef}>
        <button
          onClick={() => setProfileOpen(!profileOpen)}
          className="w-10 h-10 rounded-full bg-[#A86E43] text-[#FFFDF9] font-bold text-sm flex items-center justify-center hover:ring-2 hover:ring-[#E8DDD0] transition-all focus:outline-none cursor-pointer border border-[#C58D60] overflow-hidden"
          title={userEmail || 'Perfil'}
        >
          {avatarUrl ? (
            <img src={avatarUrl} alt="Foto de perfil" className="w-full h-full object-cover" />
          ) : (
            userInitial
          )}
        </button>

        {/* Dropdown Menu */}
        {profileOpen && (
          <div className="absolute right-0 mt-2 w-64 bg-white rounded-2xl shadow-xl border border-[#E8DDD0] text-[#4A301E] py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
            <div className="px-4 py-3 border-b border-[#F3ECE0] flex items-center gap-3">
              <div className="w-11 h-11 rounded-full bg-[#8C5332] text-white flex items-center justify-center font-bold text-base overflow-hidden shrink-0 border border-[#A86E43]">
                {avatarUrl ? (
                  <img src={avatarUrl} alt="Foto de perfil" className="w-full h-full object-cover" />
                ) : (
                  userInitial
                )}
              </div>
              <div className="overflow-hidden">
                <p className="text-[10px] font-bold text-[#9C8272] uppercase tracking-wider">Conta Conectada</p>
                <p className="text-xs font-semibold text-[#4A301E] truncate mt-0.5">{userEmail || 'Usuário'}</p>
              </div>
            </div>

            {/* Photo Upload Option */}
            <div className="py-1 border-b border-[#F3ECE0]">
              <button
                onClick={() => fileInputRef.current?.click()}
                className="w-full px-4 py-2.5 text-left text-xs font-medium text-[#79482B] hover:bg-[#FAF6F0] flex items-center gap-2.5 transition-colors cursor-pointer"
              >
                <Camera className="w-4 h-4 text-[#8C5332]" />
                <span>Escolher foto da galeria</span>
              </button>

              {avatarUrl && (
                <button
                  onClick={handleRemovePhoto}
                  className="w-full px-4 py-2 text-left text-[11px] font-medium text-red-600 hover:bg-red-50 flex items-center gap-2.5 transition-colors cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Remover foto de perfil</span>
                </button>
              )}
            </div>

            {/* Logout */}
            <div className="pt-1">
              <button
                onClick={handleLogout}
                className="w-full px-4 py-2.5 text-left text-xs font-semibold text-red-600 hover:bg-red-50 flex items-center gap-2 transition-colors cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
                <span>Sair do app</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </header>
  );
};
