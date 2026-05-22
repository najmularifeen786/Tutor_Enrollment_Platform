import React from 'react';
import TutorCard from './TutorCard';

interface TutorGridProps {
  tutors: any[];
  isLoading: boolean;
  onViewProfile: (id: number) => void;
}

export default function TutorGrid({ tutors, isLoading, onViewProfile }: TutorGridProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="bg-white border-2 border-slate-900 shadow-[8px_8px_0_0_#0f172a] h-80 animate-pulse p-6 flex flex-col">
            <div className="flex justify-between items-start mb-6">
              <div className="flex gap-4">
                <div className="w-16 h-16 border-2 border-slate-900 bg-slate-200"></div>
                <div>
                  <div className="h-5 w-32 bg-slate-200 mb-2"></div>
                  <div className="h-4 w-20 bg-slate-200"></div>
                </div>
              </div>
            </div>
            <div className="flex gap-2 mb-6">
              <div className="h-6 w-16 bg-slate-200 border-2 border-slate-300"></div>
              <div className="h-6 w-16 bg-slate-200 border-2 border-slate-300"></div>
            </div>
            <div className="space-y-2 mt-auto">
              <div className="h-4 w-full bg-slate-200"></div>
              <div className="h-4 w-4/5 bg-slate-200"></div>
              <div className="h-4 w-2/3 bg-slate-200"></div>
            </div>
            <div className="h-10 w-full bg-slate-200 border-2 border-slate-300 mt-6"></div>
          </div>
        ))}
      </div>
    );
  }

  if (tutors.length === 0) {
    return (
      <div className="text-center py-20 bg-white border-2 border-slate-900 border-dashed shadow-[8px_8px_0_0_#0f172a]">
        <div className="bg-indigo-50 border-2 border-slate-900 w-16 h-16 flex items-center justify-center mx-auto mb-4 shadow-[4px_4px_0_0_#0f172a]">
          <span className="text-2xl">🔍</span>
        </div>
        <h3 className="text-xl font-bold uppercase tracking-wider text-slate-900 mb-2">No tutors found</h3>
        <p className="text-slate-600 font-medium max-w-sm mx-auto">
          We couldn't find any tutors matching your search. Try different keywords or browse all subjects.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
      {tutors.map((tutor) => (
        <TutorCard key={tutor.tutor_id} tutor={tutor} onViewProfile={onViewProfile} />
      ))}
    </div>
  );
}
