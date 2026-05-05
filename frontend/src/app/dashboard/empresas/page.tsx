"use client";

import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuthStore } from '@/store/useAuthStore';
import { Building2, Plus, MoreVertical, Search, Lock, RefreshCw, Trash2, Edit2 } from 'lucide-react';
import { io, Socket } from 'socket.io-client';

export default function EmpresasPage() {
  const [empresas, setEmpresas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [syncingEmpresas, setSyncingEmpresas] = useState<Record<string, boolean>>({});
  const token = useAuthStore((state) => state.token);
  const user = useAuthStore((state) => state.user);

  // Form State
  const [ruc, setRuc] = useState('');
  const [razonSocial, setRazonSocial] = useState('');
  const [usuarioSol, setUsuarioSol] = useState('');
  const [claveSol, setClaveSol] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);

  const fetchEmpresas = async () => {
    try {
      const res = await axios.get('http://localhost:3000/empresas', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setEmpresas(res.data);
    } catch (error) {
      console.error("Error cargando empresas", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) fetchEmpresas();

    // Inicializar WebSockets
    if (user?.id) {
      const socket: Socket = io('http://localhost:3000');
      
      socket.on(`sync-finished-${user.id}`, (data) => {
        setSyncingEmpresas(prev => ({ ...prev, [data.empresaId]: false }));
        // Idealmente aquí recargamos empresas o notificaciones
        fetchEmpresas();
      });

      socket.on(`sync-error-${user.id}`, (data) => {
        setSyncingEmpresas(prev => ({ ...prev, [data.empresaId]: false }));
        alert(`Error sincronizando la empresa: ${data.message}`);
        fetchEmpresas();
      });

      return () => {
        socket.disconnect();
      };
    }
  }, [token, user?.id]);

  const handleSync = async (empresaId: string) => {
    try {
      setSyncingEmpresas(prev => ({ ...prev, [empresaId]: true }));
      await axios.post(`http://localhost:3000/scraper/sync/${empresaId}`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
    } catch (error) {
      setSyncingEmpresas(prev => ({ ...prev, [empresaId]: false }));
      alert("No se pudo iniciar la sincronización");
    }
  };

  const handleAddEmpresa = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingId) {
        await axios.patch(`http://localhost:3000/empresas/${editingId}`, {
          ruc, razonSocial, usuarioSol, ...(claveSol ? { claveSol } : {})
        }, { headers: { Authorization: `Bearer ${token}` } });
      } else {
        await axios.post('http://localhost:3000/empresas', {
          ruc, razonSocial, usuarioSol, claveSol
        }, { headers: { Authorization: `Bearer ${token}` } });
      }
      setIsModalOpen(false);
      setEditingId(null);
      setRuc(''); setRazonSocial(''); setUsuarioSol(''); setClaveSol('');
      fetchEmpresas();
    } catch (error) {
      console.error("Error al guardar empresa", error);
      alert("Hubo un error al guardar la empresa");
    }
  };

  const handleEdit = (empresa: any) => {
    setEditingId(empresa.id);
    setRuc(empresa.ruc);
    setRazonSocial(empresa.razonSocial);
    setUsuarioSol(empresa.usuarioSol);
    setClaveSol(''); // Dejar en blanco a menos que quiera cambiarla
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm("¿Estás seguro de eliminar esta empresa? Esto detendrá la sincronización de su buzón.")) {
      try {
        await axios.delete(`http://localhost:3000/empresas/${id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        fetchEmpresas();
      } catch (error) {
        alert("Error al eliminar la empresa");
      }
    }
  };

  const openNewModal = () => {
    setEditingId(null);
    setRuc(''); setRazonSocial(''); setUsuarioSol(''); setClaveSol('');
    setIsModalOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-white">Mis Empresas</h2>
        <button 
          onClick={openNewModal}
          className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white px-5 py-2.5 rounded-xl font-bold transition-all shadow-lg shadow-blue-500/20 hover:-translate-y-0.5"
        >
          <Plus className="w-5 h-5" />
          Agregar Empresa
        </button>
      </div>

      {/* Grid de Empresas */}
      {loading ? (
        <div className="text-gray-400 text-center py-10">Cargando empresas...</div>
      ) : empresas.length === 0 ? (
        <div className="bg-[#111827] border border-white/5 rounded-3xl p-16 text-center">
          <div className="w-20 h-20 bg-blue-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <Building2 className="w-10 h-10 text-blue-400" />
          </div>
          <h3 className="text-xl font-bold text-white mb-2">No tienes empresas registradas</h3>
          <p className="text-gray-400 mb-8 max-w-md mx-auto">
            Agrega tu primera empresa con sus credenciales SOL para que nuestro robot empiece a descargar sus notificaciones automáticamente.
          </p>
          <button 
            onClick={openNewModal}
            className="inline-flex items-center gap-2 bg-white/5 hover:bg-white/10 border border-white/10 text-white px-6 py-3 rounded-xl font-bold transition-colors"
          >
            <Plus className="w-5 h-5" />
            Vincular Primera Empresa
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {empresas.map((emp) => (
            <div key={emp.id} className="bg-[#111827] border border-white/5 hover:border-blue-500/30 rounded-2xl p-6 transition-colors group relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 flex gap-2">
                <button 
                  onClick={() => handleSync(emp.id)}
                  disabled={syncingEmpresas[emp.id]}
                  className="text-gray-500 hover:text-blue-400 transition-colors disabled:opacity-50"
                  title="Sincronizar Buzón"
                >
                  <RefreshCw className={`w-5 h-5 ${syncingEmpresas[emp.id] ? 'animate-spin text-blue-400' : ''}`} />
                </button>
                <button 
                  onClick={() => handleEdit(emp)}
                  className="text-gray-500 hover:text-white transition-colors"
                  title="Editar Empresa"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                <button 
                  onClick={() => handleDelete(emp.id)}
                  className="text-gray-500 hover:text-red-400 transition-colors"
                  title="Eliminar Empresa"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
              <div className="w-12 h-12 bg-gradient-to-br from-gray-800 to-gray-700 border border-white/10 rounded-xl flex items-center justify-center mb-4 group-hover:from-blue-600 group-hover:to-indigo-600 transition-colors">
                <Building2 className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-lg font-bold text-white truncate mb-1" title={emp.razonSocial}>{emp.razonSocial}</h3>
              <div className="flex items-center gap-2 text-sm text-gray-400 mb-4">
                <span className="bg-white/5 px-2 py-0.5 rounded border border-white/5">RUC: {emp.ruc}</span>
              </div>
              
              {emp.estadoConexion === 'CONECTADO' && (
                <div className="flex items-center gap-2 text-xs font-medium text-emerald-400 bg-emerald-400/10 w-fit px-3 py-1.5 rounded-full border border-emerald-400/20 mt-4">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                  Sincronización Activa
                </div>
              )}
              {emp.estadoConexion === 'REQUIERE_ACTUALIZACION' && (
                <div className="flex items-center gap-2 text-xs font-medium text-red-400 bg-red-400/10 w-fit px-3 py-1.5 rounded-full border border-red-400/20 mt-4">
                  <span className="w-2 h-2 rounded-full bg-red-400"></span>
                  Credenciales Inválidas
                </div>
              )}
              {emp.estadoConexion === 'ERROR_SISTEMA' && (
                <div className="flex items-center gap-2 text-xs font-medium text-amber-400 bg-amber-400/10 w-fit px-3 py-1.5 rounded-full border border-amber-400/20 mt-4">
                  <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse"></span>
                  Fallo en SUNAT
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Modal Agregar Empresa */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-[#111827] border border-white/10 rounded-3xl w-full max-w-md overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-white/5">
              <h3 className="text-xl font-bold text-white">{editingId ? 'Editar Empresa' : 'Agregar Empresa a BES'}</h3>
              <p className="text-sm text-gray-400 mt-1">Ingresa las credenciales SOL para la sincronización.</p>
            </div>
            
            <form onSubmit={handleAddEmpresa} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-300 mb-1.5">RUC</label>
                <input 
                  type="text" required maxLength={11}
                  value={ruc} onChange={(e) => setRuc(e.target.value)}
                  className="w-full bg-[#1f2937]/50 border border-white/5 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:ring-2 focus:ring-blue-500/50 outline-none"
                  placeholder="20123456789"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-300 mb-1.5">Razón Social</label>
                <input 
                  type="text" required
                  value={razonSocial} onChange={(e) => setRazonSocial(e.target.value)}
                  className="w-full bg-[#1f2937]/50 border border-white/5 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:ring-2 focus:ring-blue-500/50 outline-none"
                  placeholder="Mi Empresa SAC"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-300 mb-1.5">Usuario SOL</label>
                  <input 
                    type="text" required
                    value={usuarioSol} onChange={(e) => setUsuarioSol(e.target.value)}
                    className="w-full bg-[#1f2937]/50 border border-white/5 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:ring-2 focus:ring-blue-500/50 outline-none"
                    placeholder="ADMIN123"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-300 mb-1.5 flex items-center gap-1">
                    Clave SOL <Lock className="w-3.5 h-3.5 text-blue-400" />
                  </label>
                  <input 
                    type="password" required={!editingId}
                    value={claveSol} onChange={(e) => setClaveSol(e.target.value)}
                    className="w-full bg-[#1f2937]/50 border border-white/5 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:ring-2 focus:ring-blue-500/50 outline-none"
                    placeholder={editingId ? "Dejar en blanco para no cambiar" : "••••••••"}
                  />
                </div>
              </div>
              <div className="text-xs text-blue-400 bg-blue-500/10 p-3 rounded-lg border border-blue-500/20 flex items-start gap-2 mt-4">
                <Lock className="w-4 h-4 shrink-0 mt-0.5" />
                <p>La Clave SOL será encriptada con grado militar (AES-256) antes de guardarse en la base de datos.</p>
              </div>

              <div className="flex items-center gap-3 mt-8 pt-4">
                <button 
                  type="button" onClick={() => setIsModalOpen(false)}
                  className="flex-1 py-3 text-gray-300 hover:text-white hover:bg-white/5 rounded-xl font-semibold transition-colors"
                >
                  Cancelar
                </button>
                <button 
                  type="submit"
                  className="flex-1 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold shadow-lg shadow-blue-500/25 transition-colors"
                >
                  {editingId ? 'Guardar Cambios' : 'Guardar Empresa'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
