
import React, { useState } from 'react';
import { useAdminUsers, useStreetNames, useCollectorAssignments, useAllAssignments, useAssignStreet, useUnassignStreet, useReassignStreet } from '../../hooks/useParkingData';
import { Loader2, MapPin, User, Trash2, Plus, Star, Users, Globe, ArrowRightLeft, X } from 'lucide-react';
import { UserProfile } from '../../types';

// Type definition for a single assignment with profile data
type FullAssignment = {
  id: number;
  ruas_jalan: string;
  profiles: { id: string; full_name: string | null; } | null;
};

// --- MAIN COMPONENT: Manages Tabs ---
export const AreaManagement: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'per_kolektor' | 'global_view'>('per_kolektor');

  const tabButtonBase = "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all";
  const tabButtonActive = "bg-blue-100 text-blue-700";
  const tabButtonInactive = "text-gray-600 hover:bg-gray-100";

  // Pre-fetch data needed by both tabs
  const { data: users, isLoading: loadingUsers } = useAdminUsers();
  const { data: allStreets, isLoading: loadingStreets } = useStreetNames();
  
  if (loadingUsers || loadingStreets) {
    return (
      <div className="flex flex-col items-center justify-center p-20">
        <Loader2 className="animate-spin text-blue-600 mb-4" size={48} strokeWidth={3} />
        <p className="font-black">MEMUAT DATA AREA...</p>
      </div>
    );
  }
  
  const kolektors = users?.filter(u => u.role === 'kolektor' && u.role !== 'nonaktif') || [];

  return (
    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2">
      <div className="bg-white p-2 rounded-xl shadow-sm border border-gray-200 flex items-center gap-2">
        <button
          onClick={() => setActiveTab('per_kolektor')}
          className={`${tabButtonBase} ${activeTab === 'per_kolektor' ? tabButtonActive : tabButtonInactive}`}
        >
          <Users size={16} /> Per Kolektor
        </button>
        <button
          onClick={() => setActiveTab('global_view')}
          className={`${tabButtonBase} ${activeTab === 'global_view' ? tabButtonActive : tabButtonInactive}`}
        >
          <Globe size={16} /> Semua Penugasan
        </button>
      </div>

      {activeTab === 'per_kolektor' ? (
        <PerKolektorView kolektors={kolektors} allStreets={allStreets || []} />
      ) : (
        <GlobalView kolektors={kolektors} />
      )}
    </div>
  );
};

// --- SUB-COMPONENT 1: Original View (Per Kolektor) ---
interface PerKolektorViewProps {
  kolektors: UserProfile[];
  allStreets: { ruas_jalan?: string, street_name?: string, "Ruas Jalan"?: string, name?: string }[];
}

