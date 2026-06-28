import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import api from '../../utils/api';
import toast from 'react-hot-toast';

export default function AdminUsers() {
  const navigate = useNavigate();
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['admin-users'],
    queryFn: () => api.get('/auth/users').then(r => r.data.data),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, updates }) => api.put(`/auth/users/${id}`, updates),
    onSuccess: () => { qc.invalidateQueries(['admin-users']); toast.success('Updated!'); },
    onError: e => toast.error(e.response?.data?.message || 'Failed.'),
  });

  const users = data || [];
  const ROLE_COLOR = { admin:'bg-primary/15 text-primary', manager:'bg-blue-500/15 text-blue-400', staff:'bg-surface-highest text-on-surface-var' };

  return (
    <div className="space-y-5 max-w-3xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-headline-md font-black text-on-surface">Admin Users</h1>
          <p className="text-body-md text-on-surface-var mt-0.5">Manage admin, manager and staff accounts.</p>
        </div>
        <button onClick={() => navigate('/admin/register')}
          className="flex items-center gap-2 bg-primary text-white font-bold rounded-xl px-4 py-2.5 shadow-primary-glow hover:brightness-110 transition-all">
          <span className="material-symbols-outlined !text-[18px]">person_add</span>
          New User
        </button>
      </div>

      <div className="bg-surface border border-outline-var rounded-2xl overflow-hidden">
        <div className="px-5 py-3 border-b border-outline-var bg-surface-low">
          <p className="text-label-sm text-on-surface-var font-semibold uppercase tracking-wide">
            {users.length} User{users.length !== 1 ? 's' : ''}
          </p>
        </div>

        {isLoading ? (
          <div className="p-8 text-center text-on-surface-var">Loading…</div>
        ) : (
          users.map((u, i) => (
            <motion.div key={u._id}
              initial={{ opacity:0 }} animate={{ opacity:1 }} transition={{ delay:i*.05 }}
              className={`flex items-center gap-4 px-5 py-4 ${i < users.length-1 ? 'border-b border-outline-var' : ''}`}>
              {/* Avatar */}
              <div className="w-10 h-10 rounded-full bg-primary/15 border border-primary/20 flex items-center justify-center flex-shrink-0">
                <span className="text-primary font-black">{u.name?.[0]?.toUpperCase()}</span>
              </div>
              {/* Info */}
              <div className="flex-1 min-w-0">
                <p className="text-body-md font-bold text-on-surface">{u.name}</p>
                <p className="text-label-sm text-on-surface-var">{u.email}</p>
                {u.lastLogin && (
                  <p className="text-label-sm text-on-surface-var/60 mt-0.5">
                    Last login: {format(new Date(u.lastLogin), 'dd MMM yyyy HH:mm')}
                  </p>
                )}
              </div>
              {/* Role badge */}
              <span className={`text-label-sm font-bold px-3 py-1 rounded-full capitalize ${ROLE_COLOR[u.role] || ROLE_COLOR.staff}`}>
                {u.role}
              </span>
              {/* Active toggle */}
              <button
                onClick={() => updateMutation.mutate({ id: u._id, updates: { isActive: !u.isActive } })}
                className={`w-10 h-5 rounded-full transition-all duration-300 flex-shrink-0 ${u.isActive ? 'bg-success' : 'bg-surface-highest border border-outline-var'}`}
                title={u.isActive ? 'Active — click to deactivate' : 'Inactive — click to activate'}>
                <div className={`w-4 h-4 bg-white rounded-full shadow mx-0.5 transition-transform duration-300 ${u.isActive ? 'translate-x-5' : 'translate-x-0'}`} />
              </button>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
}
