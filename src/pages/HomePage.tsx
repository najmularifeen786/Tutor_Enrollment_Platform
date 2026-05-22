import React, { useState, useEffect } from 'react';
import SearchBar from '../components/SearchBar';
import TutorGrid from '../components/TutorGrid';
import { PREDEFINED_SUBJECTS } from '../lib/constants';
import { Sparkles, Users } from 'lucide-react';

interface HomePageProps {
  onNavigate: (page: string, params?: any) => void;
}

export default function HomePage({ onNavigate }: HomePageProps) {
  const [tutors, setTutors] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchTutors();
  }, [searchQuery]);

  const fetchTutors = async () => {
    setIsLoading(true);
    try {
      const queryParams = new URLSearchParams();
      if (searchQuery) queryParams.append('subject', searchQuery);
      
      const res = await fetch(`/api/tutors${queryParams.toString() ? `?${queryParams.toString()}` : ''}`);
      const data = await res.json();
      if (data.success) {
        setTutors(data.data);
      }
    } catch (error) {
      console.error("Failed to fetch tutors", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col space-y-12 pb-12">
      {/* Hero Section */}
      <section className="border-2 border-slate-900 bg-indigo-100 p-8 md:p-16 text-center shadow-[8px_8px_0_0_#0f172a] relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none" 
             style={{ backgroundImage: 'linear-gradient(to right, #0f172a 1px, transparent 1px), linear-gradient(to bottom, #0f172a 1px, transparent 1px)', backgroundSize: '32px 32px' }}></div>
        
        <div className="relative z-10 max-w-4xl mx-auto space-y-6">
          <div className="inline-flex items-center gap-2 border-2 border-slate-900 bg-white px-3 py-1 text-xs font-bold uppercase tracking-wider text-slate-900 mb-2 shadow-[2px_2px_0_0_#0f172a]">
            <Sparkles size={16} />
            <span>Premium Learning Experience</span>
          </div>
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold uppercase tracking-wide text-slate-900 leading-none">
            Find the Perfect Tutor for Your Success
          </h1>
          <p className="text-lg md:text-xl font-medium text-slate-700 max-w-2xl mx-auto leading-relaxed">
            Connect with expert educators across the country for online and physical learning sessions tailored to your needs.
          </p>
          
          <div className="pt-8">
            <SearchBar onSearch={setSearchQuery} subjects={PREDEFINED_SUBJECTS} />
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section className="space-y-6">
        <div className="flex justify-between items-end border-b-2 border-slate-900 pb-4">
          <div>
            <h2 className="text-2xl font-bold uppercase tracking-wider text-slate-900 flex items-center gap-2">
              <Users className="text-indigo-600" />
              {searchQuery ? `Search Results for "${searchQuery}"` : "Explore Top Tutors"}
            </h2>
            <p className="text-slate-600 font-medium mt-1">
              {searchQuery ? `Found ${tutors.length} tutors matching your criteria` : "Browse our diverse community of expert instructors"}
            </p>
          </div>
        </div>

        <TutorGrid 
          tutors={tutors} 
          isLoading={isLoading} 
          onViewProfile={(id) => onNavigate('tutorProfile', { id })} 
        />
      </section>
    </div>
  );
}
