import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { apiServico } from '../servicos/api';

export const PaginaLogin = () => {
    const [email, setEmail] = useState('');
    const [senha, setSenha] = useState('');
    const [nome, setNome] = useState('');
    const [telefone, setTelefone] = useState('');
    const [modoCadastro, setModoCadastro] = useState(false);
    const [erro, setErro] = useState('');
    const { login } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setErro('');
        try {
            if (modoCadastro) {
                await apiServico.registrar({
                    nome,
                    email,
                    telefone,
                    senha,
                    tipo: 'cliente',
                    status: 'ativo',
                });
            }

            const user = await login(email, senha);
            if (user.tipo === 'administrador') navigate('/admin');
            else if (user.tipo === 'funcionario') navigate('/reservas');
            else navigate('/quartos');
        } catch (err) {
            setErro(err.message);
        }
    };

    return (
        <div className="pagina-login" style={{ 
            display: 'flex', 
            justifyContent: 'center', 
            alignItems: 'center', 
            minHeight: 'calc(100vh - 80px)',
            background: 'white',
            color: 'var(--text-main)'
        }}>
            <div className="card-fiesta pagina-login__cartao" style={{ 
                width: '100%',
                maxWidth: '450px', 
                padding: '48px',
                textAlign: 'center',
                background: 'white'
            }}>
                <div className="brand-font" style={{ fontSize: '3rem', color: 'var(--primary)', marginBottom: '8px' }}>
                    HF
                </div>
                <h1 className="brand-font" style={{ fontSize: '2rem', marginBottom: '40px', color: 'var(--text-main)' }}>
                    Hotel Fiesta
                </h1>
                
                {erro && (
                    <div style={{ 
                        background: 'rgba(239, 68, 68, 0.05)', 
                        color: '#ef4444', 
                        padding: '12px', 
                        borderRadius: '6px', 
                        marginBottom: '24px',
                        fontSize: '0.9rem',
                        border: '1px solid rgba(239, 68, 68, 0.2)'
                    }}>
                        {erro}
                    </div>
                )}

                <form onSubmit={handleSubmit} style={{ textAlign: 'left' }}>
                    {modoCadastro && (
                        <>
                            <div style={{ marginBottom: '20px' }}>
                                <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: '600', textTransform: 'uppercase' }}>
                                    Nome completo
                                </label>
                                <input
                                    type="text"
                                    placeholder="O seu nome"
                                    value={nome}
                                    onChange={e => setNome(e.target.value)}
                                    required={modoCadastro}
                                />
                            </div>

                            <div style={{ marginBottom: '20px' }}>
                                <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: '600', textTransform: 'uppercase' }}>
                                    Telefone
                                </label>
                                <input
                                    type="tel"
                                    placeholder="Contacto"
                                    value={telefone}
                                    onChange={e => setTelefone(e.target.value)}
                                />
                            </div>
                        </>
                    )}

                    <div style={{ marginBottom: '20px' }}>
                        <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: '600', textTransform: 'uppercase' }}>
                            {modoCadastro ? 'Email' : 'Email Institucional'}
                        </label>
                        <input 
                            type="email" 
                            placeholder={modoCadastro ? 'cliente@email.com' : 'admin@hotel.com'}
                            value={email} 
                            onChange={e => setEmail(e.target.value)} 
                            required 
                        />
                    </div>
                    
                    <div style={{ marginBottom: '32px' }}>
                        <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: '600', textTransform: 'uppercase' }}>
                            Palavra-passe
                        </label>
                        <input 
                            type="password" 
                            placeholder="••••••••"
                            value={senha} 
                            onChange={e => setSenha(e.target.value)} 
                            required 
                        />
                    </div>

                    <button type="submit" className="btn-primary" style={{ width: '100%', padding: '16px' }}>
                        {modoCadastro ? 'CRIAR CONTA E ENTRAR' : 'ENTRAR NO SISTEMA'}
                    </button>
                </form>

                <button
                    type="button"
                    onClick={() => { setModoCadastro(!modoCadastro); setErro(''); }}
                    style={{ marginTop: '18px', background: 'transparent', border: 'none', color: 'var(--primary)', cursor: 'pointer', fontWeight: '600' }}
                >
                    {modoCadastro ? 'Ja tenho conta' : 'Criar conta de cliente'}
                </button>

                <p style={{ marginTop: '32px', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                    Acesso restrito. © Hotel Fiesta
                </p>
            </div>
        </div>
    );
};
