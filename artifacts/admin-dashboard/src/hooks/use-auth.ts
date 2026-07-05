import { useState, useEffect } from "react";
import { useLocation } from "wouter";

export function useAuth() {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem("admin_token"));
  const [, setLocation] = useLocation();

  useEffect(() => {
    const storedToken = localStorage.getItem("admin_token");
    if (!storedToken) {
      setLocation("/login");
    }
    setToken(storedToken);
  }, [setLocation]);

  const login = (newToken: string) => {
    localStorage.setItem("admin_token", newToken);
    setToken(newToken);
  };

  const logout = () => {
    localStorage.removeItem("admin_token");
    setToken(null);
    setLocation("/login");
  };

  return { token, login, logout };
}
