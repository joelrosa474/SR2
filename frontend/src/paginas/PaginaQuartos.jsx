import { useState, useEffect } from 'react';
import { apiServico } from '../servicos/api';
import { useAuth } from '../hooks/useAuth';
import { ModalReserva } from '../components/ModalReserva';
import toast from 'react-hot-toast';
import heroFallback from '../assets/hero.png';
import 'react-lazy-load-image-component/src/effects/blur.css';

const imagensHotel = Object.values(
    import.meta.glob('../assets/IMG/*.{jpg,jpeg,png,webp}', {
        eager: true,
        import: 'default',
    })
);

const obterImagemQuarto = (quarto, index) => {
    const imagemCadastrada = quarto.imagem_url?.trim();
    if (
        imagemCadastrada &&
        (imagemCadastrada.startsWith('http') || imagemCadastrada.startsWith('/') || imagemCadastrada.startsWith('data:'))
    ) {
        return imagemCadastrada;
    }

    if (imagensHotel.length === 0) return heroFallback;
    return imagensHotel[index % imagensHotel.length];
};

export const PaginaQuartos = () => {
    const [quartos, setQuartos] = useState([]);
    const [carregando, setCarregando] = useState(true);
    const [modalAberto, setModalAberto] = useState(false);
    const [quartoSelecionado, setQuartoSelecionado] = useState(null);
    const { usuario } = useAuth();

    useEffect(() => {
        carregarQuartos();
    }, []);

    const carregarQuartos = async () => {
        try {
            const data = await apiServico.listarQuartos();
            setQuartos(data);
        } catch (err) {
            console.error(err);
        } finally {
            setCarregando(false);
        }
    };

    const reservar = async (dados) => {
        await apiServico.realizarReserva(dados);
        carregarQuartos();
    };

    const abrirModalReserva = (quarto) => {
        if (!usuario) {
            toast.error('Por favor, entre no sistema para realizar uma reserva.');
            return;
        }

        if (usuario.tipo !== 'cliente') {
            toast.error('Apenas clientes podem realizar reservas por esta pagina.');
            return;
        }

        setQuartoSelecionado(quarto);
        setModalAberto(true);
    };

    if (carregando) return <div style={{ textAlign: 'center', padding: '100px', color: 'var(--text-main)' }}>Preparando as suítes...</div>;

    return (
        <div style={{ padding: '60px 5%', background: 'white', color: 'var(--text-main)', minHeight: '100vh' }}>
            <div style={{ textAlign: 'center', marginBottom: '60px' }}>
                <h1 className="brand-font" style={{ fontSize: '3.5rem', color: 'var(--text-main)', marginBottom: '16px' }}>Nossas Suítes</h1>
                <p style={{ color: 'var(--text-muted)', maxWidth: '600px', margin: '0 auto', fontSize: '1.1rem' }}>
                    Escolha a experiência perfeita para a sua estadia no Hotel Fiesta. 
                    Do conforto executivo ao luxo absoluto das nossas suítes VIP.
                </p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '40px' }}>
                {quartos.map((quarto, index) => (
                    <div key={quarto.id} className="card-fiesta" style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden', padding: 0 }}>
                        <div style={{
                            height: '240px',
                            position: 'relative',
                            overflow: 'hidden',
                            background: '#f3f4f6',
                            display: 'flex',
                            alignItems: 'flex-end',
                            padding: '24px'
                        }}>
                            <img
                                src={obterImagemQuarto(quarto, index)}
                                alt={`Suite ${quarto.numero} - ${quarto.tipo}`}
                                loading="lazy"
                                onError={e => { e.currentTarget.src = heroFallback; }}
                                style={{
                                    position: 'absolute',
                                    inset: 0,
                                    width: '100%',
                                    height: '100%',
                                    objectFit: 'cover',
                                    zIndex: 0,
                                }}
                            />
                            <div style={{
                                position: 'absolute',
                                inset: 0,
                                zIndex: 1,
                                background: 'linear-gradient(rgba(0,0,0,0.05), rgba(0,0,0,0.62))',
                            }} />
                            <span style={{
                                position: 'relative',
                                zIndex: 2,
                                background: 'rgba(0,0,0,0.7)', 
                                color: 'var(--secondary)', 
                                padding: '4px 12px', 
                                borderRadius: '4px',
                                fontSize: '0.8rem',
                                fontWeight: '600',
                                letterSpacing: '1px'
                            }}>
                                {quarto.tipo.toUpperCase()}
                            </span>
                        </div>
                        
                        <div style={{ padding: '24px', flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                                <h3 className="brand-font" style={{ fontSize: '1.5rem' }}>Suíte {quarto.numero}</h3>
                                <div style={{ textAlign: 'right' }}>
                                    <div style={{ fontSize: '1.4rem', fontWeight: 'bold', color: 'var(--text-main)' }}>
                                        {quarto.preco.toLocaleString()} Kz
                                    </div>
                                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>por noite</div>
                                </div>
                            </div>
                            
                            <p style={{ color: 'var(--text-muted)', marginBottom: '24px', fontSize: '0.95rem' }}>
                                {quarto.descricao}
                            </p>

                            {quarto.preco_5h && (
                                <div style={{ 
                                    background: 'rgba(212, 175, 55, 0.05)', 
                                    padding: '12px', 
                                    borderRadius: '8px', 
                                    border: '1px dashed var(--secondary)',
                                    marginBottom: '24px',
                                    fontSize: '0.9rem',
                                    display: 'flex',
                                    justifyContent: 'space-between'
                                }}>
                                    <span style={{ color: 'var(--secondary)' }}>Opção 5h (Demi Journée):</span>
                                    <span style={{ fontWeight: 'bold' }}>{quarto.preco_5h.toLocaleString()} Kz</span>
                                </div>
                            )}

                            <div style={{ marginTop: 'auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <span style={{ 
                                    color: quarto.status === 'disponivel' ? '#22c55e' : '#ef4444',
                                    fontSize: '0.9rem',
                                    fontWeight: '500'
                                }}>
                                    ● {quarto.status.toUpperCase()}
                                </span>
                                
                                {quarto.status === 'disponivel' ? (
                                    <button 
                                        onClick={() => abrirModalReserva(quarto)} 
                                        className="btn-primary"
                                        style={{ padding: '10px 24px' }}
                                    >
                                        RESERVAR AGORA
                                    </button>
                                ) : (
                                    <button disabled style={{ padding: '10px 24px', background: '#333', color: '#666', border: 'none', borderRadius: '8px' }}>
                                        INDISPONÍVEL
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                ))}
            </div>
            {modalAberto && quartoSelecionado && (
                <ModalReserva 
                    quarto={quartoSelecionado} 
                    onClose={() => setModalAberto(false)} 
                    onReservar={reservar} 
                />
            )}
        </div>
    );
};