const PerKolektorView: React.FC<PerKolektorViewProps> = ({ kolektors, allStreets }) => {
  const [selectedUser, setSelectedUser] = useState<string | null>(null);
  const [streetToAdd, setStreetToAdd] = useState<string>('');
  
  const { data: assignedStreets, isLoading: loadingAssignments } = useCollectorAssignments(selectedUser || undefined);
  
  const assignMutation = useAssignStreet();
  const unassignMutation = useUnassignStreet();

  const handleAddStreet = () => {
    if (selectedUser && streetToAdd) {
      assignMutation.mutate(
        { userId: selectedUser, streetName: streetToAdd },
        { onSuccess: () => setStreetToAdd('') }
      );
    }
  };

  const handleRemoveAssignment = (streetName: string) => {
    if (!selectedUser) return alert("Error: Silakan pilih kolektor terlebih dahulu.");
    if (!window.confirm(`Hapus penugasan "${streetName}" untuk kolektor ini?`)) return;
    unassignMutation.mutate({ userId: selectedUser, streetName: streetName });
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <div className="md:col-span-1 bg-white dark:bg-gray-900 rounded-2xl shadow-md border-2 border-gray-100 dark:border-gray-800 overflow-hidden flex flex-col h-[600px] transition-colors">
        <div className="p-4 bg-gray-100 dark:bg-gray-800 border-b-2 border-gray-200 dark:border-gray-700">
          <h2 className="font-black text-gray-900 dark:text-white flex items-center gap-2 uppercase tracking-tight">
            <User size={20} strokeWidth={3} /> Daftar Kolektor
          </h2>
        </div>
        <div className="overflow-y-auto flex-1 p-2 space-y-2">
          {kolektors.map(user => (
            <button
              key={user.id}
              onClick={() => setSelectedUser(user.id)}
              className={`w-full text-left px-4 h-16 rounded-xl text-sm transition-all flex items-center justify-between border-2 active:scale-95 ${
                selectedUser === user.id 
                  ? 'bg-blue-600 text-white border-blue-700 font-black shadow-lg' 
                  : 'bg-white dark:bg-gray-800 border-gray-100 dark:border-gray-700 text-gray-900 dark:text-gray-100 font-bold hover:border-blue-300'
              }`}
            >
             <div className="truncate pr-2">
                <p className="leading-tight">{user.full_name?.toUpperCase() || 'TANPA NAMA'}</p>
                <p className={`text-[10px] uppercase font-black tracking-widest mt-0.5 ${selectedUser === user.id ? 'text-blue-200' : 'text-gray-500'}`}>
                  {user.email}
                </p>
              </div>
              {selectedUser === user.id && <Star size={18} className="fill-white flex-shrink-0" />}
            </button>
          ))}
        </div>
      </div>
      <div className="md:col-span-2 bg-white dark:bg-gray-900 rounded-2xl shadow-md border-2 border-gray-100 dark:border-gray-800 flex flex-col min-h-[600px] transition-colors">
         {selectedUser ? (
          <>
            <div className="p-5 bg-blue-600 text-white border-b-2 border-blue-800 flex items-center gap-4">
              <div className="bg-white/20 p-3 rounded-2xl backdrop-blur-sm"><MapPin className="text-white" size={28} strokeWidth={3} /></div>
              <div>
                <h2 className="font-black text-lg leading-tight uppercase tracking-tight">AREA TUGAS</h2>
                <p className="text-xs font-black text-blue-100 opacity-90 uppercase">{kolektors.find(u => u.id === selectedUser)?.full_name}</p>
              </div>
            </div>
            <div className="p-4 border-b-2 border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-black/20">
              <label className="block text-[11px] font-black text-gray-700 dark:text-gray-400 uppercase tracking-[0.2em] mb-3">TAMBAH JALAN TUGAS</label>
              <div className="flex gap-3">
                <select value={streetToAdd} onChange={(e) => setStreetToAdd(e.target.value)} className="w-full h-14 rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white font-black px-4 shadow-sm outline-none focus:border-blue-500 transition-colors">
                  <option value="">-- PILIH JALAN --</option>
                  {allStreets?.map(s => { const label = s.ruas_jalan || s.street_name || s["Ruas Jalan"] || s.name; return <option key={label} value={label}>{label}</option>; })}
                </select>
                <button onClick={handleAddStreet} disabled={!streetToAdd || assignMutation.isPending} className="h-14 bg-blue-600 hover:bg-blue-700 text-white px-6 rounded-xl flex items-center gap-2 font-black shadow-lg disabled:bg-gray-300 transition-all active:scale-95 border-b-4 border-blue-800">
                  {assignMutation.isPending ? <Loader2 className="animate-spin" size={24} /> : <><Plus size={24} strokeWidth={3} /><span className="hidden sm:inline">TAMBAH</span></>}
                </button>
              </div>
            </div>
            <div className="flex-1 p-5 overflow-y-auto bg-gray-50/50 dark:bg-black/10">
              {loadingAssignments ? (<div className="flex justify-center pt-20"><Loader2 className="animate-spin text-blue-500" size={32} /></div>
              ) : assignedStreets && assignedStreets.length > 0 ? (
                <div className="space-y-3">
                  <p className="text-xs text-gray-800 dark:text-gray-400 font-bold uppercase mb-2">TUGAS AKTIF ({assignedStreets.length})</p>
                  {assignedStreets.map(assign => (
                    <div key={assign.id} className="flex items-center justify-between h-20 px-5 bg-white dark:bg-gray-800 border-2 border-gray-100 dark:border-gray-700 rounded-2xl shadow-sm">
                      <span className="font-bold text-gray-900 dark:text-white">{assign.ruas_jalan}</span>
                      <button onClick={() => handleRemoveAssignment(assign.ruas_jalan)} disabled={unassignMutation.isPending} className="h-12 w-12 flex items-center justify-center text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-xl" title="Hapus Tugas">
                        {unassignMutation.isPending ? <Loader2 className="animate-spin"/> : <Trash2 size={20} />}
                      </button>
                    </div>))}
                </div>
              ) : (<div className="text-center text-gray-400 py-10"><p className="font-semibold">Belum Ada Penugasan</p></div>)}
            </div>
          </>
        ) : (<div className="flex flex-col items-center justify-center h-full text-center p-12 bg-gray-50 dark:bg-black/20"><p className="font-bold text-gray-600 dark:text-gray-400">Pilih kolektor untuk melihat atau mengubah area tugasnya.</p></div>)}
      </div>
    </div>
  );
};

