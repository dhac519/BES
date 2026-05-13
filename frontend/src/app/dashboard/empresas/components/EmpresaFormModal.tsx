import React, { useState, useEffect } from 'react';

interface EmpresaFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (id: string | null, data: any) => Promise<void>;
  initialData?: any;
}

export const EmpresaFormModal: React.FC<EmpresaFormModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  initialData
}) => {
  const [ruc, setRuc] = useState('');
  const [razonSocial, setRazonSocial] = useState('');
  const [usuarioSol, setUsuarioSol] = useState('');
  const [claveSol, setClaveSol] = useState('');

  useEffect(() => {
    if (initialData) {
      setRuc(initialData.ruc || '');
      setRazonSocial(initialData.razonSocial || '');
      setUsuarioSol(initialData.usuarioSol || '');
      setClaveSol('');
    } else {
      setRuc('');
      setRazonSocial('');
      setUsuarioSol('');
      setClaveSol('');
    }
  }, [initialData]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await onSubmit(initialData?.id || null, {
        ruc,
        razonSocial,
        usuarioSol,
        ...(claveSol ? { claveSol } : {})
      });
      onClose();
    } catch (error) {
      alert("Error al guardar la empresa");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-[#111827] border border-white/10 rounded-3xl w-full max-w-md overflow-hidden shadow-2xl">
        <div className="p-6 border-b border-white/5 bg-white/[0.02]">
          <h3 className="text-xl font-bold text-white">{initialData ? 'Editar Empresa' : 'Vincular Nueva Empresa'}</h3>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-400 mb-1.5">RUC</label>
            <input 
              type="text" required maxLength={11} value={ruc} onChange={(e) => setRuc(e.target.value)}
              className="w-full bg-[#1f2937]/50 border border-white/5 rounded-xl px-4 py-3 text-white outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
              placeholder="206..."
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-400 mb-1.5">Razón Social</label>
            <input 
              type="text" required value={razonSocial} onChange={(e) => setRazonSocial(e.target.value)}
              className="w-full bg-[#1f2937]/50 border border-white/5 rounded-xl px-4 py-3 text-white outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-400 mb-1.5">Usuario SOL</label>
              <input 
                type="text" required value={usuarioSol} onChange={(e) => setUsuarioSol(e.target.value)}
                className="w-full bg-[#1f2937]/50 border border-white/5 rounded-xl px-4 py-3 text-white outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-400 mb-1.5">Clave SOL</label>
              <input 
                type="password" required={!initialData} value={claveSol} onChange={(e) => setClaveSol(e.target.value)}
                className="w-full bg-[#1f2937]/50 border border-white/5 rounded-xl px-4 py-3 text-white outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
                placeholder={initialData ? "••••••••" : ""}
              />
            </div>
          </div>
          <div className="flex items-center gap-3 mt-8 pt-4">
            <button type="button" onClick={onClose} className="flex-1 py-3 text-gray-400 hover:text-white transition-colors">Cancelar</button>
            <button type="submit" className="flex-1 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold shadow-lg shadow-blue-500/20 transition-all">
              {initialData ? 'Actualizar' : 'Vincular'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
