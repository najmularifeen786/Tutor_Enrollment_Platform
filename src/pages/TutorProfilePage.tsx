import React, { useState, useEffect } from 'react';
import { ArrowLeft, Mail, Phone, MapPin, GraduationCap, Clock, MonitorPlay, Users } from 'lucide-react';

interface TutorProfilePageProps {
  tutorId: number;
  onNavigate: (page: string) => void;
}

const buildImageSrc = (filePath?: string) => {
  if (!filePath) return undefined;
  if (filePath.startsWith('/uploads/')) return filePath;
  if (filePath.startsWith('uploads/')) return `/${filePath}`;
  return `/uploads/${filePath}`;
};

export default function TutorProfilePage({ tutorId, onNavigate }: TutorProfilePageProps) {
  const [tutor, setTutor] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchTutorProfile();
  }, [tutorId]);

  const fetchTutorProfile = async () => {
    try {
      const res = await fetch(`/api/tutors/${tutorId}`);
      const data = await res.json();
      if (data.success) {
        setTutor(data.data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return <div className="space-y-8 p-4">
      <div className="h-48 bg-slate-200 border-2 border-slate-900 shadow-[8px_8px_0_0_#0f172a] animate-pulse"></div>
      <div className="flex gap-8">
        <div className="w-1/3 h-96 bg-slate-200 border-2 border-slate-900 shadow-[8px_8px_0_0_#0f172a] animate-pulse"></div>
        <div className="w-2/3 h-96 bg-slate-200 border-2 border-slate-900 shadow-[8px_8px_0_0_#0f172a] animate-pulse"></div>
      </div>
    </div>;
  }

  if (!tutor) {
    return <div className="text-center py-20 text-slate-500 font-bold uppercase tracking-wider">Tutor not found</div>;
  }

  const subjectList = tutor.subjects.split(',').map((s: string) => s.trim());

  return (
    <div className="max-w-5xl mx-auto space-y-8 mb-12">
      <button 
        onClick={() => onNavigate('home')} 
        className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-slate-900 hover:text-white transition-colors bg-white hover:bg-slate-900 px-4 py-2 border-2 border-slate-900 shadow-[4px_4px_0_0_#0f172a] w-max"
      >
        <ArrowLeft size={16} /> Back to Search
      </button>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        
        {/* Left Sidebar */}
        <div className="space-y-8">
          <div className="bg-white border-2 border-slate-900 shadow-[8px_8px_0_0_#0f172a] p-6 text-center">
            <div className="relative inline-block mb-4">
              {tutor.profile_picture_path ? (
                <img 
                  src={buildImageSrc(tutor.profile_picture_path)} 
                  alt={tutor.name} 
                  className="w-32 h-32 object-cover border-2 border-slate-900 bg-indigo-50 mx-auto shadow-[4px_4px_0_0_#0f172a]"
                />
              ) : (
                <div className="w-32 h-32 bg-indigo-100 border-2 border-slate-900 shadow-[4px_4px_0_0_#0f172a] mx-auto flex items-center justify-center text-slate-900 font-bold text-4xl uppercase">
                  {tutor.name.charAt(0)}
                </div>
              )}
              {tutor.is_active === 1 && (
                <div className="absolute bottom-1 right-3 w-5 h-5 bg-indigo-500 border-2 border-slate-900"></div>
              )}
            </div>
            
            <h1 className="text-2xl font-bold uppercase tracking-wider text-slate-900 mb-1">{tutor.name}</h1>
            <p className="text-slate-600 font-medium mb-4">{tutor.latest_degree_title}</p>
            
            <div className="flex justify-center gap-2 mb-6">
               <span className="px-3 py-1 bg-indigo-50 border-2 border-slate-900 text-slate-900 font-bold uppercase tracking-wider text-sm shadow-[2px_2px_0_0_#0f172a]">
                 PKR {tutor.hourly_rate} / hr
               </span>
            </div>

            <div className="space-y-4 text-left pt-6 border-t-2 border-slate-900">
              <div className="flex items-center gap-3 text-sm font-bold text-slate-700">
                <MapPin className="text-slate-900" size={18} /> {tutor.city}
              </div>
              <div className="flex items-center gap-3 text-sm font-bold text-slate-700">
                <Mail className="text-slate-900" size={18} /> {tutor.email}
              </div>
              <div className="flex items-center gap-3 text-sm font-bold text-slate-700">
                <Phone className="text-slate-900" size={18} /> {tutor.phone}
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="md:col-span-2 space-y-8">
          <div className="bg-white border-2 border-slate-900 shadow-[8px_8px_0_0_#0f172a] p-8">
            <h2 className="text-xl font-bold uppercase tracking-wider text-slate-900 mb-4 bg-indigo-100 border-2 border-slate-900 inline-block px-3 py-1 shadow-[2px_2px_0_0_#0f172a]">About Me</h2>
            <p className="text-slate-700 font-medium leading-relaxed whitespace-pre-wrap mt-2">
              {tutor.bio || "This tutor hasn't provided a bio yet."}
            </p>
          </div>

          <div className="bg-white border-2 border-slate-900 shadow-[8px_8px_0_0_#0f172a] p-8">
            <h2 className="text-xl font-bold uppercase tracking-wider text-slate-900 mb-6 bg-indigo-100 border-2 border-slate-900 inline-block px-3 py-1 shadow-[2px_2px_0_0_#0f172a]">Subjects Taught</h2>
            <div className="flex flex-wrap gap-3 mt-2">
              {subjectList.map((subject: string, idx: number) => (
                <span key={idx} className="px-4 py-2 bg-indigo-50 text-slate-900 font-bold uppercase tracking-wider text-sm border-2 border-slate-900 shadow-[2px_2px_0_0_#0f172a] hover:bg-indigo-500 hover:text-white transition-colors">
                  {subject}
                </span>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
             <div className="bg-white border-2 border-slate-900 shadow-[8px_8px_0_0_#0f172a] p-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2 border-2 border-slate-900 bg-indigo-50 text-slate-900 shadow-[2px_2px_0_0_#0f172a]">
                    <GraduationCap size={20} />
                  </div>
                  <h3 className="font-bold uppercase tracking-wider text-slate-900">Experience</h3>
                </div>
                <div className="space-y-2">
                  <p className="text-slate-700 font-bold"><span className="text-indigo-600">{tutor.experience_years} years</span> of teaching</p>
                  {tutor.teaching_institution && (
                    <p className="text-sm font-medium text-slate-600 border-t-2 border-slate-900 pt-2 mt-2">Past/Present: {tutor.teaching_institution} ({tutor.institution_type})</p>
                  )}
                </div>
             </div>

             <div className="bg-white border-2 border-slate-900 shadow-[8px_8px_0_0_#0f172a] p-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2 border-2 border-slate-900 bg-indigo-50 text-slate-900 shadow-[2px_2px_0_0_#0f172a]">
                    <MonitorPlay size={20} />
                  </div>
                  <h3 className="font-bold uppercase tracking-wider text-slate-900">Teaching Mode</h3>
                </div>
                <p className="text-slate-700 font-bold text-lg uppercase tracking-widest">{tutor.teaching_mode}</p>
             </div>
          </div>
          
          <div className="bg-white border-2 border-slate-900 shadow-[8px_8px_0_0_#0f172a] p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 border-2 border-slate-900 bg-indigo-50 text-slate-900 shadow-[2px_2px_0_0_#0f172a]">
                <Clock size={20} />
              </div>
              <h3 className="font-bold uppercase tracking-wider text-slate-900">Availability</h3>
            </div>
            <p className="text-slate-700 font-medium whitespace-pre-wrap border-2 border-slate-900 p-4 bg-slate-50">
              {tutor.availability_schedule || "Schedule not specified. Please contact to discuss availability."}
            </p>
          </div>
        </div>

      </div>
    </div>
  );
}
