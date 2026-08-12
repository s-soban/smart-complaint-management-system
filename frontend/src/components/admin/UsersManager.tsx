import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { User, Role } from '../../types';
import { Users, ShieldCheck, Wrench, GraduationCap, UserCheck } from 'lucide-react';

export const UsersManager: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [filterRole, setFilterRole] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchUsers();
  }, [filterRole]);

  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      const res = await api.getUsers(filterRole);
      if (res.success) setUsers(res.users || []);
    } catch (err) {
      console.error('Error fetching users:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRoleChange = async (userId: number, newRole: Role) => {
    try {
      const res = await api.updateUserRole(userId, newRole);
      if (res.success) fetchUsers();
    } catch (err) {
      alert('Failed to update role');
    }
  };

  return (
    <div className="space-y-6">
      <div className="p-6 rounded-3xl bg-slate-900 text-white shadow-xl flex items-center justify-between">
        <div>
          <span className="px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 text-[11px] font-extrabold uppercase tracking-wider">
            User Role Management
          </span>
          <h2 className="text-xl font-black mt-2 tracking-tight flex items-center gap-2">
            <Users className="w-5 h-5 text-indigo-400" /> System Accounts & Role Access
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Manage student registrations, administrator privileges, and maintenance staff assignments.
          </p>
        </div>

        <select
          value={filterRole}
          onChange={e => setFilterRole(e.target.value)}
          className="px-4 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs font-bold text-slate-200"
        >
          <option value="">All User Roles</option>
          <option value="student">Students</option>
          <option value="maintenance">Maintenance Staff</option>
          <option value="admin">Administrators</option>
        </select>
      </div>

      <div className="p-6 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
        {isLoading ? (
          <div className="py-12 text-center text-slate-400 font-bold text-xs">
            Loading user accounts...
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400 font-extrabold uppercase text-[10px]">
                  <th className="py-3 px-4">Full Name</th>
                  <th className="py-3 px-4">ID Code</th>
                  <th className="py-3 px-4">Email</th>
                  <th className="py-3 px-4">Department / Year</th>
                  <th className="py-3 px-4">Current Role</th>
                  <th className="py-3 px-4 text-right">Role Promotion</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium text-slate-700 dark:text-slate-300">
                {users.map(u => (
                  <tr key={u.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                    <td className="py-3 px-4 font-bold text-slate-900 dark:text-white">{u.full_name}</td>
                    <td className="py-3 px-4 font-mono">{u.user_id_code}</td>
                    <td className="py-3 px-4">{u.email}</td>
                    <td className="py-3 px-4">{u.department || 'N/A'} {u.year_class ? `(${u.year_class})` : ''}</td>
                    <td className="py-3 px-4 font-bold uppercase">{u.role}</td>
                    <td className="py-3 px-4 text-right">
                      <select
                        value={u.role}
                        onChange={e => handleRoleChange(u.id, e.target.value as Role)}
                        className="px-2.5 py-1 text-xs font-bold rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                      >
                        <option value="student">Student</option>
                        <option value="maintenance">Maintenance Staff</option>
                        <option value="admin">Administrator</option>
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
