import React from 'react';
import { MapPin, Book, Star, GraduationCap } from 'lucide-react';

interface Tutor {
  tutor_id: number;
  name: string;
  city: string;
  experience_years: number;
  subjects: string;
  hourly_rate: number;
  bio: string;
  teaching_mode: string;
  profile_picture_path?: string;
}

interface TutorCardProps {
  key?: React.Key;
  tutor: Tutor;
  onViewProfile: (id: number) => void;
}

const buildImageSrc = (filePath?: string) => {
  if (!filePath) return undefined;
  if (filePath.startsWith('/uploads/')) return filePath;
  if (filePath.startsWith('uploads/')) return `/${filePath}`;
  return `/uploads/${filePath}`;
};

export default function TutorCard({ tutor, onViewProfile }: TutorCardProps) {
  const subjectList = tutor.subjects.split(',').map(s => s.trim());

  return (
    <div className="bg-white border-2 border-slate-900 shadow-[8px_8px_0_0_#0f172a] transition-all hover:translate-x-[4px] hover:translate-y-[4px] hover:shadow-[4px_4px_0_0_#0f172a] flex flex-col h-full">
      <div className="p-6 flex flex-col flex-grow">
        <div className="flex justify-between items-start mb-6">
          <div className="flex gap-4">
            <div className="relative">
              {tutor.profile_picture_path ? (
                <img 
                  src={buildImageSrc(tutor.profile_picture_path)} 
                  alt={tutor.name} 
                  className="w-16 h-16 object-cover border-2 border-slate-900 bg-indigo-50"
                />
              ) : (
                <div className="w-16 h-16 bg-indigo-100 border-2 border-slate-900 flex items-center justify-center text-slate-900 font-bold text-xl uppercase">
                  {tutor.name.charAt(0)}
                </div>
              )}
            </div>
            <div>
              <h3 className="font-bold text-xl uppercase tracking-wider text-slate-900 group-hover:text-indigo-600 transition-colors">
                {tutor.name}
              </h3>
              <div className="flex items-center text-sm font-bold text-slate-600 mt-1 uppercase tracking-wider">
                <MapPin size={14} className="mr-1" />
                {tutor.city}
              </div>
            </div>
          </div>
          <div className="text-right">
            <div className="font-bold text-xl text-indigo-600 flex items-center justify-end">
              PKR {tutor.hourly_rate}
              <span className="text-sm font-bold text-slate-500 ml-1">/ hr</span>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 mb-6">
          {subjectList.slice(0, 3).map((subject, idx) => (
            <span key={idx} className="px-2 py-1 border-2 border-slate-900 bg-indigo-50 text-slate-900 text-xs font-bold uppercase tracking-wider flex items-center gap-1">
              <Book size={12} />
              {subject}
            </span>
          ))}
          {subjectList.length > 3 && (
            <span className="px-2 py-1 border-2 border-slate-900 bg-white text-slate-600 text-xs font-bold uppercase tracking-wider">
              +{subjectList.length - 3} more
            </span>
          )}
        </div>

        <div className="flex items-center justify-between text-sm text-slate-900 mb-4 pb-4 border-b-2 border-slate-900 font-bold uppercase tracking-wider">
          <div className="flex items-center gap-1.5">
            <GraduationCap size={16} className="text-indigo-600" />
            <span>{tutor.experience_years} Years Exp.</span>
          </div>
          <div className="flex items-center gap-1.5">
             <div className="w-2 h-2 bg-indigo-500 border border-slate-900"></div>
             <span className="text-xs">{tutor.teaching_mode}</span>
          </div>
        </div>

        <p className="text-sm text-slate-700 font-medium line-clamp-3 mb-6 flex-grow">
          {tutor.bio || "No bio provided."}
        </p>

        <button 
          onClick={() => onViewProfile(tutor.tutor_id)}
          className="w-full mt-auto py-2.5 bg-indigo-500 hover:bg-slate-900 text-white font-bold uppercase tracking-wider text-sm transition-colors border-2 border-slate-900 flex justify-center items-center gap-2 shadow-[4px_4px_0_0_#0f172a] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px]"
        >
          View Profile
        </button>
      </div>
    </div>
  );
}
