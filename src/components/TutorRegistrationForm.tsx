import React, { useState, useEffect } from 'react';
import { PREDEFINED_SUBJECTS } from '../lib/constants';
import { CheckCircle, Upload } from 'lucide-react';

export default function TutorRegistrationForm({ onSuccess }: { onSuccess: () => void }) {
  const [formData, setFormData] = useState({
    username: '', password: '', name: '', phone: '', email: '', city_id: '', qualification_id: '',
    experience_years: '', cnic_number: '', subjects: [] as string[], hourly_rate: '', bio: '',
    teaching_institution: '', institution_type: 'School', teaching_mode: 'Physical',
    availability_schedule: ''
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
    if (name === 'cnic_number') {
      let val = value.replace(/\D/g, ''); // Remove all non-digits
      if (val.length > 13) val = val.slice(0, 13);
      
      let formattedValue = val;
      if (val.length > 5 && val.length <= 12) {
        formattedValue = `${val.slice(0, 5)}-${val.slice(5)}`;
      } else if (val.length > 12) {
        formattedValue = `${val.slice(0, 5)}-${val.slice(5, 12)}-${val.slice(12)}`;
      }
      setFormData(prev => ({ ...prev, [name]: formattedValue }));
    } else if (name === 'phone') {
      let val = value.replace(/\D/g, ''); // Remove all non-digits
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
        return { ...prev, subjects: prev.subjects.filter(s => s !== subject) };
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
    if (!files.profile_picture || !files.degree_certificate || !files.cnic_document) {
      setError('Please upload all required documents (Profile Picture, Degree Certificate, CNIC Document)');
      return;
    }
    
    setIsLoading(true);
    setError('');

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

      const res = await fetch('/api/auth/register-tutor', {
        method: 'POST',
        body: data, // No Content-Type header so browser sets multipart/form-data with boundary
      });

      const result = await res.json();
      if (result.success) {
        onSuccess();
      } else {
        setError(result.message || 'Registration failed');
      }
    } catch (err) {
      setError('An error occurred during registration. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-12">
      {error && (
        <div className="p-4 bg-red-50 text-red-600 border-2 border-red-900 font-bold uppercase tracking-wider shadow-[4px_4px_0_0_#7f1d1d]">
          {error}
        </div>
      )}

      {/* Account Details */}
      <div className="space-y-6">
        <h3 className="text-xl font-bold uppercase tracking-wider text-slate-900 border-b-2 border-slate-900 pb-2">Account Details</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-bold uppercase tracking-wider text-slate-900 mb-2">Username*</label>
            <input type="text" name="username" required value={formData.username} onChange={handleChange} className="w-full px-4 py-3 bg-white border-2 border-slate-900 focus:outline-none focus:border-indigo-600 text-slate-900 font-medium" />
          </div>
          <div>
            <label className="block text-sm font-bold uppercase tracking-wider text-slate-900 mb-2">Password*</label>
            <input type="password" name="password" required value={formData.password} onChange={handleChange} className="w-full px-4 py-3 bg-white border-2 border-slate-900 focus:outline-none focus:border-indigo-600 text-slate-900 font-medium" />
          </div>
        </div>
      </div>

      {/* Personal Info */}
      <div className="space-y-6">
        <h3 className="text-xl font-bold uppercase tracking-wider text-slate-900 border-b-2 border-slate-900 pb-2">Personal Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-bold uppercase tracking-wider text-slate-900 mb-2">Full Name*</label>
            <input type="text" name="name" required value={formData.name} onChange={handleChange} className="w-full px-4 py-3 bg-white border-2 border-slate-900 focus:outline-none focus:border-indigo-600 text-slate-900 font-medium" />
          </div>
          <div>
            <label className="block text-sm font-bold uppercase tracking-wider text-slate-900 mb-2">Email*</label>
            <input type="email" name="email" required value={formData.email} onChange={handleChange} className="w-full px-4 py-3 bg-white border-2 border-slate-900 focus:outline-none focus:border-indigo-600 text-slate-900 font-medium" />
          </div>
          <div>
            <label className="block text-sm font-bold uppercase tracking-wider text-slate-900 mb-2">Phone Number*</label>
            <input type="tel" name="phone" required value={formData.phone} onChange={handleChange} className="w-full px-4 py-3 bg-white border-2 border-slate-900 focus:outline-none focus:border-indigo-600 text-slate-900 font-medium" placeholder="03XXXXXXXXX"/>
          </div>
          <div>
            <label className="block text-sm font-bold uppercase tracking-wider text-slate-900 mb-2">City*</label>
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
            <label className="block text-sm font-bold uppercase tracking-wider text-slate-900 mb-2">CNIC Number*</label>
            <input type="text" name="cnic_number" required value={formData.cnic_number} onChange={handleChange} className="w-full px-4 py-3 bg-white border-2 border-slate-900 focus:outline-none focus:border-indigo-600 text-slate-900 font-medium" placeholder="XXXXX-XXXXXXX-X"/>
          </div>
        </div>
      </div>

      {/* Qualifications */}
      <div className="space-y-6">
        <h3 className="text-xl font-bold uppercase tracking-wider text-slate-900 border-b-2 border-slate-900 pb-2">Qualifications & Experience</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-bold uppercase tracking-wider text-slate-900 mb-2">Latest Qualification*</label>
            <select name="qualification_id" required value={formData.qualification_id} onChange={handleChange} className="w-full px-4 py-3 bg-white border-2 border-slate-900 focus:outline-none focus:border-indigo-600 text-slate-900 font-medium">
              <option value="">Select a qualification</option>
              {qualifications.map((qualification) => (
                <option key={qualification.qualification_id} value={qualification.qualification_id}>
                  {qualification.qualification_name} — {qualification.qualification_level}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-bold uppercase tracking-wider text-slate-900 mb-2">Years of Experience*</label>
            <input type="number" name="experience_years" min="0" max="50" required value={formData.experience_years} onChange={handleChange} className="w-full px-4 py-3 bg-white border-2 border-slate-900 focus:outline-none focus:border-indigo-600 text-slate-900 font-medium" />
          </div>
          <div>
            <label className="block text-sm font-bold uppercase tracking-wider text-slate-900 mb-2">Current/Past Teaching Institution</label>
            <input type="text" name="teaching_institution" value={formData.teaching_institution} onChange={handleChange} className="w-full px-4 py-3 bg-white border-2 border-slate-900 focus:outline-none focus:border-indigo-600 text-slate-900 font-medium" />
          </div>
          <div>
             <label className="block text-sm font-bold uppercase tracking-wider text-slate-900 mb-2">Institution Type</label>
             <select name="institution_type" value={formData.institution_type} onChange={handleChange} className="w-full px-4 py-3 bg-white border-2 border-slate-900 focus:outline-none focus:border-indigo-600 text-slate-900 font-bold uppercase tracking-wider">
               <option value="School">School</option>
               <option value="College">College</option>
               <option value="University">University</option>
               <option value="Academy">Academy</option>
             </select>
          </div>
        </div>
      </div>

      {/* Teaching Profile */}
      <div className="space-y-6">
        <h3 className="text-xl font-bold uppercase tracking-wider text-slate-900 border-b-2 border-slate-900 pb-2">Teaching Profile</h3>
        <div>
           <label className="block text-sm font-bold uppercase tracking-wider text-slate-900 mb-4">Subjects You Can Teach*</label>
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
             <label className="block text-sm font-bold uppercase tracking-wider text-slate-900 mb-2">Teaching Mode*</label>
             <select name="teaching_mode" value={formData.teaching_mode} onChange={handleChange} className="w-full px-4 py-3 bg-white border-2 border-slate-900 focus:outline-none focus:border-indigo-600 text-slate-900 font-bold uppercase tracking-wider">
               <option value="Remote">Remote</option>
               <option value="Physical">Physical</option>
               <option value="Both">Both</option>
             </select>
          </div>
          <div>
            <label className="block text-sm font-bold uppercase tracking-wider text-slate-900 mb-2">Hourly Rate (PKR)*</label>
            <input type="number" name="hourly_rate" min="0" required value={formData.hourly_rate} onChange={handleChange} className="w-full px-4 py-3 bg-white border-2 border-slate-900 focus:outline-none focus:border-indigo-600 text-slate-900 font-medium" />
          </div>
        </div>

        <div>
          <label className="block text-sm font-bold uppercase tracking-wider text-slate-900 mb-2">Bio*</label>
          <textarea name="bio" rows={4} required value={formData.bio} onChange={handleChange} className="w-full px-4 py-3 bg-white border-2 border-slate-900 focus:outline-none focus:border-indigo-600 text-slate-900 font-medium" placeholder="Tell students about yourself, your teaching style, and expertise..."></textarea>
        </div>
        
        <div>
          <label className="block text-sm font-bold uppercase tracking-wider text-slate-900 mb-2">Availability Schedule*</label>
          <textarea name="availability_schedule" rows={2} required value={formData.availability_schedule} onChange={handleChange} className="w-full px-4 py-3 bg-white border-2 border-slate-900 focus:outline-none focus:border-indigo-600 text-slate-900 font-medium" placeholder="e.g. Mon-Fri: 5pm-9pm, Weekends: 10am-2pm or please contact"></textarea>
        </div>
      </div>

      {/* Documents */}
      <div className="space-y-6">
        <h3 className="text-xl font-bold uppercase tracking-wider text-slate-900 border-b-2 border-slate-900 pb-2">Documents & Verification</h3>
        <p className="text-sm font-medium text-slate-600">Document uploads are strictly required in order to verify your profile.</p>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
           <div className="border-2 border-dashed border-slate-900 bg-white p-6 text-center hover:bg-indigo-50 transition-colors shadow-[4px_4px_0_0_#0f172a]">
              <Upload className="mx-auto text-slate-900 mb-2" size={24} />
              <label className="block text-sm font-bold uppercase tracking-wider text-slate-900 cursor-pointer">
                <span>Upload Profile Picture*</span>
                <input type="file" name="profile_picture" accept="image/png, image/jpeg" onChange={handleFileChange} className="hidden" />
              </label>
              <div className="text-xs text-slate-600 mt-2 font-medium">{files.profile_picture ? files.profile_picture.name : 'JPG, PNG up to 2MB'}</div>
           </div>
           <div className="border-2 border-dashed border-slate-900 bg-white p-6 text-center hover:bg-indigo-50 transition-colors shadow-[4px_4px_0_0_#0f172a]">
              <Upload className="mx-auto text-slate-900 mb-2" size={24} />
              <label className="block text-sm font-bold uppercase tracking-wider text-slate-900 cursor-pointer">
                <span>Upload Degree Certificate*</span>
                <input type="file" name="degree_certificate" accept="image/jpeg, application/pdf" onChange={handleFileChange} className="hidden" />
              </label>
              <div className="text-xs text-slate-600 mt-2 font-medium">{files.degree_certificate ? files.degree_certificate.name : 'PDF, JPG up to 5MB'}</div>
           </div>
           <div className="border-2 border-dashed border-slate-900 bg-white p-6 text-center hover:bg-indigo-50 transition-colors shadow-[4px_4px_0_0_#0f172a]">
              <Upload className="mx-auto text-slate-900 mb-2" size={24} />
              <label className="block text-sm font-bold uppercase tracking-wider text-slate-900 cursor-pointer">
                <span>Upload CNIC Document*</span>
                <input type="file" name="cnic_document" accept="image/jpeg, application/pdf" onChange={handleFileChange} className="hidden" />
              </label>
              <div className="text-xs text-slate-600 mt-2 font-medium">{files.cnic_document ? files.cnic_document.name : 'PDF, JPG up to 5MB'}</div>
           </div>
        </div>
      </div>

      <button
        type="submit"
        disabled={isLoading}
        className="w-full py-4 bg-indigo-500 hover:bg-slate-900 text-white font-bold uppercase tracking-wider text-lg transition-colors border-2 border-slate-900 disabled:opacity-70 flex justify-center items-center shadow-[6px_6px_0_0_#0f172a] hover:shadow-[2px_2px_0_0_#0f172a] hover:translate-x-[4px] hover:translate-y-[4px]"
      >
        {isLoading ? (
          <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
        ) : (
          "Register as Tutor"
        )}
      </button>
    </form>
  );
}
