import React, { useState, useEffect } from 'react';
import { Users, CheckCircle, XCircle } from 'lucide-react';

export default function AdminTutorManagement({ user }: any) {
  const [tutors, setTutors] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchTutors();
  }, [statusFilter]);

  const fetchTutors = async () => {
    setIsLoading(true);
    try {
      const queryParams = new URLSearchParams();
      if (statusFilter !== 'all') {
        queryParams.append('status', statusFilter);
      }
      
      const res = await fetch(`/api/admin/tutors${queryParams.toString() ? `?${queryParams.toString()}` : ''}`, {
        headers: { 'Authorization': `Bearer ${user.token}` }
      });
      const data = await res.json();
      if (data.success) {
        setTutors(data.data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleStatusChange = async (tutorId: number, isCurrentlyActive: boolean) => {
    const endpoint = isCurrentlyActive ? 'deactivate' : 'activate';
    try {
      const res = await fetch(`/api/admin/tutor/${tutorId}/${endpoint}`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${user.token}` }
      });
      const data = await res.json();
      if (data.success) {
        fetchTutors();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const filteredTutors = tutors.filter(t => 
    t.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    t.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="bg-white p-6 border-2 border-slate-900 shadow-[8px_8px_0_0_#0f172a]">
      <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4 border-b-2 border-slate-900 pb-4">
        <h2 className="text-xl font-bold uppercase tracking-wider text-slate-900 flex items-center gap-2">
          <Users className="text-indigo-600" />
          Tutor Management
        </h2>
        
        <div className="flex flex-col md:flex-row gap-3 w-full md:w-auto">
          <input 
            type="text" 
            placeholder="Search by name or email..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="px-4 py-2 bg-white border-2 border-slate-900 text-sm focus:outline-none focus:border-indigo-600 w-full md:w-64 font-medium"
          />
          <select 
            value={statusFilter} 
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 bg-white border-2 border-slate-900 text-sm focus:outline-none focus:border-indigo-600 font-bold uppercase tracking-wider"
          >
            <option value="all">All Status</option>
            <option value="active">Active Only</option>
            <option value="inactive">Inactive Only</option>
          </select>
        </div>
      </div>

      {isLoading ? (
        <div className="text-center py-10 text-slate-600 font-bold uppercase tracking-wider">Loading...</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b-2 border-slate-900 text-slate-900 text-sm">
                <th className="pb-3 font-bold uppercase tracking-wider px-4">Name</th>
                <th className="pb-3 font-bold uppercase tracking-wider px-4">Email</th>
                <th className="pb-3 font-bold uppercase tracking-wider px-4">Subjects</th>
                <th className="pb-3 font-bold uppercase tracking-wider px-4">Status</th>
                <th className="pb-3 font-bold uppercase tracking-wider px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredTutors.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-10 text-slate-600 font-bold uppercase tracking-wider">No tutors found</td>
                </tr>
              ) : (
                filteredTutors.map((tutor) => (
                  <tr key={tutor.tutor_id} className="border-b-2 border-slate-100 hover:bg-slate-50 transition-colors">
                    <td className="py-4 px-4 font-bold text-slate-900">{tutor.name}</td>
                    <td className="py-4 px-4 text-slate-600 font-medium">{tutor.email}</td>
                    <td className="py-4 px-4 text-slate-600 font-medium">
                      <div className="truncate max-w-[150px]" title={tutor.subjects}>{tutor.subjects}</div>
                    </td>
                    <td className="py-4 px-4">
                      {tutor.is_active ? (
                        <span className="inline-flex items-center gap-1 px-3 py-1 text-xs font-bold uppercase tracking-wider border-2 border-green-900 bg-green-50 text-green-800 shadow-[2px_2px_0_0_#14532d]">
                          <CheckCircle size={12} /> Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-3 py-1 text-xs font-bold uppercase tracking-wider border-2 border-red-900 bg-red-50 text-red-800 shadow-[2px_2px_0_0_#7f1d1d]">
                          <XCircle size={12} /> Inactive
                        </span>
                      )}
                    </td>
                    <td className="py-4 px-4 text-right">
                      <button 
                        onClick={() => handleStatusChange(tutor.tutor_id, Boolean(tutor.is_active))}
                        className={`text-xs px-3 py-2 font-bold uppercase tracking-wider border-2 border-slate-900 transition-all shadow-[2px_2px_0_0_#0f172a] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none ${
                          tutor.is_active 
                            ? 'text-red-700 bg-white hover:bg-red-50' 
                            : 'text-green-700 bg-white hover:bg-green-50'
                        }`}
                      >
                        {tutor.is_active ? 'Deactivate' : 'Activate'}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
