import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserProfile } from '../types';
import { db } from '../lib/storage';

interface AuthContextType {
  currentUser: UserProfile;
  availableProfiles: UserProfile[];
  switchUser: (userId: string) => void;
  updateCurrentUserProfile: (updates: Partial<UserProfile>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [profiles, setProfiles] = useState<UserProfile[]>(() => db.getProfiles());
  const [currentUserId, setCurrentUserId] = useState<string>(() => db.getCurrentUserId());

  useEffect(() => {
    db.ensureInitialized();
    setProfiles(db.getProfiles());
  }, []);

  const currentUser = profiles.find((p) => p.id === currentUserId) || profiles[0];

  const switchUser = (userId: string) => {
    db.setCurrentUserId(userId);
    setCurrentUserId(userId);
  };

  const updateCurrentUserProfile = (updates: Partial<UserProfile>) => {
    const updated = profiles.map((p) => (p.id === currentUser.id ? { ...p, ...updates } : p));
    setProfiles(updated);
    // Persist in storage
    localStorage.setItem('chesspair_profiles_v1', JSON.stringify(updated));
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        availableProfiles: profiles,
        switchUser,
        updateCurrentUserProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
