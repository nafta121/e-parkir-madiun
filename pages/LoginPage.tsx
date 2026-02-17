
import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../supabase';
import { useAuth } from '../contexts/AuthContext';
import { Loader2, LogIn, AlertCircle } from 'lucide-react';

export const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const navigate = useNavigate();
  const { session } = useAuth();

  // This effect redirects the user if they are already logged in.
  // It also handles the redirect AFTER a successful login when the session state updates.
  useEffect(() => {
    if (session) {
      navigate('/', { replace: true });
    }
  }, [session, navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;
      
      // The alert provides feedback. The redirection is now handled by the useEffect hook
      // which reacts to the session state change, preventing race conditions and iframe errors.
      const fullName = data.user?.user_metadata?.full_name ?? 'Kolektor';
      alert(`Selamat Bertugas, ${fullName}!`);
      
    } catch (error: any) {
      setErrorMsg(error.message || 'Gagal masuk. Periksa email dan password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4 transition-colors">
      <div className="max-w-md w-full bg-white rounded-3xl shadow-2xl border-2 border-gray-100 overflow-hidden">
        
        {/* Header Section */}
        <div className="bg-blue-600 p-10 text-center relative border-b-4 border-blue-700">
          <div className="w-20 h-20 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-4 backdrop-blur-md shadow-lg rotate-3">
            <LogIn className="text-white w-10 h-10" strokeWidth={3} />
          </div>
          <h1 className="text-3xl font-black text-white tracking-tight uppercase">E-Parkir</h1>
          <p className="text-blue-100 text-xs font-bold uppercase tracking-widest mt-1 opacity-80">Kota Madiun</p>
        </div>

        {/* Form Section */}
        <div className="p-8">
          {errorMsg && (
            <div className="mb-6 bg-red-50 border-2 border-red-200 text-red-700 p-4 rounded-2xl flex items-start gap-3 text-sm font-bold animate-in slide-in-from-top-2">
              <AlertCircle size={20} className="flex-shrink-0" strokeWidth={3} />
              <span>{errorMsg}</span>
            </div>
          )}

          <form id="login-form" onSubmit={handleLogin} className="space-y-6">
            <div>
              <label htmlFor="email" className="block text-[10px] font-black text-gray-700 uppercase tracking-widest mb-2 ml-1">Email Kolektor</label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="username"
                autoCapitalize="none"
                spellCheck={false}
                enterKeyHint="next"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full h-14 px-5 rounded-2xl border-2 border-gray-200 bg-gray-50 text-gray-900 font-bold placeholder-gray-500 focus:border-blue-500 focus:bg-white outline-none transition-all shadow-inner"
                placeholder="petugas@madiun.go.id"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-[10px] font-black text-gray-700 uppercase tracking-widest mb-2 ml-1">Password</label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                enterKeyHint="done"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full h-14 px-5 rounded-2xl border-2 border-gray-200 bg-gray-50 text-gray-900 font-bold placeholder-gray-500 focus:border-blue-500 focus:bg-white outline-none transition-all shadow-inner"
                placeholder="••••••••"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full h-16 bg-blue-600 hover:bg-blue-700 text-white font-black text-lg rounded-2xl shadow-xl shadow-blue-600/20 flex items-center justify-center gap-3 active:scale-95 transition-all disabled:bg-gray-300 border-b-4 border-blue-800"
            >
              {loading ? (
                <Loader2 className="animate-spin" size={24} strokeWidth={3} />
              ) : (
                'MASUK SISTEM'
              )}
            </button>
          </form>

          <div className="mt-8 text-center">
            <p className="text-sm text-gray-600 font-medium">
              Belum punya akun?{' '}
              <Link to="/register" className="text-blue-600 hover:underline font-black tracking-tight uppercase">
                Daftar Disini
              </Link>
            </p>
          </div>
        </div>
        
        <div className="px-8 pb-8 text-center border-t-2 border-gray-50 pt-4">
            <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest">
                Kota Madiun
            </p>
        </div>

      </div>
    </div>
  );
};
