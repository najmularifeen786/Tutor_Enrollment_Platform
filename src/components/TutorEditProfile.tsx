import React, { useState, useEffect } from 'react';
import { PREDEFINED_SUBJECTS } from '../lib/constants';
import { Upload } from 'lucide-react';

export default function TutorEditProfile({ profile, user, onUpdateSuccess }: any) {
  // Pre-fill form
  const [formData, setFormData] = useState({
    name: profile.name || '', phone: profile.phone || '', city_id: profile.city_id || '',
    experience_years: profile.experience_years || '', qualification_id: profile.qualification_id || '',
    subjects: profile.subjects ? profile.subjects.split(',').map((s:string) => s.trim()) : [] as string[], 
    hourly_rate_pkr: profile.hourly_rate_pkr || '', bio: profile.bio || '',
    teaching_institution_name: profile.teaching_institution_name || '', institution_type: profile.institution_type || 'School', 
    teaching_mode: profile.teaching_mode || 'Physical', availability_schedule: profile.availability_schedule || ''
  });
  const [cities, setCities] = useState<{ city_id: number; city_name: string }[]>([]);
  const [qualifications, setQualifications] = useState<{ qualification_id: number; qualification_name: string; qualification_level: string }[]>([]);
  
  const [files, setFiles] = useState<{ [key: string]: File | null }>({
    degree_certificate: null,
    cnic_document: null,
    profile_picture: null
  });

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    const loadLookups = async () => {
      try {
        const [citiesRes, qualsRes] = await Promise.all([
          fetch('/api/cities'),
          fetch('/api/qualifications')
        ]);

        const citiesJson = await citiesRes.json();
        const qualsJson = await qualsRes.json();

        if (citiesJson.success) setCities(citiesJson.data);
        if (qualsJson.success) setQualifications(qualsJson.data);
      } catch (err) {
        console.error('Unable to load cities or qualifications', err);
      }
    };

    loadLookups();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    if (name === 'phone') {
      let val = value.replace(/\D/g, '');
      if (val.length > 11) val = val.slice(0, 11);
      setFormData(prev => ({ ...prev, [name]: val }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const isValidPhone = (phone: string) => /^0\d{10}$/.test(phone);
  const isValidAvailability = (value: string) => {
    const trimmed = value.trim();
    if (!trimmed) return false;
    if (/^please\s*contact$/i.test(trimmed)) return true;
    const pattern = /^([A-Za-z]+(?:-[A-Za-z]+)?\s*:\s*\d{1,2}(?::\d{2})?\s*(?:am|pm)\s*-\s*\d{1,2}(?::\d{2})?\s*(?:am|pm))(?:\s*,\s*[A-Za-z]+(?:-[A-Za-z]+)?\s*:\s*\d{1,2}(?::\d{2})?\s*(?:am|pm)\s*-\s*\d{1,2}(?::\d{2})?\s*(?:am|pm))*$/i;
    return pattern.test(trimmed);
  };

  const handleSubjectToggle = (subject: string) => {
    setFormData(prev => {
      const isSelected = prev.subjects.includes(subject);
      if (isSelected) {
        return { ...prev, subjects: prev.subjects.filter((s:string) => s !== subject) };
      } else {
        return { ...prev, subjects: [...prev.subjects, subject] };
      }
    });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, files: selectedFiles } = e.target;
    if (selectedFiles && selectedFiles.length > 0) {
      setFiles(prev => ({ ...prev, [name]: selectedFiles[0] }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.subjects.length === 0) {
      setError('Please select at least one subject');
      return;
    }
    if (!isValidPhone(formData.phone)) {
      setError('Phone number must be 11 digits long and start with 0.');
      return;
    }
    if (!isValidAvailability(formData.availability_schedule)) {
      setError('Availability must be entered like "Mon-Fri: 5pm-9pm" or enter "please contact".');
      return;
    }
    
    setIsLoading(true);
    setError('');
    setSuccessMsg('');

    try {
      const data = new FormData();
      Object.entries(formData).forEach(([key, value]) => {
        if (key === 'subjects') {
          data.append(key, (value as string[]).join(', '));
        } else {
          data.append(key, String(value));
        }
      });
      
      Object.entries(files).forEach(([key, file]) => {
        if (file) data.append(key, file as File);
      });

      const res = await fetch('/api/tutors/profile', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${user.token}`
        },
        body: data,
      });

      const result = await res.json();
      if (result.success) {
        setSuccessMsg('Profile updated successfully!');
        onUpdateSuccess();
      } else {
        setError(result.message || 'Update failed');
      }
    } catch (err) {
      setError('An error occurred during update. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && <div className="p-3 bg-red-50 text-red-600 border-2 border-red-900 font-bold uppercase tracking-wider shadow-[4px_4px_0_0_#7f1d1d]">{error}</div>}
      {successMsg && <div className="p-3 bg-green-50 text-green-600 border-2 border-green-900 font-bold uppercase tracking-wider shadow-[4px_4px_0_0_#14532d]">{successMsg}</div>}

      {/* Basic Info */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-bold uppercase tracking-wider text-slate-900 mb-2">Full Name</label>
          <input type="text" name="name" required value={formData.name} onChange={handleChange} className="w-full px-4 py-3 bg-white border-2 border-slate-900 focus:outline-none focus:border-indigo-600 text-slate-900 font-medium" />
        </div>
        <div>
          <label className="block text-sm font-bold uppercase tracking-wider text-slate-900 mb-2">Phone Number</label>
          <input type="tel" name="phone" required value={formData.phone} onChange={handleChange} className="w-full px-4 py-3 bg-white border-2 border-slate-900 focus:outline-none focus:border-indigo-600 text-slate-900 font-medium" />
        </div>
        <div>
          <label className="block text-sm font-bold uppercase tracking-wider text-slate-900 mb-2">City</label>
          <select name="city_id" required value={formData.city_id} onChange={handleChange} className="w-full px-4 py-3 bg-white border-2 border-slate-900 focus:outline-none focus:border-indigo-600 text-slate-900 font-medium">
            <option value="">Select a city</option>
            {cities.map((city) => (
              <option key={city.city_id} value={city.city_id}>
                {city.city_name} ({city.city_id})
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-bold uppercase tracking-wider text-slate-900 mb-2">Hourly Rate (PKR)</label>
          <input type="number" name="hourly_rate_pkr" min="0" required value={formData.hourly_rate_pkr} onChange={handleChange} className="w-full px-4 py-3 bg-white border-2 border-slate-900 focus:outline-none focus:border-indigo-600 text-slate-900 font-medium" />
        </div>
      </div>

      <div>
        <label className="block text-sm font-bold uppercase tracking-wider text-slate-900 mb-2">Bio</label>
        <textarea name="bio" rows={4} required value={formData.bio} onChange={handleChange} className="w-full px-4 py-3 bg-white border-2 border-slate-900 focus:outline-none focus:border-indigo-600 text-slate-900 font-medium"></textarea>
      </div>

      <div>
         <label className="block text-sm font-bold uppercase tracking-wider text-slate-900 mb-4">Subjects</label>
         <div className="flex flex-wrap gap-3">
           {PREDEFINED_SUBJECTS.map((subject) => (
             <button
               key={subject}
               type="button"
               onClick={() => handleSubjectToggle(subject)}
               className={`px-4 py-2 text-sm font-bold uppercase tracking-wider border-2 transition-colors shadow-[2px_2px_0_0_#0f172a] hover:-translate-y-[1px] hover:shadow-[3px_3px_0_0_#0f172a] ${
                 formData.subjects.includes(subject) 
                 ? 'bg-indigo-500 border-slate-900 text-white'
                 : 'bg-white border-slate-900 text-slate-900 hover:bg-indigo-50'
               }`}
             >
               {subject}
             </button>
           ))}
         </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
           <label className="block text-sm font-bold uppercase tracking-wider text-slate-900 mb-2">Qualification</label>
           <select name="qualification_id" value={formData.qualification_id} onChange={handleChange} className="w-full px-4 py-3 bg-white border-2 border-slate-900 focus:outline-none focus:border-indigo-600 text-slate-900 font-bold uppercase tracking-wider">
             <option value="">Select a qualification</option>
             {qualifications.map((qualification) => (
               <option key={qualification.qualification_id} value={qualification.qualification_id}>
                 {qualification.qualification_name} — {qualification.qualification_level}
               </option>
             ))}
           </select>
        </div>
        <div>
          <label className="block text-sm font-bold uppercase tracking-wider text-slate-900 mb-2">Availability Schedule</label>
          <textarea name="availability_schedule" rows={3} value={formData.availability_schedule} onChange={handleChange} className="w-full px-4 py-3 bg-white border-2 border-slate-900 focus:outline-none focus:border-indigo-600 text-slate-900 font-medium" placeholder="e.g. Mon-Fri: 5pm-9pm or please contact"></textarea>
        </div>
        <div>
           <label className="block text-sm font-bold uppercase tracking-wider text-slate-900 mb-2">Upload New Profile Picture (Optional)</label>
           <input type="file" name="profile_picture" accept="image/*" onChange={handleFileChange} className="w-full text-sm text-slate-600 file:mr-4 file:py-2 file:px-4 file:border-2 file:border-slate-900 file:text-sm file:font-bold file:uppercase file:bg-white file:text-slate-900 hover:file:bg-indigo-50 file:shadow-[2px_2px_0_0_#0f172a]" />
        </div>
      </div>

      <button
        type="submit"
        disabled={isLoading}
        className="w-full py-4 bg-indigo-500 hover:bg-slate-900 text-white font-bold uppercase tracking-wider transition-colors border-2 border-slate-900 disabled:opacity-70 flex justify-center items-center shadow-[6px_6px_0_0_#0f172a] hover:shadow-[2px_2px_0_0_#0f172a] hover:translate-x-[4px] hover:translate-y-[4px]"
      >
        {isLoading ? "Saving..." : "Save Changes"}
      </button>
    </form>
  );
}
