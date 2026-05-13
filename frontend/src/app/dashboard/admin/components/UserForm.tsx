import React, { useState } from 'react';

interface UserFormProps {
  onSubmit: (data: any) => Promise<void>;
  onCancel: () => void;
}

export const UserForm: React.FC<UserFormProps> = ({ onSubmit, onCancel }) => {
  const [newUser, setNewUser] = useState({ nombre: '', email: '', password: '', rol: 'USUARIO_LOCAL' });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await onSubmit(newUser);
    } catch (err: any) {
      alert(err.response?.data?.message || 'Error al crear usuario');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="p-6 border-b border-white/5 bg-indigo-500/5 grid grid-cols-2 gap-4">
      <div>
        <label className="block text-xs font-semibold text-gray-400 mb-1.5">Nombre</label>
        <input required value={newUser.nombre} onChange={e => setNewUser({...newUser, nombre: e.target.value})}
          className="w-full bg-[#1f2937] border border-white/10 rounded-xl px-4 py-2.5 text-white outline-none focus:ring-2 focus:ring-indigo-500/50 text-sm" placeholder="Juan Pérez" />
      </div>
      <div>
        <label className="block text-xs font-semibold text-gray-400 mb-1.5">Email</label>
        <input required type="email" value={newUser.email} onChange={e => setNewUser({...newUser, email: e.target.value})}
          className="w-full bg-[#1f2937] border border-white/10 rounded-xl px-4 py-2.5 text-white outline-none focus:ring-2 focus:ring-indigo-500/50 text-sm" placeholder="juan@estudio.com" />
      </div>
      <div>
        <label className="block text-xs font-semibold text-gray-400 mb-1.5">Contraseña</label>
        <input required type="password" value={newUser.password} onChange={e => setNewUser({...newUser, password: e.target.value})}
          className="w-full bg-[#1f2937] border border-white/10 rounded-xl px-4 py-2.5 text-white outline-none focus:ring-2 focus:ring-indigo-500/50 text-sm" placeholder="••••••••" />
      </div>
      <div>
        <label className="block text-xs font-semibold text-gray-400 mb-1.5">Rol</label>
        <select value={newUser.rol} onChange={e => setNewUser({...newUser, rol: e.target.value})}
          className="w-full bg-[#1f2937] border border-white/10 rounded-xl px-4 py-2.5 text-white outline-none focus:ring-2 focus:ring-indigo-500/50 text-sm">
          <option value="USUARIO_LOCAL">Usuario Local</option>
          <option value="ADMIN">Admin</option>
        </select>
      </div>
      <div className="col-span-2 flex gap-3 justify-end">
        <button type="button" onClick={onCancel} className="px-4 py-2 text-gray-400 hover:text-white text-sm transition-colors">Cancelar</button>
        <button type="submit" className="px-6 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold text-sm transition-all">Crear</button>
      </div>
    </form>
  );
};
