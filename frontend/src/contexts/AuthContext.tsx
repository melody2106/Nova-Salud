import React, { createContext, useContext, useEffect, useState } from 'react';
import { loginApi } from '../services/api.ts';

export interface User {
  id_usuario: number;
  username: string;
  nombres: string;
  apellidos: string;
  nombre_cargo: string; // 'Administrador' | 'Vendedor' | 'Almacenero'
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Restaurar sesión desde localStorage
    const savedData = localStorage.getItem('user');
    if (savedData) {
      try {
        const parsed = JSON.parse(savedData);
        if (parsed?.user) {
          const u = parsed.user;
          setUser({
            id_usuario:   Number(u.id_usuario),
            username:     String(u.username),
            nombres:      String(u.nombres),
            apellidos:    String(u.apellidos),
            nombre_cargo: String(u.nombre_cargo ?? u.cargo ?? ''),
          });
        }
      } catch {
        localStorage.removeItem('user');
      }
    }
    setIsLoading(false);
  }, []);

  const login = async (username: string, password: string) => {
    const response = await loginApi({ username, password });

    if (!response.success || !response.data) {
      throw new Error(response.message || 'Credenciales inválidas');
    }

    const { token, user: backendUser } = response.data;

    localStorage.setItem('user', JSON.stringify({ token, user: backendUser }));

    setUser({
      id_usuario:   Number(backendUser.id_usuario),
      username:     String(backendUser.username),
      nombres:      String(backendUser.nombres),
      apellidos:    String(backendUser.apellidos),
      nombre_cargo: String(backendUser.nombre_cargo ?? backendUser.cargo ?? ''),
    });
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('user');
  };

  return (
    <AuthContext.Provider
      value={{ user, isAuthenticated: !!user, isLoading, login, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};