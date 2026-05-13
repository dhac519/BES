import { useState, useEffect, useCallback } from 'react';
import api from '@/lib/api';
import { useAuthStore } from '@/store/useAuthStore';

export function useAdmin() {
  const { user } = useAuthStore();
  const [usuarios, setUsuarios] = useState<any[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string>('');
  const [empresasConFlag, setEmpresasConFlag] = useState<any[]>([]);
  const [loadingAsig, setLoadingAsig] = useState(false);

  const fetchUsuarios = useCallback(async () => {
    try {
      const res = await api.get('/usuarios');
      setUsuarios(res.data.filter((u: any) => u.id !== user?.id));
    } catch (error) {
      console.error("Error fetching users", error);
    }
  }, [user?.id]);

  const fetchAsignaciones = useCallback(async (uid: string) => {
    if (!uid) return;
    setLoadingAsig(true);
    try {
      const res = await api.get(`/asignaciones/${uid}`);
      setEmpresasConFlag(res.data);
    } catch (error) {
      console.error("Error fetching assignments", error);
    } finally {
      setLoadingAsig(false);
    }
  }, []);

  useEffect(() => {
    fetchUsuarios();
  }, [fetchUsuarios]);

  useEffect(() => {
    if (selectedUserId) fetchAsignaciones(selectedUserId);
  }, [selectedUserId, fetchAsignaciones]);

  const createUser = async (userData: any) => {
    await api.post('/usuarios', userData);
    await fetchUsuarios();
  };

  const deleteUser = async (id: string) => {
    if (!confirm('¿Eliminar este usuario?')) return;
    await api.delete(`/usuarios/${id}`);
    await fetchUsuarios();
  };

  const toggleAsignacion = async (empresa: any) => {
    if (!selectedUserId) return;
    if (empresa.asignada) {
      await api.delete(`/asignaciones/${selectedUserId}/${empresa.id}`);
    } else {
      await api.post('/asignaciones', { usuarioId: selectedUserId, empresaId: empresa.id });
    }
    await fetchAsignaciones(selectedUserId);
  };

  return {
    usuarios,
    selectedUserId,
    setSelectedUserId,
    empresasConFlag,
    loadingAsig,
    createUser,
    deleteUser,
    toggleAsignacion,
    selectedUser: usuarios.find(u => u.id === selectedUserId),
  };
}
