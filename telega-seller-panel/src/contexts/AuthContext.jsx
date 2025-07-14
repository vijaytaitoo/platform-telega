import { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Проверяем токен в localStorage при загрузке
    const token = localStorage.getItem('auth_token');
    if (token) {
      // В реальном приложении здесь должна быть проверка токена на сервере
      // Пока что используем mock данные
      setUser({
        id: '1',
        name: 'Продавец',
        email: 'seller@example.com',
        role: 'seller',
        avatar: null
      });
    }
    setLoading(false);
  }, []);

  const login = async (credentials) => {
    try {
      // Mock login - в реальном приложении здесь будет запрос к API
      if (credentials.email === 'seller@example.com' && credentials.password === 'password') {
        const mockUser = {
          id: '1',
          name: 'Продавец',
          email: 'seller@example.com',
          role: 'seller',
          avatar: null
        };
        
        setUser(mockUser);
        localStorage.setItem('auth_token', 'mock_token_123');
        return { success: true, user: mockUser };
      } else {
        throw new Error('Неверные учетные данные');
      }
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('auth_token');
  };

  const value = {
    user,
    login,
    logout,
    loading
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

