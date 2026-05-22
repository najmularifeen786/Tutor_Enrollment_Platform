import React, { useState, useEffect } from 'react';
import { User, FileText, Settings, CreditCard, LayoutDashboard, AlertCircle } from 'lucide-react';
import TutorEditProfile from '../components/TutorEditProfile';

export default function TutorDashboard({ user, onNavigate }: any) {
  const [activeTab, setActiveTab] = useState('overview');
  const [profile, setProfile] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    setIsLoading(true);
    setError('');
    try {
      const res = await fetch('/api/tutors/profile', {
        headers: { 'Authorization': `Bearer ${user.session_token}` }
      });
      const data = await res.json();
      if (data.success) {
        setProfile(data.data);
      } else {
        setError(data.message || 'Failed to load profile.');
      }
    } catch (e) {
      console.error(e);
      setError('Unable to connect to the server. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) return <div className="p-8 text-center text-gray-500">Loading profile...</div>;
  if (error) return <div className="p-8 text-center text-red-700 font-bold">{error}</div>;

  const displayName = profile?.name || [profile?.first_name, profile?.last_name].filter(Boolean).join(' ').trim() || profile?.username || 'Tutor';

  return (
    <div className="max-w-6xl mx-auto flex flex-col md:flex-row gap-8">
      {/* Sidebar Navigation */}
      <div className="w-full md:w-64 flex-shrink-0">
        <div className="bg-white border-2 border-slate-900 p-4 shadow-[8px_8px_0_0_#0f172a] sticky top-24">
          <div className="p-4 flex items-center gap-3 mb-4 border-b-2 border-slate-900 pb-4">
             <div className="w-12 h-12 bg-indigo-50 border-2 border-slate-900 flex items-center justify-center text-slate-900 font-bold text-lg shadow-[2px_2px_0_0_#0f172a]">
                {displayName.charAt(0)}
             </div>
             <div>
               <h3 className="font-bold uppercase tracking-wider text-slate-900 leading-tight">{displayName}</h3>
               <span className="text-xs font-bold uppercase tracking-wider text-slate-600">Tutor Portal</span>
             </div>
          </div>
          
          <nav className="space-y-2">
            <button 
              onClick={() => setActiveTab('overview')}
              className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-bold uppercase tracking-wider border-2 transition-all ${activeTab === 'overview' ? 'bg-indigo-50 border-slate-900 text-indigo-700 shadow-[2px_2px_0_0_#0f172a]' : 'border-transparent text-slate-600 hover:border-slate-900 hover:bg-slate-50'}`}
            >
              <LayoutDashboard size={18} /> Overview
            </button>
            <button 
              onClick={() => setActiveTab('edit-profile')}
              className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-bold uppercase tracking-wider border-2 transition-all ${activeTab === 'edit-profile' ? 'bg-indigo-50 border-slate-900 text-indigo-700 shadow-[2px_2px_0_0_#0f172a]' : 'border-transparent text-slate-600 hover:border-slate-900 hover:bg-slate-50'}`}
            >
              <User size={18} /> Edit Profile
            </button>
            <button 
              onClick={() => onNavigate('tutorProfile', { id: profile.tutor_id })}
              className="w-full flex items-center gap-3 px-4 py-3 text-sm font-bold uppercase tracking-wider border-2 border-transparent text-slate-600 hover:border-slate-900 hover:bg-slate-50 transition-all"
            >
              <FileText size={18} /> View Public Profile
            </button>
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1">
        {profile.is_active === 0 && (
          <div className="mb-6 p-4 bg-yellow-50 border-2 border-yellow-900 flex items-start gap-3 text-yellow-900 shadow-[4px_4px_0_0_#713f12]">
            <AlertCircle className="shrink-0 mt-0.5" />
            <div>
              <h4 className="font-bold uppercase tracking-wider">Your profile is currently inactive.</h4>
              <p className="text-sm mt-1 font-medium">Your profile is not visible to students. Contact an administrator to reactivate your account.</p>
            </div>
          </div>
        )}

        {activeTab === 'overview' && (
          <div className="space-y-6">
            <div className="bg-white p-8 border-2 border-slate-900 shadow-[8px_8px_0_0_#0f172a]">
              <h2 className="text-3xl font-bold uppercase tracking-wider text-slate-900 mb-6">Welcome back, {displayName.split(' ')[0]}!</h2>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                 <div className="p-6 bg-white border-2 border-slate-900 shadow-[4px_4px_0_0_#0f172a]">
                    <div className="text-slate-600 text-xs font-bold uppercase tracking-wider mb-2">Hourly Rate</div>
                    <div className="text-3xl font-bold text-slate-900">PKR {profile.hourly_rate}</div>
                 </div>
                 <div className="p-6 bg-white border-2 border-slate-900 shadow-[4px_4px_0_0_#0f172a]">
                    <div className="text-slate-600 text-xs font-bold uppercase tracking-wider mb-2">Teaching Mode</div>
                    <div className="text-3xl font-bold text-slate-900 capitalize">{profile.teaching_mode}</div>
                 </div>
                 <div className="p-6 bg-white border-2 border-slate-900 shadow-[4px_4px_0_0_#0f172a]">
                    <div className="text-slate-600 text-xs font-bold uppercase tracking-wider mb-2">Status</div>
                    <div className="text-3xl font-bold text-slate-900">
                      {profile.is_active ? <span className="text-green-600">Active</span> : <span className="text-yellow-600">Inactive</span>}
                    </div>
                 </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'edit-profile' && (
          <div className="bg-white p-8 border-2 border-slate-900 shadow-[8px_8px_0_0_#0f172a]">
            <h2 className="text-3xl font-bold uppercase tracking-wider text-slate-900 border-b-2 border-slate-900 pb-4 mb-6">Edit Profile</h2>
            <TutorEditProfile profile={profile} user={user} onUpdateSuccess={fetchProfile} />
          </div>
        )}
      </div>
    </div>
  );
}
