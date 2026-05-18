import { createContext, useContext, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../utils/api";

export const AuthContext = createContext({});

export const AuthProvider = ({ children }) => {
  const [userData, setUserData] = useState(null);

  /**
   * isLoading prevents flashing the login screen before we've checked
   * if a saved session token is still valid on app mount.
   */
  const [isLoading, setIsLoading] = useState(true);

  const router = useNavigate();

  /**
   * On every app load, try to restore the user session silently.
   * If the stored token is invalid/expired, clear it and stay on current page.
   *
   * SECURITY NOTE: token is stored in localStorage (XSS tradeoff — see api.js).
   * A production hardening would move this to an httpOnly cookie.
   */
  useEffect(() => {
    const initializeAuth = async () => {
      const token = localStorage.getItem("token");
      if (!token) {
        setIsLoading(false);
        return;
      }
      try {
        const response = await api.get("/profile", { params: { token } });
        setUserData(response.data);
      } catch {
        // Token invalid or expired — clear silently
        localStorage.removeItem("token");
      } finally {
        setIsLoading(false);
      }
    };
    initializeAuth();
  }, []);

  const handleRegister = async (name, username, email, password) => {
    try {
      const request = await api.post("/register", { name, username, email, password });
      if (request.status === 201) {
        return request.data.message;
      }
    } catch (err) {
      throw err;
    }
  };

  const handleLogin = async (email, password) => {
    try {
      const request = await api.post("/login", { email, password });
      if (request.status === 200) {
        // Store session token — used to authenticate subsequent requests
        localStorage.setItem("token", request.data.token);
        // Fetch and cache user data immediately after login
        const profileRes = await api.get("/profile", {
          params: { token: request.data.token },
        });
        setUserData(profileRes.data);
        router("/home");
      }
    } catch (err) {
      throw err;
    }
  };

  const handleTokenLogin = async (token) => {
    try {
      localStorage.setItem("token", token);
      const profileRes = await api.get("/profile", {
        params: { token },
      });
      setUserData(profileRes.data);
      router("/home");
    } catch (err) {
      throw err;
    }
  };

  const getHistoryOfUser = async () => {
    try {
      const request = await api.get("/get_all_activity", {
        params: { token: localStorage.getItem("token") },
      });
      return request.data;
    } catch (err) {
      throw err;
    }
  };

  const addToUserHistory = async (meetingCode) => {
    try {
      const request = await api.post("/add_to_activity", {
        token: localStorage.getItem("token"),
        meeting_code: meetingCode,
      });
      return request;
    } catch (e) {
      throw e;
    }
  };

  const deleteFromUserHistory = async (meetingCode) => {
    try {
      const request = await api.delete("/delete_from_activity", {
        params: {
          token: localStorage.getItem("token"),
          meeting_code: meetingCode,
        }
      });
      return request;
    } catch (e) {
      throw e;
    }
  };

  const getProfile = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) throw new Error("No token found");
      const response = await api.get("/profile", { params: { token } });
      if (response.status === 200) {
        setUserData(response.data);
        return response.data;
      }
    } catch (err) {
      throw err;
    }
  };

  const logout = async () => {
    try {
      const token = localStorage.getItem("token");
      if (token) {
        await api.post("/logout", { token });
      }
    } catch {
      // Ignore logout API errors — always clear local state
    } finally {
      localStorage.removeItem("token");
      setUserData(null);
      router("/auth");
    }
  };

  const data = {
    userData,
    setUserData,
    isLoading,
    addToUserHistory,
    getHistoryOfUser,
    deleteFromUserHistory,
    handleRegister,
    handleLogin,
    handleTokenLogin,
    getProfile,
    logout,
  };

  return <AuthContext.Provider value={data}>{children}</AuthContext.Provider>;
};
