import { BrowserRouter as Router, Link } from 'react-router-dom';
import { AuthProvider, useAuth } from './hooks/useAuth';
import { RotasApp } from './rotas';
import { Toaster } from 'react-hot-toast';
import './estilos/global.css';

const Navbar = () => {
  const { usuario, logout } = useAuth();

  return (
    <nav className="glass" style={{ 
      display: 'flex', 
      justifyContent: 'space-between', 
      alignItems: 'center', 
      padding: '1rem 5%', 
      position: 'sticky', 
      top: 0, 
      zIndex: 1000,
      background: 'white',
      boxShadow: '0 2px 10px rgba(0,0,0,0.05)'
    }}>
      <div className="brand-font" style={{ fontSize: '1.8rem', color: 'var(--primary)', fontWeight: 'bold' }}>
        Hotel Fiesta
      </div>
      <ul style={{ display: 'flex', listStyle: 'none', gap: '2rem', alignItems: 'center' }}>
        <li><Link to="/quartos" style={{ color: 'var(--text-main)', textDecoration: 'none', fontWeight: '500' }}>Quartos</Link></li>
        {usuario && (
          <>
            <li>
              <Link to="/reservas" style={{ color: 'var(--text-main)', textDecoration: 'none', fontWeight: '500' }}>
                {usuario.tipo === 'cliente' ? 'Minhas Reservas' : 'Reservas'}
              </Link>
            </li>
            {usuario.tipo === 'administrador' && (
              <li><Link to="/admin" style={{ color: 'var(--primary)', textDecoration: 'none', fontWeight: 'bold' }}>Dashboard</Link></li>
            )}
            <li>
              <button onClick={logout} className="btn-primary" style={{ padding: '8px 16px' }}>Sair</button>
            </li>
          </>
        )}
        {!usuario && <li><Link to="/login" className="btn-primary" style={{ textDecoration: 'none' }}>Entrar</Link></li>}
      </ul>
    </nav>
  );
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <Navbar />
        <RotasApp />
        <Toaster position="top-right" />
      </Router>
    </AuthProvider>
  );
}

export default App;