// --- SUB-COMPONENT 2: New Global View ---
interface GlobalViewProps {
  kolektors: UserProfile[];
}

const GlobalView: React.FC<GlobalViewProps> = ({ kolektors }) => {
  const { data: allAssignments, isLoading } = useAllAssignments();
  const reassignMutation = useReassignStreet();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedAssignment, setSelectedAssignment] = useState<FullAssignment | null>(null);
  const [newCollectorId, setNewCollectorId] = useState('');

  const handleOpenModal = (assignment: FullAssignment) => {
    setSelectedAssignment(assignment);
    setNewCollectorId(assignment.profiles?.id || '');
    setIsModalOpen(true);
  };

  const handleReassign = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAssignment || !newCollectorId || selectedAssignment.profiles?.id === newCollectorId) {
      setIsModalOpen(false);
      return;
    }
    reassignMutation.mutate(
      { assignmentId: selectedAssignment.id, newUserId: newCollectorId },
      { onSuccess: () => setIsModalOpen(false) }
    );
  };

  if (isLoading) {
    return <div className="flex justify-center p-8 bg-white rounded-xl"><Loader2 className="animate-spin text-blue-600" /></div>;
  }

  return (
    <div className="bg-white rounded-xl shadow border border-gray-200 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="bg-gray-50 text-gray-600 uppercase text-xs font-bold">
            <tr>
              <th className="px-4 py-3">Ruas Jalan</th>
              <th className="px-4 py-3">Kolektor Bertugas</th>
              <th className="px-4 py-3 text-center">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {allAssignments?.map(item => (
              <tr key={item.id}>
                <td className="px-4 py-3 font-medium text-gray-900">{item.ruas_jalan}</td>
                <td className="px-4 py-3">{item.profiles?.full_name || 'Tidak Diketahui'}</td>
                <td className="px-4 py-3 text-center">
                  <button
                    onClick={() => handleOpenModal(item)}
                    className="bg-gray-100 hover:bg-blue-100 hover:text-blue-700 text-gray-600 px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 mx-auto"
                  >
                    <ArrowRightLeft size={14} /> Pindah
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {isModalOpen && selectedAssignment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white w-full max-w-md rounded-xl shadow-lg">
            <div className="p-4 border-b flex justify-between items-center">
              <h3 className="font-bold text-gray-800">Pindah Tugas Kolektor</h3>
              <button onClick={() => setIsModalOpen(false)} className="p-1"><X size={18} /></button>
            </div>
            <form onSubmit={handleReassign} className="p-6 space-y-4">
              <div>
                <label className="text-xs font-bold text-gray-500">RUAS JALAN</label>
                <p className="font-semibold text-gray-900">{selectedAssignment.ruas_jalan}</p>
              </div>
              <div>
                <label htmlFor="kolektor" className="text-xs font-bold text-gray-500 block mb-1">PINDAHKAN KE</label>
                <select
                  id="kolektor"
                  value={newCollectorId}
                  onChange={e => setNewCollectorId(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-md"
                >
                  {kolektors.map(k => (
                    <option key={k.id} value={k.id}>{k.full_name || k.email}</option>
                  ))}
                </select>
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-semibold">Batal</button>
                <button type="submit" disabled={reassignMutation.isPending} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold disabled:bg-gray-300">
                  {reassignMutation.isPending ? <Loader2 className="animate-spin" /> : 'Simpan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
