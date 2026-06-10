import { BrowserRouter as Router, Link } from 'react-router-dom';
import { AuthProvider, useAuth } from './hooks/useAuth';
import { RotasApp } from './rotas';
import { Toaster } from 'react-hot-toast';
import { BarraProgressoServidor } from './components/BarraProgressoServidor';
import { MensagemCentral } from './components/MensagemCentral';
import logoHotel from './assets/IMG/logo1.jpeg';
import './estilos/global.css';

const Navbar = () => {
  const { usuario, logout } = useAuth();

  return (
    <nav className="glass navbar-app">
      <Link to="/quartos" className="navbar-app__marca" aria-label="Hotel Fiesta">
        <img src={logoHotel} alt="Logo do Hotel Fiesta" className="navbar-app__logo" />
        <span className="brand-font">Hotel Fiesta</span>
      </Link>
      <ul className="navbar-app__links">
        <li><Link to="/galeria">Página Inicial</Link></li>
        <li><Link to="/quartos">Reservas de quartos</Link></li>
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
        <BarraProgressoServidor />
        <Navbar />
        <RotasApp />
        <Toaster position="top-right" />
        <MensagemCentral />
      </Router>
    </AuthProvider>
  );
}

export default App;
