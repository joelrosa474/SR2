import { useEffect, useState } from 'react';
import { apiServico } from '../servicos/api';
import { useAuth } from '../hooks/useAuth';
import { ModalReserva } from '../components/ModalReserva';
import toast from 'react-hot-toast';
import heroFallback from '../assets/hero.png';
import 'react-lazy-load-image-component/src/effects/blur.css';
import { useNavigate } from 'react-router-dom';

const imagensPorCaminho = import.meta.glob('../assets/IMG/*.{jpg,jpeg,png,webp}', {
    eager: true,
    import: 'default',
});

const imagensHotel = Object.values(imagensPorCaminho);

const imagensSuiteSuperVip = [
    imagensPorCaminho['../assets/IMG/Suite Vip1.jpeg'],
    imagensPorCaminho['../assets/IMG/Suite VIp2 (2).jpeg'],
    imagensPorCaminho['../assets/IMG/Suipe Vip3.jpeg'],
    imagensPorCaminho['../assets/IMG/Suipe Vip4.jpeg'],
].filter(Boolean);

const servicosIncluidos = ['Wi-Fi', 'Ar condicionado', 'TV', 'Casa de banho privativa', 'Limpeza diaria'];

const formatarMoeda = (valor) => `${Number(valor || 0).toLocaleString('pt-AO')} Kz`;

const obterGaleriaQuarto = (quarto, index) => {
    if (quarto.tipo?.toLowerCase().includes('super vip') && imagensSuiteSuperVip.length >= 4) {
        return imagensSuiteSuperVip.slice(0, 4);
    }

    const imagemCadastrada = quarto.imagem_url?.trim();
    if (
        imagemCadastrada &&
        (imagemCadastrada.startsWith('http') || imagemCadastrada.startsWith('/') || imagemCadastrada.startsWith('data:'))
    ) {
        return [imagemCadastrada, ...imagensHotel.slice(index, index + 3)];
    }

    if (imagensHotel.length === 0) return [heroFallback, heroFallback, heroFallback, heroFallback];

    return Array.from({ length: 4 }, (_, posicao) => imagensHotel[(index + posicao) % imagensHotel.length]);
};

export const PaginaQuartos = () => {
    const [quartos, setQuartos] = useState([]);
    const [carregando, setCarregando] = useState(true);
    const [modalAberto, setModalAberto] = useState(false);
    const [quartoSelecionado, setQuartoSelecionado] = useState(null);
    const { usuario } = useAuth();
    const navigate = useNavigate();

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
        const reserva = await apiServico.realizarReservaComComprovativo(dados);
        carregarQuartos();
        return reserva;
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

    const clicarGaleria = () => {
        if (!usuario) {
            navigate('/login');
        }
    };

    if (carregando) {
        return <div style={{ textAlign: 'center', padding: '100px', color: 'var(--text-main)' }}>Preparando as suites...</div>;
    }

    return (
        <main className="pagina-quartos">
            <header className="pagina-quartos__cabecalho">
                <h1 className="brand-font">Reservas do Cliente</h1>
                <p>Escolha o quarto, confira os detalhes e envie o comprovativo para validacao da sua estadia.</p>
            </header>

            <section className="lista-quartos-reserva">
                {quartos.map((quarto, index) => {
                    const galeria = obterGaleriaQuarto(quarto, index);
                    const capacidade = quarto.tipo?.toLowerCase().includes('suite') || quarto.tipo?.toLowerCase().includes('vip') ? 3 : 2;

                    return (
                        <article key={quarto.id} className="quarto-reserva">
                            <div
                                className={`galeria-quarto ${!usuario ? 'galeria-quarto--clicavel' : ''}`}
                                onClick={clicarGaleria}
                                role={!usuario ? 'button' : undefined}
                                tabIndex={!usuario ? 0 : undefined}
                                onKeyDown={(e) => {
                                    if (!usuario && (e.key === 'Enter' || e.key === ' ')) clicarGaleria();
                                }}
                            >
                                <div className="galeria-quarto__miniaturas">
                                    {galeria.map((imagem, posicao) => (
                                        <img
                                            key={`${quarto.id}-${imagem}-${posicao}`}
                                            src={imagem}
                                            alt={quarto.tipo?.toLowerCase().includes('super vip')
                                                ? `Suite Super VIP ${posicao + 1}`
                                                : `Imagem ${posicao + 1} do quarto ${quarto.numero}`}
                                            onError={(e) => { e.currentTarget.src = heroFallback; }}
                                        />
                                    ))}
                                </div>
                            </div>

                            <div className="detalhes-quarto">
                                <div className="detalhes-quarto__topo">
                                    <div>
                                        <p>Quarto {quarto.numero}</p>
                                        <h2 className="brand-font">Suite {quarto.numero}</h2>
                                    </div>
                                    <span className={`status-quarto status-quarto--${quarto.status}`}>
                                        {quarto.status}
                                    </span>
                                </div>

                                <div className="detalhes-quarto__bloco">
                                    <span>Tipo do quarto</span>
                                    <strong>{quarto.tipo}</strong>
                                </div>

                                <div className="detalhes-quarto__bloco">
                                    <span>Descricao detalhada</span>
                                    <p>{quarto.descricao}</p>
                                </div>

                                <div className="detalhes-quarto__servicos">
                                    <span>Servicos incluidos</span>
                                    <div>
                                        {servicosIncluidos.map((servico) => <strong key={servico}>{servico}</strong>)}
                                    </div>
                                </div>

                                <div className="detalhes-quarto__metricas">
                                    <div>
                                        <span>Preco por diaria</span>
                                        <strong>{formatarMoeda(quarto.preco)}</strong>
                                    </div>
                                    <div>
                                        <span>Capacidade</span>
                                        <strong>{capacidade} pessoas</strong>
                                    </div>
                                </div>

                                {quarto.preco_5h && (
                                    <div className="detalhes-quarto__diaria-curta">
                                        <span>Opcao 5h</span>
                                        <strong>{formatarMoeda(quarto.preco_5h)}</strong>
                                    </div>
                                )}

                                <button
                                    onClick={() => abrirModalReserva(quarto)}
                                    className="btn-primary detalhes-quarto__botao"
                                    disabled={quarto.status !== 'disponivel'}
                                >
                                    {quarto.status === 'disponivel' ? 'Reservar Quarto' : 'Indisponivel'}
                                </button>
                            </div>
                        </article>
                    );
                })}
            </section>

            {modalAberto && quartoSelecionado && (
                <ModalReserva
                    quarto={quartoSelecionado}
                    onClose={() => setModalAberto(false)}
                    onReservar={reservar}
                />
            )}
        </main>
    );
};
