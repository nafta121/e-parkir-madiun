
import React, { useState, useMemo } from 'react';
import { useParkingPoints } from '../../hooks/useParkingData';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../supabase';
import { Loader2, Plus, Search, Edit2, Trash2, Save, X, MapPin, User, ArchiveRestore, Sun, Moon, Target, AlertCircle } from 'lucide-react';

interface ParkingPoint {
  id: number;
  location_name: string;
  street_name: string;
  jukir_name: string;
  shift: 'Pagi' | 'Malam';
  target_amount: number;
  is_active: boolean;
}

// DRY Principle: Constants for repeated class strings
const tableHeaderClass = "px-6 py-5";
const tableCellClass = "px-6 py-4";
const actionButtonClass = "h-11 w-11 flex items-center justify-center rounded-xl transition-all active:scale-90 border-2 border-transparent";

export const JukirManagement: React.FC = () => {
  const queryClient = useQueryClient();
  
  // 1. Data Fetching using useQuery (via custom hook)
  const { data: parkingPoints, isLoading } = useParkingPoints();
  
  // 2. Data Mutations using useMutation directly in the component
  const saveMutation = useMutation({
    mutationFn: async (payload: any) => {
      if (payload.id) {
        // Update existing item
        const { error } = await supabase.from('parking_points').update(payload).eq('id', payload.id);
        if (error) throw error;
      } else {
        // Create new item
        const { error } = await supabase.from('parking_points').insert([payload]);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      // Automatically refetch data after a successful mutation
      queryClient.invalidateQueries({ queryKey: ['parking-points'] });
    },
  });

  const toggleMutation = useMutation({
    mutationFn: async ({ id, is_active }: { id: number; is_active: boolean }) => {
      const { error } = await supabase.from('parking_points').update({ is_active }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['parking-points'] });
    },
  });
  
  // Local UI State
  const [searchTerm, setSearchTerm] = useState('');
  const [filterShift, setFilterShift] = useState<'all' | 'Pagi' | 'Malam'>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<ParkingPoint | null>(null);
  
  const [formData, setFormData] = useState({
    location_name: '',
    street_name: '',
    jukir_name: '',
    shift: 'Pagi' as 'Pagi' | 'Malam',
    target_amount: ''
  });

  const handleOpenAdd = () => {
    setEditingItem(null);
    setFormData({ location_name: '', street_name: '', jukir_name: '', shift: 'Pagi', target_amount: '' });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (item: ParkingPoint) => {
    setEditingItem(item);
    setFormData({
      location_name: item.location_name,
      street_name: item.street_name || '',
      jukir_name: item.jukir_name,
      shift: item.shift,
      target_amount: String(item.target_amount)
    });
    setIsModalOpen(true);
  };

  const handleToggleStatus = (item: ParkingPoint) => {
    const action = item.is_active ? 'menonaktifkan' : 'mengaktifkan kembali';
    if (!confirm(`Apakah anda yakin ingin ${action} data jukir ${item.jukir_name}?`)) return;
    
    toggleMutation.mutate({ id: item.id, is_active: !item.is_active });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const numericAmount = parseInt(formData.target_amount.replace(/\D/g, '')) || 0;

    const payload: any = {
      location_name: formData.location_name,
      street_name: formData.street_name,
      jukir_name: formData.jukir_name,
      shift: formData.shift,
      target_amount: numericAmount,
    };

    if (editingItem) payload.id = editingItem.id;

    saveMutation.mutate(payload, {
      onSuccess: () => {
        setIsModalOpen(false);
      }
    });
  };

  // 3. Client-side filtering logic remains unchanged
  const filteredData = useMemo(() => {
    if (!parkingPoints) return [];
    return parkingPoints.filter(item => {
      if (filterShift !== 'all' && item.shift !== filterShift) return false;
      const searchLower = searchTerm.toLowerCase();
      return (
        item.jukir_name.toLowerCase().includes(searchLower) || 
        item.location_name.toLowerCase().includes(searchLower) ||
        (item.street_name && item.street_name.toLowerCase().includes(searchLower))
      );
    });
  }, [parkingPoints, filterShift, searchTerm]);

  const formatRupiah = (val: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(val);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center p-20">
        <Loader2 className="animate-spin text-blue-600 mb-4" size={48} strokeWidth={3} />
        <p className="text-gray-900 font-black">MEMUAT MASTER JUKIR...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
      
      {/* Header & Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-gray-900 tracking-tight">DATA MASTER JURU PARKIR</h2>
          <p className="text-sm text-gray-500 font-bold uppercase tracking-wider">Kelola titik parkir & target setoran</p>
        </div>
        <button 
          onClick={handleOpenAdd}
          className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-2xl font-black flex items-center gap-2 shadow-xl shadow-blue-600/20 active:scale-95 transition-all border-b-4 border-blue-800"
        >
          <Plus size={24} strokeWidth={3} /> TAMBAH JUKIR
        </button>
      </div>

      {/* Filters Bar */}
      <div className="bg-white p-4 rounded-2xl shadow-sm border-2 border-gray-100 flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-3.5 text-gray-400" size={20} />
          <input 
            type="text" 
            placeholder="Cari jukir, lokasi, atau jalan..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-3.5 rounded-xl border-2 border-gray-200 bg-gray-50 placeholder-gray-500 focus:bg-white focus:border-blue-500 outline-none transition-all font-bold"
          />
        </div>

        <div className="flex p-1 bg-gray-100 rounded-xl">
          {(['all', 'Pagi', 'Malam'] as const).map((opt) => (
            <button
              key={opt}
              onClick={() => setFilterShift(opt)}
              className={`px-6 py-2.5 rounded-lg text-xs font-black transition-all ${
                filterShift === opt ? 'bg-white text-blue-700 shadow-sm shadow-blue-200' : 'text-gray-500 hover:text-gray-800'
              }`}
            >
              {opt === 'all' ? 'SEMUA SHIFT' : opt.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      {/* Table Data */}
      <div className="bg-white rounded-2xl shadow-md border-2 border-gray-100 overflow-hidden overflow-x-auto">
        <table className="w-full text-sm text-left border-collapse">
          <thead className="bg-gray-900 text-white uppercase text-[10px] font-black tracking-widest">
            <tr>
              <th className={tableHeaderClass}>Juru Parkir</th>
              <th className={tableHeaderClass}>Lokasi & Ruas Jalan</th>
              <th className={`${tableHeaderClass} text-center`}>Shift</th>
              <th className={`${tableHeaderClass} text-right`}>Target</th>
              <th className={`${tableHeaderClass} text-center`}>Status</th>
              <th className={`${tableHeaderClass} text-center`}>Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y-2 divide-gray-50">
            {filteredData.map((item) => (
              <tr key={item.id} className={`hover:bg-blue-50/50 transition-colors ${!item.is_active ? 'bg-gray-50/50 opacity-60' : ''}`}>
                <td className={`${tableCellClass} whitespace-nowrap`}>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-black text-lg border-2 border-blue-200">
                      {item.jukir_name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-black text-gray-900 leading-tight">{item.jukir_name.toUpperCase()}</p>
                      <p className="text-[10px] font-bold text-gray-400">ID: {item.id}</p>
                    </div>
                  </div>
                </td>
                <td className={tableCellClass}>
                  <div className="flex items-center gap-2 font-black text-gray-700">
                    <MapPin size={16} className="text-red-500" strokeWidth={3} />
                    {item.location_name}
                  </div>
                  {item.street_name && (
                    <p className="text-[10px] text-blue-600 font-black mt-1 ml-6 uppercase tracking-wider">
                      {item.street_name}
                    </p>
                  )}
                </td>
                <td className={`${tableCellClass} text-center`}>
                  <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-black border-2 ${
                    item.shift === 'Pagi' ? 'bg-orange-50 text-orange-700 border-orange-200' : 'bg-indigo-50 text-indigo-700 border-indigo-200'
                  }`}>
                    {item.shift === 'Pagi' ? <Sun size={12} strokeWidth={3} /> : <Moon size={12} strokeWidth={3} />}
                    {item.shift.toUpperCase()}
                  </span>
                </td>
                <td className={`${tableCellClass} text-right`}>
                  <div className="flex items-center justify-end gap-1.5 text-green-700 font-black font-mono">
                    <Target size={14} />
                    {formatRupiah(item.target_amount)}
                  </div>
                </td>
                <td className={`${tableCellClass} text-center`}>
                  <span className={`px-2 py-1 rounded text-[9px] font-black uppercase tracking-widest border-2 ${
                    item.is_active ? 'bg-green-100 text-green-800 border-green-200' : 'bg-red-100 text-red-800 border-red-200'
                  }`}>
                    {item.is_active ? 'AKTIF' : 'OFF'}
                  </span>
                </td>
                <td className={`${tableCellClass} text-center`}>
                  <div className="flex items-center justify-center gap-1">
                    <button 
                      onClick={() => handleOpenEdit(item)}
                      disabled={toggleMutation.isPending}
                      className={`${actionButtonClass} text-blue-600 hover:bg-blue-100 hover:border-blue-200 disabled:opacity-50`}
                    >
                      <Edit2 size={18} strokeWidth={3} />
                    </button>
                    <button 
                      onClick={() => handleToggleStatus(item)}
                      disabled={toggleMutation.isPending}
                      className={`${actionButtonClass} ${
                        item.is_active ? 'text-gray-400 hover:text-red-600 hover:bg-red-50 hover:border-red-200' : 'text-green-600 hover:bg-green-50 hover:border-green-200'
                      } disabled:opacity-50`}
                    >
                      {item.is_active ? <Trash2 size={18} strokeWidth={3} /> : <ArchiveRestore size={18} strokeWidth={3} />}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {filteredData.length === 0 && (
              <tr>
                <td colSpan={6} className="p-20 text-center text-gray-400">
                  <div className="flex flex-col items-center gap-4">
                    <AlertCircle size={64} className="opacity-10" />
                    <p className="font-black uppercase tracking-tight">Tidak ada data jukir ditemukan</p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* FORM MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md p-4 animate-in fade-in">
          <div className="bg-white w-full max-w-lg rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 border-2 border-gray-100">
            <div className="bg-gray-950 p-6 flex justify-between items-center text-white border-b-4 border-blue-600">
              <h3 className="font-black text-xl flex items-center gap-3 uppercase tracking-tight">
                {editingItem ? <Edit2 size={24} strokeWidth={3} /> : <Plus size={24} strokeWidth={3} />}
                {editingItem ? 'Edit Data Jukir' : 'Tambah Jukir Baru'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="bg-white/10 hover:bg-white/20 p-2 rounded-2xl transition-all">
                <X size={28} strokeWidth={3} />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-8 space-y-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2 ml-1">Nama Juru Parkir</label>
                  <div className="relative">
                    <User className="absolute left-4 top-4 text-gray-400" size={20} />
                    <input 
                      type="text" 
                      required
                      placeholder="NAMA LENGKAP JUKIR"
                      value={formData.jukir_name}
                      onChange={e => setFormData({...formData, jukir_name: e.target.value.toUpperCase()})}
                      className="w-full pl-12 pr-4 py-4 rounded-2xl border-2 border-gray-200 bg-gray-100 focus:bg-white focus:border-blue-500 outline-none font-black text-gray-900 transition-all shadow-inner"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2 ml-1">Titik Parkir</label>
                    <input 
                      type="text" 
                      required
                      placeholder="CONTOH: DEPAN TOKO A"
                      value={formData.location_name}
                      onChange={e => setFormData({...formData, location_name: e.target.value.toUpperCase()})}
                      className="w-full px-5 py-4 rounded-2xl border-2 border-gray-200 bg-gray-100 focus:bg-white focus:border-blue-500 outline-none font-black text-gray-900 transition-all shadow-inner"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2 ml-1">Ruas Jalan</label>
                    <input 
                      type="text" 
                      required
                      placeholder="CONTOH: JL. PAHLAWAN"
                      value={formData.street_name}
                      onChange={e => setFormData({...formData, street_name: e.target.value.toUpperCase()})}
                      className="w-full px-5 py-4 rounded-2xl border-2 border-gray-200 bg-gray-100 focus:bg-white focus:border-blue-500 outline-none font-black text-gray-900 transition-all shadow-inner"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2 ml-1">Shift Kerja</label>
                    <select
                      value={formData.shift}
                      onChange={e => setFormData({...formData, shift: e.target.value as 'Pagi'|'Malam'})}
                      className="w-full h-16 px-5 rounded-2xl border-2 border-gray-200 bg-gray-100 font-black text-gray-900 appearance-none focus:border-blue-500 outline-none shadow-inner"
                    >
                      <option value="Pagi">PAGI (07:00 - 18:00)</option>
                      <option value="Malam">MALAM (18:00 - 24:00)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2 ml-1">Target Setoran</label>
                    <div className="relative">
                      <span className="absolute left-4 top-4.5 font-black text-gray-400">Rp</span>
                      <input 
                        type="text" 
                        inputMode="numeric"
                        placeholder="0"
                        value={formData.target_amount ? new Intl.NumberFormat('id-ID').format(Number(formData.target_amount.toString().replace(/\D/g, ''))) : ''}
                        onChange={e => setFormData({...formData, target_amount: e.target.value.replace(/\D/g, '')})}
                        className="w-full pl-12 pr-4 py-4 rounded-2xl border-2 border-gray-200 bg-gray-100 font-black text-gray-900 focus:bg-white focus:border-blue-500 outline-none transition-all shadow-inner"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex gap-4 pt-4">
                <button
                  type="submit"
                  disabled={saveMutation.isPending}
                  className="flex-1 h-18 bg-blue-600 hover:bg-blue-700 text-white font-black text-lg rounded-2xl shadow-xl shadow-blue-600/20 flex items-center justify-center gap-3 active:scale-95 transition-all border-b-6 border-blue-800 disabled:bg-gray-400 disabled:border-b-4 disabled:border-gray-500"
                >
                  {saveMutation.isPending ? <Loader2 className="animate-spin" size={28} strokeWidth={3} /> : <><Save size={24} strokeWidth={3} /> SIMPAN MASTER</>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
