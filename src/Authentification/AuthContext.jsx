import { createContext, useContext, useEffect, useState } from "react";
import PropTypes from "prop-types";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [userName, setUserName] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem("token");
    const role = localStorage.getItem("role");
    const storedName = localStorage.getItem("userName");

    // Debugging: Check what's retrieved from localStorage
    console.log("AuthProvider useEffect - token:", token, "role:", role, "userName:", storedName);

    if (token && role && storedName) {
      setUser({ token, role, name: storedName });
      setUserName(storedName);
    } else {
      setUser(null);
      setUserName(null);
    }

    setLoading(false);
  }, []);

  const login = (token, role, name) => {
    // Debugging: Check login parameters
    console.log("Login - token:", token, "role:", role, "name:", name);

    localStorage.setItem("token", token);
    localStorage.setItem("role", role);
    localStorage.setItem("userName", name);
    setUser({ token, role, name });
    setUserName(name);
  };

  const logout = () => {
    localStorage.clear();
    setUser(null);
    setUserName(null);
  };

  const isAuthenticated = !!user?.token;

  return (
    <AuthContext.Provider value={{ user, login, logout, isAuthenticated, loading, userName }}>
      {children}
    </AuthContext.Provider>
  );
};

AuthProvider.propTypes = {
  children: PropTypes.node.isRequired,
};

export const useAuth = () => useContext(AuthContext);