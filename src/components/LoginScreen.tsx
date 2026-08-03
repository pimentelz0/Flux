import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { Video, Lock, Mail, ArrowRight, CheckCircle2, AlertCircle } from 'lucide-react';

interface LoginScreenProps {
  onSuccess?: () => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ onSuccess }) => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!email || !password) {
      setErrorMsg('Por favor, preencha o e-mail e a senha.');
      setLoading(false);
      return;
    }

    try {
      if (isSignUp) {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
        });

        if (error) throw error;

        if (data?.session) {
          setSuccessMsg('Conta criada com sucesso! Redirecionando...');
          if (onSuccess) onSuccess();
        } else if (data?.user) {
          setSuccessMsg('Conta criada com sucesso! Se for necessária confirmação, verifique sua caixa de entrada de e-mail.');
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) throw error;
        if (onSuccess) onSuccess();
      }
    } catch (err: any) {
      console.error('Erro de autenticação:', err);
      let message = err.message || 'Ocorreu um erro ao tentar se autenticar.';
      if (message.includes('Invalid login credentials')) {
        message = 'E-mail ou senha incorretos. Por favor, verifique seus dados.';
      } else if (message.includes('User already registered')) {
        message = 'Este e-mail já está cadastrado. Alterne para a aba "Entrar" e faça login.';
      } else if (message.includes('Password should be at least')) {
        message = 'A senha deve ter pelo menos 6 caracteres.';
      }
      setErrorMsg(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F9F6F0] flex flex-col justify-center items-center p-4 sm:p-6 text-[#4A301E]">
      <div className="w-full max-w-md">
        {/* Logo and Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-[#79482B] text-[#FFFDF9] shadow-lg mb-4">
            <Video className="w-8 h-8" />
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-[#58331C]">
            Flux
          </h1>
          <p className="text-sm text-[#836A5B] mt-2 font-medium">
            Sua planilha inteligente de organização de conteúdo audiovisual por mês
          </p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-sm border border-[#E8DDD0]">
          <div className="flex border-b border-[#E8DDD0] mb-6">
            <button
              type="button"
              onClick={() => { setIsSignUp(false); setErrorMsg(null); setSuccessMsg(null); }}
              className={`flex-1 pb-3 text-center text-sm font-semibold transition-colors relative cursor-pointer ${
                !isSignUp ? 'text-[#79482B]' : 'text-[#9C8272] hover:text-[#79482B]'
              }`}
            >
              Entrar
              {!isSignUp && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#79482B] rounded-full" />
              )}
            </button>
            <button
              type="button"
              onClick={() => { setIsSignUp(true); setErrorMsg(null); setSuccessMsg(null); }}
              className={`flex-1 pb-3 text-center text-sm font-semibold transition-colors relative cursor-pointer ${
                isSignUp ? 'text-[#79482B]' : 'text-[#9C8272] hover:text-[#79482B]'
              }`}
            >
              Criar Conta
              {isSignUp && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#79482B] rounded-full" />
              )}
            </button>
          </div>

          {errorMsg && (
            <div className="mb-5 p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-800 text-xs sm:text-sm flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="mb-5 p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs sm:text-sm flex items-start gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <span>{successMsg}</span>
            </div>
          )}

          <form onSubmit={handleAuth} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-[#79482B] uppercase tracking-wider mb-1.5">
                E-mail
              </label>
              <div className="relative">
                <Mail className="w-5 h-5 text-[#A48B7B] absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="seu@email.com"
                  className="w-full pl-10 pr-4 py-2.5 bg-[#FAF6F0] border border-[#E8DDD0] rounded-xl text-sm text-[#4A301E] placeholder-[#B5A092] focus:outline-none focus:ring-2 focus:ring-[#8C5332] focus:border-transparent transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#79482B] uppercase tracking-wider mb-1.5">
                Senha
              </label>
              <div className="relative">
                <Lock className="w-5 h-5 text-[#A48B7B] absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  minLength={6}
                  className="w-full pl-10 pr-4 py-2.5 bg-[#FAF6F0] border border-[#E8DDD0] rounded-xl text-sm text-[#4A301E] placeholder-[#B5A092] focus:outline-none focus:ring-2 focus:ring-[#8C5332] focus:border-transparent transition-all"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-3 px-4 bg-[#8C5332] hover:bg-[#724125] text-[#FFFDF9] font-semibold rounded-xl shadow-md transition-all flex items-center justify-center gap-2 text-sm disabled:opacity-60 cursor-pointer"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <span>{isSignUp ? 'Criar minha conta' : 'Acessar o Flux'}</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <div className="mt-6 pt-4 border-t border-[#F3ECE0] text-center text-xs text-[#9C8272]">
            <span>Autenticação segura via Supabase Auth</span>
          </div>
        </div>

        {/* Footer info */}
        <p className="text-center text-xs text-[#9C8272] mt-6">
          Flux — Organizador de Conteúdo Audiovisual © {new Date().getFullYear()}
        </p>
      </div>
    </div>
  );
};
