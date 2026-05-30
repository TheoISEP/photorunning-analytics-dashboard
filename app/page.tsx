'use client';

import { useState, useEffect } from 'react';
import { isAuthenticated } from '@/lib/auth';
import LoginForm from '@/components/LoginForm';
import FullWidthDashboard from '@/components/FullWidthDashboard';

export default function Home() {
  const [isAuth, setIsAuth] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Vérifier l'authentification au chargement
    setIsAuth(isAuthenticated());
    setIsLoading(false);
  }, []);

  const handleLoginSuccess = () => {
    setIsAuth(true);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAuth) {
    return <LoginForm onLoginSuccess={handleLoginSuccess} />;
  }

  return <FullWidthDashboard />;
}
