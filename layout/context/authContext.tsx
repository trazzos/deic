import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import http from '@/src/lib/axios';


interface AuthContextProps {
    user: any;
    isAuthenticated:boolean,
    loading: boolean;
    login: (email: string, password: string) => Promise<void>;
    logout: () => Promise<void>;
    checkAuth: () => Promise<void>;
}

const AuthContext = createContext<AuthContextProps | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
    const [user, setUser] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        checkAuth();
    }, []);

    const isAuthenticated = useMemo(() => !!user, [user]);

    const login = async (email: string, password: string) => {
        setLoading(true);
        try {
           
            await http.get(`/sanctum/csrf-cookie`);
            const res:any = await http.post(`/api/auth/login`, {
                email,
                password
            });
        
            if(res)
                setUser(res.user)
            
            setLoading(false);       
        } catch (error) {
            console.error('Login error:', error);
            setLoading(false);
            throw error;
        }
        
    };

   
    const logout = async () => {

        setLoading(true);
        await http.post(`/api/auth/logout`);
        setUser(null);
        setLoading(false);
    };

    
    const checkAuth = async () => {
        setLoading(true);
        try {

            const res = await http.get(`/api/auth/profile`);
            setUser(res);

        } catch (error) {

            setUser(null);
        }
        setLoading(false);
    };

    return (
        <AuthContext.Provider value={{ user, isAuthenticated, loading, login, logout, checkAuth }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) throw new Error('useAuth must be used within AuthProvider');
    return context;
};