"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";

export type AuthUser = {
  id: string;
  name: string;
  email: string;
  createdAt: string;
};

type AuthContextType = {
  user: AuthUser | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<string | null>;
  signup: (name: string, email: string, password: string) => Promise<string | null>;
  logout: () => void;
};

const AuthContext = createContext<AuthContextType | null>(null);

const USERS_KEY = "prism_users";
const SESSION_KEY = "prism_session";

function getUsers(): Record<string, { user: AuthUser; passwordHash: string }> {
  try {
    return JSON.parse(localStorage.getItem(USERS_KEY) || "{}");
  } catch {
    return {};
  }
}

// Lightweight string hash — good enough for demo; not for production
function hashPassword(password: string): string {
  let h = 5381;
  for (let i = 0; i < password.length; i++) {
    h = (h * 33) ^ password.charCodeAt(i);
  }
  return (h >>> 0).toString(36);
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    try {
      const session = localStorage.getItem(SESSION_KEY);
      if (session) {
        setUser(JSON.parse(session));
      }
    } catch {
      // ignore
    } finally {
      setIsLoading(false);
    }
  }, []);

  const login = useCallback(async (email: string, password: string): Promise<string | null> => {
    const users = getUsers();
    const record = users[email.toLowerCase()];
    if (!record) return "No account found with this email.";
    if (record.passwordHash !== hashPassword(password)) return "Incorrect password.";
    setUser(record.user);
    localStorage.setItem(SESSION_KEY, JSON.stringify(record.user));
    return null;
  }, []);

  const signup = useCallback(async (name: string, email: string, password: string): Promise<string | null> => {
    if (!name.trim()) return "Name is required.";
    if (!email.includes("@")) return "Enter a valid email address.";
    if (password.length < 6) return "Password must be at least 6 characters.";

    const users = getUsers();
    const key = email.toLowerCase();
    if (users[key]) return "An account with this email already exists.";

    const newUser: AuthUser = {
      id: crypto.randomUUID(),
      name: name.trim(),
      email: key,
      createdAt: new Date().toISOString(),
    };
    users[key] = { user: newUser, passwordHash: hashPassword(password) };
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
    setUser(newUser);
    localStorage.setItem(SESSION_KEY, JSON.stringify(newUser));
    return null;
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    localStorage.removeItem(SESSION_KEY);
  }, []);

  return (
    <AuthContext.Provider value={{ user, isLoading, login, signup, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}
