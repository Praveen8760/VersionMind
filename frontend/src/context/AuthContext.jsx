import { createContext, useContext, useEffect, useState } from "react";
import axios from "axios";

const AuthContext = createContext();

// Configure axios globally
axios.defaults.baseURL = "http://localhost:3000";
axios.defaults.withCredentials = true;

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Load logged-in user
  const fetchUser = async () => {
    try {
      const res = await axios.get("/auth/me");
      setUser(res.data.user);
    } catch (err) {
      setUser(null);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchUser();
  }, []);

  // Logout
  const logout = async () => {
    try {
      await axios.get("/auth/logout");
      setUser(null);
    } catch (err) {}
  };

  return (
    <AuthContext.Provider value={{ user, loading, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom Hook
export const useAuth = () => useContext(AuthContext);
