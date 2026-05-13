import React from 'react';
import { Building2, ChevronDown, User, X, Check } from 'lucide-react';

interface AssignmentManagerProps {
  usuarios: any[];
  selectedUserId: string;
  onUserSelect: (id: string) => void;
  empresasConFlag: any[];
  loading: boolean;
  onToggle: (empresa: any) => Promise<void>;
  selectedUser?: any;
}

export const AssignmentManager: React.FC<AssignmentManagerProps> = ({
  usuarios,
  selectedUserId,
  onUserSelect,
  empresasConFlag,
  loading,
  onToggle,
  selectedUser
}) => {
  return (
    <div className="bg-[#111827] rounded-3xl border border-white/5 overflow-hidden">
      <div className="p-6 border-b border-white/5">
        <h3 className="text-lg font-bold text-white mb-4">Asignación de Empresas</h3>
        <div className="relative max-w-sm">
          <select
            value={selectedUserId}
            onChange={e => onUserSelect(e.target.value)}
            className="w-full bg-[#1f2937] border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:ring-2 focus:ring-indigo-500/50 appearance-none cursor-pointer"
          >
            <option value="">— Seleccionar usuario —</option>
            {usuarios.map(u => (
              <option key={u.id} value={u.id}>{u.nombre} ({u.email})</option>
            ))}
          </select>
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
        </div>
      </div>

      {!selectedUserId ? (
        <div className="p-10 text-center text-gray-500">
          <User className="w-8 h-8 mx-auto mb-2 opacity-30" />
          <p>Selecciona un usuario para gestionar sus empresas asignadas.</p>
        </div>
      ) : loading ? (
        <div className="p-10 text-center text-gray-500">Cargando empresas...</div>
      ) : (
        <div>
          <div className="px-6 py-3 bg-white/[0.02] border-b border-white/5 flex items-center justify-between">
            <p className="text-xs text-gray-400 font-semibold uppercase tracking-wider">
              {empresasConFlag.filter(e => e.asignada).length} de {empresasConFlag.length} empresas asignadas a <span className="text-indigo-400">{selectedUser?.nombre}</span>
            </p>
          </div>
          <div className="divide-y divide-white/5 max-h-[500px] overflow-y-auto">
            {empresasConFlag.map(emp => (
              <div key={emp.id} className={`flex items-center justify-between px-6 py-3.5 hover:bg-white/[0.02] transition-colors ${emp.asignada ? 'bg-emerald-500/[0.03]' : ''}`}>
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${emp.asignada ? 'bg-emerald-500/20 border border-emerald-500/30' : 'bg-white/5 border border-white/10'}`}>
                    <Building2 className={`w-4 h-4 ${emp.asignada ? 'text-emerald-400' : 'text-gray-500'}`} />
                  </div>
                  <div>
                    <p className="text-white text-sm font-medium">{emp.razonSocial}</p>
                    <p className="text-gray-500 text-xs font-mono">RUC: {emp.ruc}</p>
                  </div>
                </div>
                <button
                  onClick={() => onToggle(emp)}
                  className={`flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-lg border transition-all ${emp.asignada
                    ? 'text-red-400 bg-red-400/10 border-red-400/20 hover:bg-red-400/20'
                    : 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20 hover:bg-emerald-400/20'
                  }`}
                >
                  {emp.asignada ? <><X className="w-3.5 h-3.5" /> Revocar</> : <><Check className="w-3.5 h-3.5" /> Asignar</>}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
