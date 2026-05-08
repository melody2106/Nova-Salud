import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

interface LoginResponse {
  success: boolean;
  data: {
    token: string;
    user: any;
  };
}

interface User {
  id_usuario: number;
  username: string;
  nombres: string;
  apellidos: string;
  cargo: string;
}

export const authService = {
  login: async (credentials: { username: string; password: string }) => {
    const response = await axios.post<LoginResponse>(`${API_URL}/auth/login`, credentials);
    if (response.data.success) {
      localStorage.setItem('user', JSON.stringify(response.data.data));
    }
    return response.data;
  },

  logout: () => {
    localStorage.removeItem('user');
  },

  getCurrentUser: (): { user: User; token: string } | null => {
    const data = localStorage.getItem('user');
    return data ? JSON.parse(data) : null;
  },
};
