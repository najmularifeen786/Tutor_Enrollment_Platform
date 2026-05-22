import React, { useState } from 'react';
import TutorRegistrationForm from '../components/TutorRegistrationForm';
import { Sparkles, CheckCircle } from 'lucide-react';

interface RegistrationPageProps {
  onNavigate: (page: string) => void;
}

export default function RegistrationPage({ onNavigate }: RegistrationPageProps) {
  const [isSuccess, setIsSuccess] = useState(false);

  if (isSuccess) {
    return (
      <div className="max-w-2xl mx-auto text-center py-20 bg-white border-2 border-slate-900 shadow-[8px_8px_0_0_#0f172a]">
        <div className="w-20 h-20 bg-indigo-50 border-2 border-slate-900 shadow-[4px_4px_0_0_#0f172a] rounded-none flex items-center justify-center mx-auto mb-6 text-indigo-600">
          <CheckCircle size={40} />
        </div>
        <h2 className="text-3xl font-bold uppercase tracking-wider text-slate-900 mb-4">Registration Successful!</h2>
        <p className="text-slate-600 font-medium mb-8 max-w-md mx-auto">
          Welcome to TutorPlatform! Your account has been created. You can now login to manage your profile and start connecting with students.
        </p>
        <button 
          onClick={() => onNavigate('home')}
          className="px-8 py-3 bg-indigo-500 hover:bg-slate-900 text-white font-bold uppercase tracking-wider border-2 border-slate-900 shadow-[4px_4px_0_0_#0f172a] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
        >
          Return to Home
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto">
       <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-white border-2 border-slate-900 shadow-[2px_2px_0_0_#0f172a] text-slate-900 text-xs font-bold uppercase tracking-wider mb-4">
            <Sparkles size={16} />
            <span>Join Our Educator Network</span>
          </div>
          <h1 className="text-3xl md:text-5xl font-bold uppercase tracking-wide text-slate-900 mb-4">Become a Tutor</h1>
          <p className="text-slate-600 font-medium max-w-xl mx-auto">
            Share your knowledge, set your own schedule, and earn money teaching what you love. Fill out the application below to get started.
          </p>
       </div>

       <div className="bg-white p-6 md:p-10 border-2 border-slate-900 shadow-[8px_8px_0_0_#0f172a]">
          <TutorRegistrationForm onSuccess={() => setIsSuccess(true)} />
       </div>
    </div>
  );
}
