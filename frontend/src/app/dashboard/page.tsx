"use client";

import { useState, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import { FileText as FileIcon, Search as SearchIcon, X as XIcon, ExternalLink as ExternalIcon, FilterX as FilterIcon } from 'lucide-react';
import ConfirmModal from '@/components/ConfirmModal';
import { useNotifications } from './hooks/useNotifications';
import { NotificationList } from './components/NotificationList';

function InboxContent() {
  const [selectedPdf, setSelectedPdf] = useState<string | null>(null);
  const [isClearModalOpen, setIsClearModalOpen] = useState(false);
  const router = useRouter();

  const {
    loading,
    clearInbox,
    filteredData,
    searchTerm,
    setSearchTerm,
    empresaFilterId,
    unreadCount
  } = useNotifications();

  return (
    <div className="space-y-6">
      {/* Search and Filter Bar */}
      <div className="flex items-center gap-4 bg-[#111827] p-2 pl-4 rounded-2xl border border-white/5">
        <SearchIcon className="text-gray-500 w-5 h-5" />
        <input 
          type="text" 
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Buscar por RUC, Empresa o Asunto..." 
          className="flex-1 bg-transparent border-none text-white outline-none placeholder-gray-500 py-2"
        />
        {empresaFilterId && (
          <button 
            onClick={() => router.push('/dashboard')}
            className="flex items-center gap-2 px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-xl font-medium transition-colors border border-red-500/20"
          >
            <FilterIcon className="w-4 h-4" />
            Quitar Filtro
          </button>
        )}
      </div>

      {loading ? (
        <div className="p-10 text-center text-gray-400">Cargando bandeja...</div>
      ) : (
        <NotificationList 
          notifications={filteredData}
          unreadCount={unreadCount}
          onClear={() => setIsClearModalOpen(true)}
          onViewPdf={setSelectedPdf}
        />
      )}

      {/* Visor de PDF (Modal) */}
      {selectedPdf && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="bg-[#111827] border border-white/10 rounded-3xl w-full max-w-5xl h-[85vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-4 border-b border-white/5 flex items-center justify-between bg-[#1f2937]/50">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center border border-blue-500/30">
                  <FileIcon className="w-4 h-4 text-blue-400" />
                </div>
                <h3 className="font-bold text-white">Visor de Resolución SUNAT</h3>
              </div>
              <div className="flex items-center gap-2">
                <a href={selectedPdf} target="_blank" rel="noreferrer" className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-xl transition-colors" title="Abrir en nueva pestaña">
                  <ExternalIcon className="w-5 h-5" />
                </a>
                <button onClick={() => setSelectedPdf(null)} className="p-2 text-red-400 hover:text-red-300 hover:bg-red-400/10 rounded-xl transition-colors" title="Cerrar visor">
                  <XIcon className="w-6 h-6" />
                </button>
              </div>
            </div>
            <div className="flex-1 bg-gray-900 p-2">
              <iframe 
                src={selectedPdf} 
                className="w-full h-full rounded-xl border border-white/5"
                title="Visor PDF"
              />
            </div>
          </div>
        </div>
      )}
      
      <ConfirmModal 
        isOpen={isClearModalOpen}
        onClose={() => setIsClearModalOpen(false)}
        onConfirm={async () => {
          await clearInbox();
          setIsClearModalOpen(false);
        }}
        title="¿Limpiar Bandeja?"
        message="¿Estás seguro de eliminar todas las notificaciones? Esta acción borrará los registros de forma irreversible."
      />
    </div>
  );
}

export default function DashboardInbox() {
  return (
    <Suspense fallback={<div className="p-10 text-center text-gray-400">Cargando bandeja...</div>}>
      <InboxContent />
    </Suspense>
  );
}
