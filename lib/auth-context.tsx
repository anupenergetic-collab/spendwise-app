import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const AUTH_KEY = '@spendwise_user';
const USERS_KEY = '@spendwise_users';

export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  provider: 'email' | 'google';
  createdAt: string;
}

type UsersRegistry = Record<string, User>;

interface AuthContextValue {
  user: User | null;
  isLoading: boolean;
  signInWithEmail: (email: string) => Promise<void>;
  signUpWithEmail: (name: string, email: string) => Promise<void>;
  signInWithGoogle: (googleUser: { name: string; email: string; avatar?: string }) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

async function getUsers(): Promise<UsersRegistry> {
  const data = await AsyncStorage.getItem(USERS_KEY);
  return data ? JSON.parse(data) : {};
}

async function saveUsers(users: UsersRegistry): Promise<void> {
  await AsyncStorage.setItem(USERS_KEY, JSON.stringify(users));
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    AsyncStorage.getItem(AUTH_KEY).then(data => {
      if (data) setUser(JSON.parse(data));
      setIsLoading(false);
    });
  }, []);

  const signInWithEmail = useCallback(async (email: string) => {
    const normalizedEmail = email.trim().toLowerCase();
    const users = await getUsers();
    const existing = users[normalizedEmail];
    if (!existing) {
      throw new Error('No account found with this email. Please sign up first.');
    }
    await AsyncStorage.setItem(AUTH_KEY, JSON.stringify(existing));
    setUser(existing);
  }, []);

  const signUpWithEmail = useCallback(async (name: string, email: string) => {
    const normalizedEmail = email.trim().toLowerCase();
    const users = await getUsers();
    if (users[normalizedEmail]) {
      throw new Error('An account with this email already exists. Please sign in instead.');
    }
    const newUser: User = {
      id: `email_${Date.now()}`,
      name: name.trim(),
      email: normalizedEmail,
      provider: 'email',
      createdAt: new Date().toISOString(),
    };
    users[normalizedEmail] = newUser;
    await saveUsers(users);
    await AsyncStorage.setItem(AUTH_KEY, JSON.stringify(newUser));
    setUser(newUser);
  }, []);

  const signInWithGoogle = useCallback(async (googleUser: { name: string; email: string; avatar?: string }) => {
    const normalizedEmail = googleUser.email.trim().toLowerCase();
    const users = await getUsers();
    let resolvedUser: User;
    if (users[normalizedEmail]) {
      resolvedUser = users[normalizedEmail];
    } else {
      resolvedUser = {
        id: `google_${Date.now()}`,
        name: googleUser.name,
        email: normalizedEmail,
        avatar: googleUser.avatar,
        provider: 'google',
        createdAt: new Date().toISOString(),
      };
      users[normalizedEmail] = resolvedUser;
      await saveUsers(users);
    }
    await AsyncStorage.setItem(AUTH_KEY, JSON.stringify(resolvedUser));
    setUser(resolvedUser);
  }, []);

  const signOut = useCallback(async () => {
    await AsyncStorage.removeItem(AUTH_KEY);
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, isLoading, signInWithEmail, signUpWithEmail, signInWithGoogle, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
