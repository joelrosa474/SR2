import { useState, useEffect, createContext, useContext } from 'react';
import { apiServico } from '../servicos/api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [usuario, setUsuario] = useState(null);
    const [carregando, setCarregando] = useState(true);

    useEffect(() => {
        const carregarUsuario = async () => {
            try {
                const usuarioAtual = await apiServico.me();
                setUsuario(usuarioAtual);
            } catch {
                setUsuario(null);
            } finally {
                setCarregando(false);
            }
        };

        carregarUsuario();
    }, []);

    const login = async (email, senha) => {
        await apiServico.login(email, senha);
        const user = await apiServico.me();
        setUsuario(user);
        return user;
    };

    const logout = async () => {
        try {
            await apiServico.logout();
        } finally {
            setUsuario(null);
            window.location.href = '/quartos';
        }
    };

    return (
        <AuthContext.Provider value={{ usuario, login, logout, carregando }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
