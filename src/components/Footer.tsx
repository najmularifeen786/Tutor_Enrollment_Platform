import React from 'react';

export default function Footer() {
  return (
    <footer style={{ backgroundColor: '#0f172a', borderTop: '2px solid #334155', marginTop: 'auto', color: 'white' }}>
      <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '20px 16px' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '12px', fontSize: '13px' }}>
          
          {/* Left */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#cbd5e1', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            <span>© {new Date().getFullYear()} TutorPlatform.</span>
            <a href="https://github.com/najmularifeen786/Tutor_Enrollment_Platform" target="_blank" rel="noopener noreferrer" style={{ color: '#818cf8', textDecoration: 'none' }}>
              <p>  &emsp;&emsp;&emsp; Open Source Project</p>
              
            </a>
          </div>

          {/* Right - Contributors */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>

            {/* Najmul Arifeen*/}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ color: '#94a3b8', fontSize: '11px', fontWeight: '600', textTransform: 'uppercase' }}>Najmul Arifeen</span>
              <a href="https://github.com/najmularifeen786" target="_blank" rel="noopener noreferrer" style={{ color: '#cbd5e1', textDecoration: 'none' }}>GitHub</a>
              <a href="https://linkedin.com/in/najmularifeen" target="_blank" rel="noopener noreferrer" style={{ color: '#cbd5e1', textDecoration: 'none' }}>LinkedIn</a>
              <a href="mailto:najmularifeen786@gmail.com" style={{ color: '#cbd5e1', textDecoration: 'none' }}>Email</a>
            </div>

            <span style={{ color: '#475569' }}>|</span>

            {/* Hasnat */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ color: '#94a3b8', fontSize: '11px', fontWeight: '600', textTransform: 'uppercase' }}>Hasnat Imtiaz</span>
              <a href="https://github.com/Hasnat-code" target="_blank" rel="noopener noreferrer" style={{ color: '#cbd5e1', textDecoration: 'none' }}>GitHub</a>
              <a href="https://www.linkedin.com/in/muhammad-hasnat-imtiaz/" target="_blank" rel="noopener noreferrer" style={{ color: '#cbd5e1', textDecoration: 'none' }}>LinkedIn</a>
              <a href="mailto:hasnatimtiaz949@gmail.com" style={{ color: '#cbd5e1', textDecoration: 'none' }}>Email</a>
            </div>

          </div>
        </div>
      </div>
    </footer>
  );
}