"use client";

import { useState } from 'react';
import { Building2, Plus, Search, RefreshCw } from 'lucide-react';
import ConfirmModal from '@/components/ConfirmModal';
import { useEmpresas } from './hooks/useEmpresas';
import { EmpresaTable } from './components/EmpresaTable';
import { EmpresaFormModal } from './components/EmpresaFormModal';

export default function EmpresasPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [empresaToDelete, setEmpresaToDelete] = useState<string | null>(null);
  const [editingEmpresa, setEditingEmpresa] = useState<any | null>(null);

  const {
    empresas,
    loading,
    syncingEmpresas,
    syncingAll,
    handleSync,
    handleSyncAll,
    deleteEmpresa,
    saveEmpresa,
    user
  } = useEmpresas();

  const filteredEmpresas = empresas.filter(emp => 
    emp.razonSocial.toLowerCase().includes(searchTerm.toLowerCase()) || 
    emp.ruc.includes(searchTerm)
  );

  const handleEdit = (empresa: any) => {
    setEditingEmpresa(empresa);
    setIsModalOpen(true);
  };

  const openNewModal = () => {
    setEditingEmpresa(null);
    setIsModalOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Gestión de Empresas</h2>
          <p className="text-gray-400 text-sm">Administra las credenciales y sincronización de tus {empresas.length} empresas.</p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={handleSyncAll}
            disabled={syncingAll || empresas.length === 0}
            className="flex items-center gap-2 bg-white/5 border border-white/10 hover:bg-white/10 text-white px-5 py-2.5 rounded-xl font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <RefreshCw className={`w-5 h-5 ${syncingAll ? 'animate-spin' : ''}`} />
            {syncingAll ? 'Iniciando...' : 'Sincronizar Todas'}
          </button>
          {user?.rol === 'SUPER_ADMIN' && (
            <button 
              onClick={openNewModal}
              className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white px-5 py-2.5 rounded-xl font-bold transition-all shadow-lg shadow-blue-500/20 hover:-translate-y-0.5"
            >
              <Plus className="w-5 h-5" />
              Agregar Empresa
            </button>
          )}
        </div>
      </div>

      <div className="relative group max-w-md">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500 group-focus-within:text-blue-400 transition-colors" />
        <input 
          type="text" 
          placeholder="Buscar por RUC o Razón Social..." 
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full bg-[#111827] border border-white/5 rounded-2xl py-3 pl-12 pr-4 text-white placeholder-gray-500 outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
        />
      </div>

      {loading ? (
        <div className="text-gray-400 text-center py-20 bg-[#111827] rounded-3xl border border-white/5">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-500" />
          Cargando base de datos de empresas...
        </div>
      ) : filteredEmpresas.length === 0 ? (
        <div className="bg-[#111827] border border-white/5 rounded-3xl p-20 text-center">
          <Building2 className="w-12 h-12 text-gray-600 mx-auto mb-4" />
          <p className="text-gray-400">No se encontraron empresas con esos criterios.</p>
        </div>
      ) : (
        <EmpresaTable 
          empresas={filteredEmpresas}
          syncingEmpresas={syncingEmpresas}
          onSync={handleSync}
          onEdit={handleEdit}
          onDelete={(id) => { setEmpresaToDelete(id); setIsDeleteModalOpen(true); }}
          userRol={user?.rol}
        />
      )}

      <EmpresaFormModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={saveEmpresa}
        initialData={editingEmpresa}
      />

      <ConfirmModal 
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={async () => {
          if (empresaToDelete) {
            try {
              await deleteEmpresa(empresaToDelete);
            } catch (error) {
              alert("Error al eliminar");
            }
          }
        }}
        title="¿Eliminar Empresa?"
        message="Esta acción es irreversible y detendrá todas las sincronizaciones automáticas del buzón de esta empresa."
      />
    </div>
  );
}
