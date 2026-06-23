import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/lib/AuthContext';
import { Button } from '@/components/ui/button';
import { AlertCircle, Home, ArrowLeft } from 'lucide-react';

export default function PageNotFound() {
  const navigate = useNavigate();
  const { user, isAuthenticated, isLoadingAuth } = useAuth();
  const [returnPath, setReturnPath] = useState('/');

  useEffect(() => {
    if (!isLoadingAuth) {
      setReturnPath(isAuthenticated && user ? '/' : '/login');
    }
  }, [isLoadingAuth, isAuthenticated, user]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="max-w-md w-full text-center space-y-6">
        <div className="mx-auto w-24 h-24 bg-muted rounded-full flex items-center justify-center mb-8">
          <AlertCircle className="w-12 h-12 text-muted-foreground" />
        </div>
        <h1 className="text-4xl font-bold tracking-tight">404</h1>
        <h2 className="text-2xl font-semibold tracking-tight">Page not found</h2>
        <p className="text-muted-foreground">The page you're looking for doesn't exist or has been moved.</p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-6">
          <Button variant="outline" className="w-full sm:w-auto" onClick={() => navigate(-1)}>
            <ArrowLeft className="w-4 h-4 mr-2" /> Go Back
          </Button>
          <Button className="w-full sm:w-auto" asChild>
            <Link to={returnPath}><Home className="w-4 h-4 mr-2" /> Back to Home</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
