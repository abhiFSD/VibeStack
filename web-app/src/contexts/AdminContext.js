import React, { createContext, useContext, useState, useEffect } from 'react';
import { checkIsSuperAdmin } from '../utils/auth';

const AdminContext = createContext();

export const useAdmin = () => {
  const context = useContext(AdminContext);
  if (!context) {
    throw new Error('useAdmin must be used within an AdminProvider');
  }
  return context;
};

export const AdminProvider = ({ children }) => {
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkAdminStatus = async () => {
      try {
        const isAdmin = await checkIsSuperAdmin();
        setIsSuperAdmin(isAdmin);
      } catch (error) {
        console.error('Error checking admin status:', error);
      } finally {
        setIsLoading(false);
      }
    };

    checkAdminStatus();
  }, []);

  return (
    <AdminContext.Provider value={{ isSuperAdmin, isLoading }}>
      {children}
    </AdminContext.Provider>
  );
}; 