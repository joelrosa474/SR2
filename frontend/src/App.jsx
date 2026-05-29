import { BrowserRouter as Router, Link } from 'react-router-dom';
import { AuthProvider, useAuth } from './hooks/useAuth';
import { RotasApp } from './rotas';
import { Toaster } from 'react-hot-toast';
import './estilos/global.css';

const Navbar = () => {
  const { usuario, logout } = useAuth();

  return (
    <nav className="glass navbar-app">
      <div className="brand-font navbar-app__marca">
        Hotel Fiesta
      </div>
      <ul className="navbar-app__links">
        <li><Link to="/quartos">Quartos</Link></li>
        {usuario && (
          <>
            <li>
              <Link to="/reservas">
                {usuario.tipo === 'cliente' ? 'Minhas Reservas' : 'Reservas'}
              </Link>
            </li>
            {usuario.tipo === 'administrador' && (
              <li><Link to="/admin" className="navbar-app__destaque">Dashboard</Link></li>
            )}
            <li>
              <button onClick={logout} className="btn-primary navbar-app__acao">Sair</button>
            </li>
          </>
        )}
        {!usuario && <li><Link to="/login" className="btn-primary navbar-app__acao">Entrar</Link></li>}
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
