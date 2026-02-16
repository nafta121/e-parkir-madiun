
import React, { useState, useEffect } from 'react';
import { useAdminUsers, useUpdateUserRole } from '../../hooks/useParkingData';
import { supabase } from '../../supabase';
import { useQueryClient, useMutation } from '@tanstack/react-query';
import { Loader2, Plus, X, UserPlus, Shield, ShieldAlert, Mail, User, Lock, AlertCircle, Edit2, Trash2, UserCheck } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { UserProfile } from '../../types';

export const UserManagement: React.FC = () => {
  const { data: users, isLoading } = useAdminUsers();
  const updateRole = useUpdateUserRole();
  const { user: currentUser } = useAuth();
  const queryClient = useQueryClient();

  // --- State Management ---
  // Create User Modal
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [createFormData, setCreateFormData] = useState({ fullName: '', email: '', password: '' });
  const [isSubmittingCreate, setIsSubmittingCreate] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [createSuccess, setCreateSuccess] = useState<string | null>(null);

  // Edit User Modal
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserProfile | null>(null);
  const [editFormData, setEditFormData] = useState({ fullName: '' });
  const [isSubmittingEdit, setIsSubmittingEdit] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);
  const [editSuccess, setEditSuccess] = useState<string | null>(null);

  // --- Mutations ---
  const editUserMutation = useMutation({
    mutationFn: async ({ userId, fullName }: { userId: string, fullName: string }) => {
      const { error } = await supabase.from('profiles').update({ full_name: fullName }).eq('id', userId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      setEditSuccess('Nama user berhasil diperbarui!');
      setTimeout(() => {
        setIsEditModalOpen(false);
        setEditSuccess(null);
      }, 1500);
    },
    onError: (err: any) => {
      setEditError(err.message || 'Gagal memperbarui nama user.');
    },
  });

  // --- Handlers ---
  const handleRoleChange = (userId: string, newRole: 'admin' | 'kolektor') => {
    if (confirm(`Ubah role user ini menjadi ${newRole}?`)) {
      updateRole.mutate({ userId, role: newRole });
    }
  };
  
  const handleDeactivateUser = (userId: string) => {
    if (confirm('PERINGATAN: User ini tidak akan bisa login atau mengakses sistem lagi. Lanjutkan?')) {
      updateRole.mutate({ userId, role: 'nonaktif' });
    }
  };
  
  const handleActivateUser = (userId: string) => {
     if (confirm('Aktifkan kembali user ini? Mereka akan bisa login lagi sebagai Kolektor.')) {
      updateRole.mutate({ userId, role: 'kolektor' });
    }
  };
  
  const handleOpenEditModal = (user: UserProfile) => {
    setEditingUser(user);
    setEditFormData({ fullName: user.full_name || '' });
    setEditError(null);
    setEditSuccess(null);
    setIsEditModalOpen(true);
  };
  
  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    setIsSubmittingEdit(true);
    editUserMutation.mutate(
      { userId: editingUser.id, fullName: editFormData.fullName },
      { onSettled: () => setIsSubmittingEdit(false) }
    );
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmittingCreate(true);
    setCreateError(null);
    setCreateSuccess(null);
    try {
      const { error } = await supabase.rpc('create_kolektor_user', {
        new_email: createFormData.email, new_password: createFormData.password, new_fullname: createFormData.fullName
      });
      if (error) throw error;
      setCreateSuccess('User berhasil dibuat!');
      setCreateFormData({ fullName: '', email: '', password: '' });
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      setTimeout(() => { setIsCreateModalOpen(false); setCreateSuccess(null); }, 1500);
    } catch (err: any) {
      setCreateError(err.message || 'Gagal membuat user.');
    } finally {
      setIsSubmittingCreate(false);
    }
  };

  if (isLoading) return <div className="flex justify-center p-8"><Loader2 className="animate-spin text-blue-600" /></div>;

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center bg-white p-4 rounded-xl shadow-sm border border-gray-200">
        <div>
           <h2 className="text-lg font-bold text-gray-800">Daftar Pengguna</h2>
           <p className="text-xs text-gray-500">Kelola akses kolektor dan admin</p>
        </div>
        <button onClick={() => setIsCreateModalOpen(true)} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-2 shadow-sm active:scale-95 transition-all">
          <Plus size={18} /> Tambah Kolektor
        </button>
      </div>

      <div className="bg-white rounded-xl shadow border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-50 text-gray-600 uppercase text-xs font-bold">
              <tr>
                <th className="px-4 py-3">Nama Lengkap</th>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Role</th>
                <th className="px-4 py-3 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {users?.map((u) => (
                <tr key={u.id} className={`hover:bg-gray-50 transition-opacity ${u.role === 'nonaktif' ? 'opacity-50' : ''}`}>
                   <td className="px-4 py-3 font-medium text-gray-900">{u.full_name || '-'}</td>
                   <td className="px-4 py-3 text-gray-600">
                    {u.email}
                    {u.email === 'naftalyndho@gmail.com' && <span className="ml-2 inline-block px-1.5 py-0.5 bg-purple-100 text-purple-700 text-[10px] rounded border border-purple-200">Super Admin</span>}
                   </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                      u.role === 'admin' ? 'bg-red-100 text-red-700' 
                      : u.role === 'kolektor' ? 'bg-green-100 text-green-700'
                      : 'bg-gray-200 text-gray-600'
                    }`}>
                      {u.role.toUpperCase()}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    {currentUser?.id !== u.id && u.email !== 'naftalyndho@gmail.com' && (
                      <div className="flex justify-center gap-1">
                        {u.role === 'nonaktif' ? (
                          <button onClick={() => handleActivateUser(u.id)} disabled={updateRole.isPending} className="text-xs bg-green-100 border border-green-200 text-green-700 hover:bg-green-200 px-2 py-1 rounded flex items-center gap-1" title="Aktifkan User">
                            <UserCheck size={14} />
                          </button>
                        ) : (
                          <>
                            <button onClick={() => handleOpenEditModal(u)} className="text-xs bg-white border border-gray-300 hover:bg-gray-100 px-2 py-1 rounded" title="Edit Nama"><Edit2 size={14} /></button>
                            {u.role === 'kolektor' ? (
                               <button onClick={() => handleRoleChange(u.id, 'admin')} disabled={updateRole.isPending} className="text-xs bg-white border border-gray-300 hover:bg-gray-100 px-2 py-1 rounded" title="Promote ke Admin"><Shield size={14} /></button>
                            ) : (
                               <button onClick={() => handleRoleChange(u.id, 'kolektor')} disabled={updateRole.isPending} className="text-xs bg-white border border-gray-300 text-red-600 hover:bg-gray-100 px-2 py-1 rounded" title="Demote ke Kolektor"><ShieldAlert size={14} /></button>
                            )}
                            <button onClick={() => handleDeactivateUser(u.id)} disabled={updateRole.isPending} className="text-xs bg-white border border-gray-300 text-red-600 hover:bg-red-100 px-2 py-1 rounded" title="Nonaktifkan User"><Trash2 size={14} /></button>
                          </>
                        )}
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      
      {/* ADD USER MODAL */}
      {isCreateModalOpen && <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in"><div className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95"><div className="bg-blue-600 p-4 flex justify-between items-center text-white"><h3 className="font-bold flex items-center gap-2"><UserPlus size={20} /> Tambah User Baru</h3><button onClick={() => setIsCreateModalOpen(false)} className="hover:bg-blue-700 p-1 rounded transition-colors"><X size={20} /></button></div><form onSubmit={handleCreateUser} className="p-6 space-y-4">{createError && <div className="bg-red-50 text-red-700 p-3 rounded-lg text-sm flex items-start gap-2 border border-red-200"><AlertCircle size={16} className="mt-0.5 flex-shrink-0" />{createError}</div>}{createSuccess && <div className="bg-green-50 text-green-700 p-3 rounded-lg text-sm font-semibold border border-green-200">{createSuccess}</div>}<div><label className="block text-sm font-semibold text-gray-700 mb-1">Nama Lengkap</label><div className="relative"><User className="absolute left-3 top-3 text-gray-400" size={18} /><input type="text" required value={createFormData.fullName} onChange={(e) => setCreateFormData({...createFormData, fullName: e.target.value})} className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg" placeholder="Contoh: Budi Santoso" /></div></div><div><label className="block text-sm font-semibold text-gray-700 mb-1">Email</label><div className="relative"><Mail className="absolute left-3 top-3 text-gray-400" size={18} /><input type="email" required value={createFormData.email} onChange={(e) => setCreateFormData({...createFormData, email: e.target.value})} className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg" placeholder="email@madiun.go.id" /></div></div><div><label className="block text-sm font-semibold text-gray-700 mb-1">Password</label><div className="relative"><Lock className="absolute left-3 top-3 text-gray-400" size={18} /><input type="password" required minLength={6} value={createFormData.password} onChange={(e) => setCreateFormData({...createFormData, password: e.target.value})} className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg" placeholder="Minimal 6 karakter" /></div></div><div className="pt-2"><button type="submit" disabled={isSubmittingCreate} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-lg shadow-lg flex items-center justify-center gap-2 disabled:bg-gray-400">{isSubmittingCreate ? <Loader2 className="animate-spin" size={20} /> : 'Buat Akun'}</button></div></form></div></div>}
      
      {/* EDIT USER MODAL */}
      {isEditModalOpen && <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in"><div className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95"><div className="bg-gray-800 p-4 flex justify-between items-center text-white"><h3 className="font-bold flex items-center gap-2"><Edit2 size={20} /> Edit Nama User</h3><button onClick={() => setIsEditModalOpen(false)} className="hover:bg-gray-700 p-1 rounded transition-colors"><X size={20} /></button></div><form onSubmit={handleEditSubmit} className="p-6 space-y-4">{editError && <div className="bg-red-50 text-red-700 p-3 rounded-lg text-sm flex items-start gap-2 border border-red-200"><AlertCircle size={16} className="mt-0.5 flex-shrink-0" />{editError}</div>}{editSuccess && <div className="bg-green-50 text-green-700 p-3 rounded-lg text-sm font-semibold border border-green-200">{editSuccess}</div>}<div><label className="block text-sm font-semibold text-gray-700 mb-1">Nama Lengkap</label><div className="relative"><User className="absolute left-3 top-3 text-gray-400" size={18} /><input type="text" required value={editFormData.fullName} onChange={(e) => setEditFormData({ fullName: e.target.value })} className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg" placeholder="Nama Lengkap User" /></div></div><p className="text-xs text-gray-500 text-center">Anda hanya bisa mengubah nama. Email dan Role diubah melalui aksi terpisah.</p><div className="pt-2"><button type="submit" disabled={isSubmittingEdit} className="w-full bg-gray-800 hover:bg-gray-900 text-white font-bold py-3 rounded-lg shadow-lg flex items-center justify-center gap-2 disabled:bg-gray-400">{isSubmittingEdit ? <Loader2 className="animate-spin" size={20} /> : 'Simpan Perubahan'}</button></div></form></div></div>}

    </div>
  );
};
