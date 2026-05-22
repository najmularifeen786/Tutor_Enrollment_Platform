import React from 'react';

export default function Footer() {
  return (
    <footer className="bg-slate-900 border-t-2 border-slate-900 mt-auto text-white">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="flex flex-col md:flex-row justify-between items-center text-sm font-bold uppercase tracking-wider">
          <p>© {new Date().getFullYear()} TutorPlatform. All rights reserved.</p>
          <div className="flex space-x-6 mt-4 md:mt-0">
            <a href="#" className="hover:text-indigo-400 transition-colors">Terms of Service</a>
            <a href="#" className="hover:text-indigo-400 transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-indigo-400 transition-colors">Contact Us</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
