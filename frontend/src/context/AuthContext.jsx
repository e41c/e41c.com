import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from 'react';
import * as api from '../lib/api.js';

const AuthContext = createContext(null);

// Wraps the app and tracks the signed-in user. On load it asks the API "who am
// I?" (the cookie answers), so a returning visitor stays logged in.
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      setUser(await api.fetchMe());
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const login = async (creds) => {
    const u = await api.login(creds);
    setUser(u);
    return u;
  };
  const signup = async (body) => {
    const u = await api.signup(body);
    setUser(u);
    return u;
  };
  const logout = async () => {
    await api.logout();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, signup, logout, refresh }}>
      {children}
    </AuthContext.Provider>
  );
}

// Convenience hook so components just call useAuth().
export function useAuth() {
  return useContext(AuthContext);
}
