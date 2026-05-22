import React, { useState, useEffect } from 'react';
import AdminTutorManagement from '../components/AdminTutorManagement';
import { Users, UserCheck, UserX, BarChart3 } from 'lucide-react';

export default function AdminPage({ user }: any) {
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const res = await fetch('/api/admin/statistics', {
        headers: { 'Authorization': `Bearer ${user.session_token}` }
      });
      const data = await res.json();
      if (data.success) {
        setStats(data.data);
      }
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-10">
      <div className="border-b-2 border-slate-900 pb-4">
        <h1 className="text-3xl md:text-5xl font-bold uppercase tracking-wide text-slate-900">Admin Dashboard</h1>
        <p className="text-slate-600 font-medium mt-2">Manage platform and user activity</p>
      </div>

      {stats && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white p-6 border-2 border-slate-900 shadow-[4px_4px_0_0_#0f172a] flex items-center justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">Total Tutors</p>
              <h3 className="text-3xl font-bold text-slate-900">{stats.total_tutors}</h3>
            </div>
            <div className="w-12 h-12 bg-indigo-50 border-2 border-slate-900 flex items-center justify-center text-slate-900 shadow-[2px_2px_0_0_#0f172a]">
              <Users size={24} />
            </div>
          </div>
          <div className="bg-white p-6 border-2 border-slate-900 shadow-[4px_4px_0_0_#0f172a] flex items-center justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">Active Tutors</p>
              <h3 className="text-3xl font-bold text-slate-900">{stats.active_tutors}</h3>
            </div>
            <div className="w-12 h-12 bg-green-50 border-2 border-slate-900 flex items-center justify-center text-green-700 shadow-[2px_2px_0_0_#0f172a]">
              <UserCheck size={24} />
            </div>
          </div>
          <div className="bg-white p-6 border-2 border-slate-900 shadow-[4px_4px_0_0_#0f172a] flex items-center justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">Inactive Tutors</p>
              <h3 className="text-3xl font-bold text-slate-900">{stats.inactive_tutors}</h3>
            </div>
            <div className="w-12 h-12 bg-slate-100 border-2 border-slate-900 flex items-center justify-center text-slate-600 shadow-[2px_2px_0_0_#0f172a]">
              <UserX size={24} />
            </div>
          </div>
          <div className="bg-white p-6 border-2 border-slate-900 shadow-[4px_4px_0_0_#0f172a] flex items-center justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">New Today</p>
              <h3 className="text-3xl font-bold text-slate-900">{stats.total_registrations_today}</h3>
            </div>
            <div className="w-12 h-12 bg-purple-50 border-2 border-slate-900 flex items-center justify-center text-purple-700 shadow-[2px_2px_0_0_#0f172a]">
              <BarChart3 size={24} />
            </div>
          </div>
        </div>
      )}

      <AdminTutorManagement user={user} />
    </div>
  );
}
