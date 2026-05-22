/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import HomePage from "./pages/HomePage";
import RegistrationPage from "./pages/RegistrationPage";
import TutorProfilePage from "./pages/TutorProfilePage";
import AdminPage from "./pages/AdminPage";
import TutorDashboard from "./pages/TutorDashboard";
import AuthModal from "./components/AuthModal";

export default function App() {
  const [currentPage, setCurrentPage] = useState("home");
  const [selectedTutorId, setSelectedTutorId] = useState<number | null>(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [user, setUser] = useState<{ user_type: string; session_token: string; user_id?: number } | null>(null);

  useEffect(() => {
    // Check session on load
    const token = localStorage.getItem("session_token");
    const userType = localStorage.getItem("user_type");
    const userId = localStorage.getItem("user_id");
    if (token && userType) {
      setUser({ session_token: token, user_type: userType, user_id: userId ? parseInt(userId, 10) : undefined });
    }
    
    // Theme setup
    const isDark = localStorage.getItem("theme") === "dark";
    if (isDark) document.documentElement.classList.add("dark");
  }, []);

  const navigateTo = (page: string, params?: any) => {
    if (page === "tutorProfile" && params?.id) {
      setSelectedTutorId(params.id);
    }
    setCurrentPage(page);
    window.scrollTo(0, 0);
  };

  const handleLogout = async () => {
    if (user?.session_token) {
      try {
        await fetch('/api/auth/logout', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ session_token: user.session_token })
        });
      } catch (e) {
        console.error("Logout error", e);
      }
    }
    localStorage.removeItem("session_token");
    localStorage.removeItem("user_type");
    localStorage.removeItem("user_id");
    setUser(null);
    navigateTo("home");
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar 
        user={user} 
        onLoginClick={() => setIsAuthModalOpen(true)} 
        onLogout={handleLogout}
        onNavigate={navigateTo}
      />
      
      <main className="flex-grow container mx-auto px-4 py-8 max-w-7xl">
        {currentPage === "home" && <HomePage onNavigate={navigateTo} />}
        {currentPage === "register" && <RegistrationPage onNavigate={navigateTo} />}
        {currentPage === "tutorProfile" && selectedTutorId && <TutorProfilePage tutorId={selectedTutorId} onNavigate={navigateTo} />}
        {currentPage === "admin" && user?.user_type === "admin" && <AdminPage user={user} />}
        {currentPage === "dashboard" && user?.user_type === "tutor" && <TutorDashboard user={user} onNavigate={navigateTo} />}
      </main>

      <Footer />

      {isAuthModalOpen && (
        <AuthModal 
          onClose={() => setIsAuthModalOpen(false)} 
          onLoginSuccess={(userData) => {
            setUser(userData);
            setIsAuthModalOpen(false);
            navigateTo(userData.user_type === "admin" ? "admin" : "dashboard");
          }}
          onNavigate={navigateTo}
        />
      )}
    </div>
  );
}
