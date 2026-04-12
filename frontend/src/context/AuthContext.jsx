import { createContext, useState, useContext, useEffect, useCallback } from 'react';
import api from '../api/client';

const AuthContext = createContext();
const STORAGE_KEY = 'token';

// Cookie Helper Functions
const setCookie = (name, value, days) => {
    let expires = "";
    if (days) {
        const date = new Date();
        date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
        expires = "; expires=" + date.toUTCString();
    }
    const secure = window.location.protocol === 'https:' ? "; Secure" : "";
    document.cookie = name + "=" + (value || "") + expires + "; path=/; SameSite=Lax" + secure;
};

const getCookie = (name) => {
    const nameEQ = name + "=";
    const ca = document.cookie.split(';');
    for (let i = 0; i < ca.length; i++) {
        let c = ca[i];
        while (c.charAt(0) === ' ') c = c.substring(1, c.length);
        if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length, c.length);
    }
    return null;
};

const deleteCookie = (name) => {
    document.cookie = name + '=; Max-Age=-99999999; path=/;';
};

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(() => {
        // 1. Check Cookie (Primary for 24h persistence)
        const cookieToken = getCookie(STORAGE_KEY);
        if (cookieToken) return cookieToken;

        // 2. Fallback to sessionStorage (Legacy session-based)
        const sessionToken = sessionStorage.getItem(STORAGE_KEY);
        if (sessionToken) {
            setCookie(STORAGE_KEY, sessionToken, 1); // Migrate to cookie
            return sessionToken;
        }

        // 3. Fallback to localStorage (Legacy legacy)
        const legacyToken = localStorage.getItem('token');
        if (legacyToken) {
            setCookie(STORAGE_KEY, legacyToken, 1);
            localStorage.removeItem('token');
            return legacyToken;
        }
        return null;
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Initial check
        const initjs = async () => {
            if (token) {
                api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
                try {
                    const res = await api.get('/users/get-profile');
                    if (res.data.success || res.data.status) {
                        setUser(res.data.user);
                    }
                } catch (err) {
                    console.log("Error fetching profile:", err);
                    if (err.response?.status === 401 || err.response?.status === 400) {
                        deleteCookie(STORAGE_KEY);
                        sessionStorage.removeItem(STORAGE_KEY);
                        setToken(null);
                        setUser(null);
                        delete api.defaults.headers.common['Authorization'];
                    }
                }
            } else {
                delete api.defaults.headers.common['Authorization'];
                setUser(null);
            }
            setLoading(false);
        };
        initjs();
    }, [token]);

    const login = async (email, password) => {
        try {
            const res = await api.post('/users/login', { email, password });
            if (!res.data?.token || res.data?.status === false || res.data?.success === false) {
                return { success: false, msg: res.data?.message || "Login failed. Check credentials." };
            }
            setCookie(STORAGE_KEY, res.data.token, 1); // Persist for 1 day (24h)
            setToken(res.data.token);
            setUser(res.data.user);
            return { success: true };
        } catch (err) {
            console.warn("Backend login failed.");
            return {
                success: false,
                msg: err.response?.data?.message || "Login failed. Check credentials."
            };
        }
    };

    const register = async (name, email, password) => {
        try {
            await api.post('/users/register', { name, email, password });
            return { success: true, msg: 'Registration successful. Please login.' };
        } catch (err) {
            console.warn("Backend registration failed.");
            return { success: false, msg: err.response?.data?.message || "Registration failed. Try again." };
        }
    };

    const logout = () => {
        deleteCookie(STORAGE_KEY);
        sessionStorage.removeItem(STORAGE_KEY);
        localStorage.removeItem('docuverse_enterpriseForm'); // Clear saved form data
        setToken(null);
        setUser(null);
        delete api.defaults.headers.common['Authorization'];
    };

    const updateProfile = async (data) => {
        try {
            const res = await api.put('/users/update-profile', data);
            if (res.data.status || res.data.success) {
                setUser({ ...user, ...res.data.user });
                return { success: true, msg: "Profile updated successfully" };
            }
            return { success: false, msg: res.data.message || "Update failed" };
        } catch (err) {
            console.error("Profile update error", err);
            const detail = err.response?.data?.detail;
            const message = err.response?.data?.message || "Update failed";
            return { success: false, msg: detail ? `${message}: ${detail}` : message };
        }
    };

    const requestPasswordOTP = async () => {
        try {
            const res = await api.post('/users/request-password-otp');
            return { success: res.data.status, msg: res.data.message };
        } catch (err) {
            const detail = err.response?.data?.detail;
            const message = err.response?.data?.message || "Failed to send code";
            return { success: false, msg: detail ? `${message}: ${detail}` : message };
        }
    };

    const verifyPasswordOTP = async (otp, newPassword) => {
        try {
            const res = await api.post('/users/verify-password-otp', { otp, newPassword });
            return { success: res.data.status, msg: res.data.message };
        } catch (err) {
            return { success: false, msg: err.response?.data?.message || "Verification failed" };
        }
    };

    const handleGoogleCallback = useCallback(({ token: googleToken, user: googleUser }) => {
        if (googleToken) {
            setCookie(STORAGE_KEY, googleToken, 1);
            setToken(googleToken);
            setUser(googleUser);
            api.defaults.headers.common['Authorization'] = `Bearer ${googleToken}`;
        }
    }, []);

    return (
        <AuthContext.Provider value={{ user, token, loading, login, register, logout, updateProfile, requestPasswordOTP, verifyPasswordOTP, handleGoogleCallback }}>
            {children}
        </AuthContext.Provider>
    );
};
