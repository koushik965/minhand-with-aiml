import React, { createContext, useContext, useReducer, useEffect, useCallback } from 'react';
import { authAPI } from '../services/api';

const AuthContext = createContext(null);

const reducer = (state, action) => {
  switch (action.type) {
    case 'LOGIN': return { ...state, user: action.user, token: action.token, loading: false, error: null };
    case 'LOGOUT': return { ...state, user: null, token: null, loading: false };
    case 'LOADING': return { ...state, loading: action.val };
    case 'ERROR': return { ...state, error: action.msg, loading: false };
    default: return state;
  }
};

export const AuthProvider = ({ children }) => {
  const [state, dispatch] = useReducer(reducer, {
    user: JSON.parse(localStorage.getItem('mh_user') || 'null'),
    token: localStorage.getItem('mh_token') || null,
    loading: false,
    error: null,
  });

  useEffect(() => {
    if (state.token && state.user) {
      localStorage.setItem('mh_token', state.token);
      const safe = { id: state.user.id, username: state.user.username, email: state.user.email, role: state.user.role };
      localStorage.setItem('mh_user', JSON.stringify(safe));
    } else {
      localStorage.removeItem('mh_token');
      localStorage.removeItem('mh_user');
    }
  }, [state.token, state.user]);

  const login = useCallback(async (email, password) => {
  console.log("🔥 AUTH LOGIN CALLED");

  dispatch({ type: 'LOADING', val: true });

  try {
    const res = await authAPI.login({ email, password });

    console.log("🔥 API RESPONSE:", res);

    dispatch({ type: 'LOGIN', user: res.data.user, token: res.data.token });

    return { success: true };
  } catch (err) {
    console.log("❌ LOGIN ERROR:", err);

    const msg = err.response?.data?.message || 'Login failed.';
    dispatch({ type: 'ERROR', msg });

    return { success: false, message: msg };
  }
}, []);

  const register = useCallback(async (username, email, password) => {
    dispatch({ type: 'LOADING', val: true });
    try {
      const res = await authAPI.register({ username, email, password });
      dispatch({ type: 'LOGIN', user: res.data.user, token: res.data.token });
      return { success: true };
    } catch (err) {
      const msg = err.response?.data?.message || 'Registration failed.';
      dispatch({ type: 'ERROR', msg });
      return { success: false, message: msg };
    }
  }, []);

  const logout = useCallback(() => dispatch({ type: 'LOGOUT' }), []);

  return <AuthContext.Provider value={{ ...state, login, register, logout }}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be inside AuthProvider');
  return ctx;
};
