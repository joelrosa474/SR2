import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { PaginaLogin } from '../paginas/PaginaLogin';
import { PaginaQuartos } from '../paginas/PaginaQuartos';
import { PaginaGaleriaHotel } from '../paginas/PaginaGaleriaHotel';
import { PaginaAdmin } from '../paginas/PaginaAdmin';
import { PaginaReservas } from '../paginas/PaginaReservas';

const RotaPrivada = ({ children, tiposPermitidos }) => {
    const { usuario, carregando } = useAuth();

    if (carregando) return <div className="container">Carregando...</div>;
    if (!usuario) return <Navigate to="/login" />;
    if (tiposPermitidos && !tiposPermitidos.includes(usuario.tipo)) {
        return <Navigate to="/" />;
    }

    return children;
};

export const RotasApp = () => {
    return (
        <Routes>
            <Route path="/login" element={<PaginaLogin />} />
            <Route path="/quartos" element={<PaginaQuartos />} />
            <Route path="/galeria" element={<PaginaGaleriaHotel />} />
            
            <Route path="/admin" element={
                <RotaPrivada tiposPermitidos={['administrador']}>
                    <PaginaAdmin />
                </RotaPrivada>
            } />
            
            <Route path="/reservas" element={
                <RotaPrivada tiposPermitidos={['administrador', 'funcionario', 'cliente']}>
                    <PaginaReservas />
                </RotaPrivada>
            } />

            <Route path="/" element={<Navigate to="/quartos" />} />
        </Routes>
    );
};
