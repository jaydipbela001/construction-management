import { createContext, useCallback, useEffect, useMemo, useState } from 'react';
import authService from '../services/authService';
import { clearToken, getToken, setUnauthorizedHandler } from '../services/api';

export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [admin, setAdmin] = useState(null);
  const [initializing, setInitializing] = useState(true);

  useEffect(() => {
    setUnauthorizedHandler(() => {
      clearToken();
      setAdmin(null);
    });

    let active = true;
    async function restore() {
      if (!getToken()) {
        setInitializing(false);
        return;
      }
      try {
        const me = await authService.me();
        if (active) setAdmin(me);
      } catch {
        clearToken();
        if (active) setAdmin(null);
      } finally {
        if (active) setInitializing(false);
      }
    }
    restore();
    return () => {
      active = false;
    };
  }, []);

  const login = useCallback(async (email, password) => {
    const loggedIn = await authService.login(email, password);
    setAdmin(loggedIn);
    return loggedIn;
  }, []);

  const logout = useCallback(async () => {
    await authService.logout();
    setAdmin(null);
  }, []);

  const value = useMemo(
    () => ({ admin, initializing, isAuthenticated: Boolean(admin), login, logout }),
    [admin, initializing, login, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
