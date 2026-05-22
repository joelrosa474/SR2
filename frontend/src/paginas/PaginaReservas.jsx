import { useEffect, useMemo, useState } from 'react';
import { apiServico } from '../servicos/api';
import { useAuth } from '../hooks/useAuth';
import toast from 'react-hot-toast';

const opcoesStatus = ['todos', 'pendente', 'confirmada', 'cancelada', 'concluida', 'expirada'];
const statusResumo = ['pendente', 'confirmada', 'cancelada'];

const formatarMoeda = (valor) => `${Number(valor || 0).toLocaleString('pt-AO')} Kz`;
const formatarData = (data) => data ? new Date(data).toLocaleDateString('pt-PT') : '-';

export const PaginaReservas = () => {
    const [reservas, setReservas] = useState([]);
    const [carregando, setCarregando] = useState(true);
    const [filtroStatus, setFiltroStatus] = useState('todos');
    const [busca, setBusca] = useState('');
    const { usuario } = useAuth();
    const podeGerenciarReservas = usuario?.tipo === 'administrador' || usuario?.tipo === 'funcionario';

    useEffect(() => {
        carregarReservas();
    }, []);

    const carregarReservas = async () => {
        try {
            const data = usuario.tipo === 'cliente'
                ? await apiServico.listarMinhasReservas()
                : await apiServico.listarReservas();
            setReservas(data);
        } catch (err) {
            console.error(err);
            toast.error('Nao foi possivel carregar as reservas.');
        } finally {
            setCarregando(false);
        }
    };

    const reservasFiltradas = useMemo(() => {
        return reservas.filter((reserva) => {
            const correspondeStatus = filtroStatus === 'todos' || reserva.status === filtroStatus;
            const texto = `${reserva.codigo_reserva || ''} ${reserva.quarto?.numero || ''} ${reserva.cliente?.nome || ''} ${reserva.nome_cliente || ''} ${reserva.email_cliente || ''}`.toLowerCase();
            return correspondeStatus && texto.includes(busca.toLowerCase());
        });
    }, [reservas, filtroStatus, busca]);

    const alterarStatus = async (id, status) => {
        try {
            await apiServico.atualizarStatusReserva(id, status);
            await carregarReservas();
            toast.success('Status atualizado com sucesso!');
        } catch (err) {
            toast.error(err.message);
        }
    };

    const cancelarReserva = async (id) => {
        if (confirm('Deseja realmente cancelar esta reserva?')) {
            try {
                await apiServico.removerReserva(id);
                await carregarReservas();
                toast.success('Reserva cancelada com sucesso!');
            } catch (err) {
                toast.error(err.message);
            }
        }
    };

    const baixarComprovativo = async (reserva) => {
        try {
            const blob = await apiServico.baixarComprovativo(reserva.id);
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = reserva.comprovativo_nome || `comprovativo-${reserva.codigo_reserva || reserva.id}`;
            link.click();
            URL.revokeObjectURL(url);
        } catch (err) {
            toast.error(err.message);
        }
    };

    if (carregando) {
        return <div style={{ textAlign: 'center', padding: '100px', color: 'var(--text-main)' }}>Sincronizando reservas...</div>;
    }

    const totaisPorStatus = statusResumo.reduce((acc, status) => {
        acc[status] = reservas.filter((reserva) => reserva.status === status).length;
        return acc;
    }, {});

    return (
        <main className="pagina-reservas">
            <header className="pagina-reservas__cabecalho">
                <div>
                    <h1 className="brand-font">{usuario.tipo === 'cliente' ? 'Minhas Reservas' : 'Dashboard de Reservas'}</h1>
                    <p>{usuario.tipo === 'cliente' ? 'Historico e acompanhamento das suas reservas.' : 'Visualize, filtre, valide pagamentos e acompanhe o historico.'}</p>
                </div>
            </header>

            {podeGerenciarReservas && (
                <section className="reservas-resumo">
                    {statusResumo.map((status) => (
                        <div key={status}>
                            <span>{status}</span>
                            <strong>{totaisPorStatus[status]}</strong>
                        </div>
                    ))}
                </section>
            )}

            <section className="reservas-filtros">
                <input
                    value={busca}
                    onChange={(e) => setBusca(e.target.value)}
                    placeholder="Filtrar por cliente, quarto ou referencia"
                />
                <select value={filtroStatus} onChange={(e) => setFiltroStatus(e.target.value)}>
                    {opcoesStatus.map((status) => (
                        <option key={status} value={status}>{status.toUpperCase()}</option>
                    ))}
                </select>
            </section>

            <section className="reservas-lista">
                {reservasFiltradas.length === 0 && (
                    <div className="card-fiesta reservas-vazio">
                        <p>Nenhuma reserva encontrada no sistema.</p>
                    </div>
                )}

                {reservasFiltradas.map((reserva) => (
                    <article key={reserva.id} className="reserva-card">
                        <div className="reserva-card__principal">
                            <div className="reserva-card__quarto">{reserva.quarto?.numero || '?'}</div>
                            <div>
                                <span className="reserva-card__referencia">#{reserva.codigo_reserva || String(reserva.id).padStart(8, '0')}</span>
                                <h3 className="brand-font">{reserva.quarto?.tipo || 'Quarto'} - Suite {reserva.quarto?.numero}</h3>
                                <p>{formatarData(reserva.data_entrada)} {'->'} {formatarData(reserva.data_saida)} · {reserva.quantidade_dias || '-'} dias · {formatarMoeda(reserva.total_pagar)}</p>
                                {podeGerenciarReservas && (
                                    <p>Cliente: <strong>{reserva.nome_cliente || reserva.cliente?.nome}</strong> ({reserva.email_cliente || reserva.cliente?.email})</p>
                                )}
                            </div>
                        </div>

                        <div className="reserva-card__detalhes">
                            <span className={`reserva-status reserva-status--${reserva.status}`}>{reserva.status}</span>
                            <span className="reserva-pagamento">Pagamento: {reserva.pagamento_status || 'pendente'}</span>
                            {reserva.expira_em && reserva.status === 'pendente' && (
                                <span className="reserva-pagamento">Expira: {new Date(reserva.expira_em).toLocaleString('pt-PT')}</span>
                            )}
                        </div>

                        <div className="reserva-card__acoes">
                            {podeGerenciarReservas && (
                                <select value={reserva.status} onChange={(e) => alterarStatus(reserva.id, e.target.value)}>
                                    {opcoesStatus.filter((status) => status !== 'todos').map((status) => (
                                        <option key={status} value={status}>{status.toUpperCase()}</option>
                                    ))}
                                </select>
                            )}

                            {podeGerenciarReservas && reserva.comprovativo_path && (
                                <button type="button" onClick={() => baixarComprovativo(reserva)} className="btn-secondary">
                                    Baixar Comprovativo
                                </button>
                            )}

                            {podeGerenciarReservas && reserva.status === 'pendente' && (
                                <>
                                    <button type="button" onClick={() => alterarStatus(reserva.id, 'confirmada')} className="btn-primary">Aprovar</button>
                                    <button type="button" onClick={() => alterarStatus(reserva.id, 'cancelada')} className="btn-danger">Rejeitar</button>
                                </>
                            )}

                            {podeGerenciarReservas && reserva.status === 'confirmada' && (
                                <button type="button" onClick={() => alterarStatus(reserva.id, 'concluida')} className="btn-primary">Checkout</button>
                            )}

                            {usuario.tipo === 'cliente' && reserva.status === 'pendente' && (
                                <button type="button" onClick={() => cancelarReserva(reserva.id)} className="btn-danger">Cancelar Reserva</button>
                            )}
                        </div>
                    </article>
                ))}
            </section>
        </main>
    );
};
