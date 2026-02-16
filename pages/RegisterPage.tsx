
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../supabase';
import { Loader2, UserPlus, AlertCircle, ArrowLeft } from 'lucide-react';

export const RegisterPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);

    try {
      // Clean and safe Auth Sign Up
      // Metadata in options.data will be picked up by the SQL Trigger 'on_auth_user_created'
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
          }
        }
      });

      if (authError) throw authError;
      
      // If we reach here, Auth was successful. 
      // The backend trigger handles the creation of the 'profiles' row automatically.
      alert('Registrasi berhasil! Silakan login untuk masuk ke sistem.');
      navigate('/login');

    } catch (error: any) {
      console.error('Registration error:', error);
      setErrorMsg(error.message || 'Gagal registrasi. Pastikan data valid.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-black p-4 transition-colors">
      <div className="max-w-md w-full bg-white dark:bg-gray-900 rounded-3xl shadow-2xl border-2 border-gray-100 dark:border-gray-800 overflow-hidden">
        
        {/* Header Section */}
        <div className="bg-green-600 p-8 text-center text-white relative border-b-4 border-green-700">
          <Link to="/login" className="absolute left-4 top-6 p-2 hover:bg-white/20 rounded-full transition-all active:scale-90">
            <ArrowLeft size={24} strokeWidth={3} />
          </Link>
          <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-4 backdrop-blur-md shadow-lg rotate-3">
            <UserPlus className="text-white w-8 h-8" strokeWidth={3} />
          </div>
          <h1 className="text-2xl font-black uppercase tracking-tight">Akun Kolektor</h1>
          <p className="text-green-100 text-xs font-bold uppercase tracking-widest mt-1 opacity-80">E-Parkir Madiun</p>
        </div>

        {/* Form Section */}
        <div className="p-8">
          {errorMsg && (
            <div className="mb-6 bg-red-50 dark:bg-red-950/30 border-2 border-red-200 dark:border-red-900/50 text-red-700 dark:text-red-400 p-4 rounded-2xl flex items-start gap-3 text-sm font-bold animate-in slide-in-from-top-2">
              <AlertCircle size={20} className="flex-shrink-0" strokeWidth={3} />
              <span>{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleRegister} className="space-y-5">
            <div>
              <label htmlFor="fullName" className="block text-[10px] font-black text-gray-700 dark:text-gray-400 uppercase tracking-widest mb-2 ml-1">Nama Lengkap</label>
              <input
                id="fullName"
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full h-14 px-5 rounded-2xl border-2 border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-black text-gray-900 dark:text-white font-bold placeholder-gray-500 focus:border-green-500 dark:focus:border-green-600 outline-none transition-all shadow-inner"
                placeholder="Masukkan Nama Lengkap"
              />
            </div>

            <div>
              <label htmlFor="email" className="block text-[10px] font-black text-gray-700 dark:text-gray-400 uppercase tracking-widest mb-2 ml-1">Email Kolektor</label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full h-14 px-5 rounded-2xl border-2 border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-black text-gray-900 dark:text-white font-bold placeholder-gray-500 focus:border-green-500 dark:focus:border-green-600 outline-none transition-all shadow-inner"
                placeholder="email@madiun.go.id"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-[10px] font-black text-gray-700 dark:text-gray-400 uppercase tracking-widest mb-2 ml-1">Password</label>
              <input
                id="password"
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full h-14 px-5 rounded-2xl border-2 border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-black text-gray-900 dark:text-white font-bold placeholder-gray-500 focus:border-green-500 dark:focus:border-green-600 outline-none transition-all shadow-inner"
                placeholder="Minimal 6 Karakter"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full h-16 bg-green-600 hover:bg-green-700 text-white font-black text-lg rounded-2xl shadow-xl shadow-green-600/20 flex items-center justify-center gap-3 active:scale-95 transition-all disabled:bg-gray-300 dark:disabled:bg-gray-800 mt-4 border-b-4 border-green-800"
            >
              {loading ? <Loader2 className="animate-spin" size={24} strokeWidth={3} /> : 'DAFTAR SEKARANG'}
            </button>
          </form>
          
          <div className="mt-8 text-center">
            <Link to="/login" className="text-sm text-green-600 dark:text-green-400 hover:underline font-black tracking-tight uppercase">
              Sudah punya akun? Login di sini
            </Link>
          </div>
        </div>
        
        <div className="px-8 pb-8 text-center border-t-2 border-gray-50 dark:border-gray-800 pt-4">
            <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest">
                Dinas Perhubungan Kota Madiun
            </p>
        </div>
      </div>
    </div>
  );
};