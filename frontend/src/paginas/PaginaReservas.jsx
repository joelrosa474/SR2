import { useState, useEffect } from 'react';
import { apiServico } from '../servicos/api';
import { useAuth } from '../hooks/useAuth';
import toast from 'react-hot-toast';

export const PaginaReservas = () => {
    const [reservas, setReservas] = useState([]);
    const [carregando, setCarregando] = useState(true);
    const { usuario } = useAuth();
    const podeGerenciarReservas = usuario?.tipo === 'administrador' || usuario?.tipo === 'funcionario';
    const opcoesStatus = ['pendente', 'confirmada', 'cancelada', 'concluida'];

    useEffect(() => {
        carregarReservas();
    }, []);

    const carregarReservas = async () => {
        try {
            let data;
            if (usuario.tipo === 'cliente') {
                data = await apiServico.listarMinhasReservas();
            } else {
                data = await apiServico.listarReservas();
            }
            setReservas(data);
        } catch (err) {
            console.error(err);
        } finally {
            setCarregando(false);
        }
    };

    const alterarStatus = async (id, status) => {
        try {
            await apiServico.atualizarStatusReserva(id, status);
            carregarReservas();
            toast.success('Status atualizado com sucesso!');
        } catch (err) { 
            toast.error(err.message); 
        }
    };

    const cancelarReserva = async (id) => {
        if (confirm('Deseja realmente cancelar esta reserva?')) {
            try {
                await apiServico.removerReserva(id);
                carregarReservas();
                toast.success('Reserva cancelada com sucesso!');
            } catch (err) { 
                toast.error(err.message); 
            }
        }
    }

    if (carregando) return <div style={{ textAlign: 'center', padding: '100px', color: 'var(--text-main)' }}>Sincronizando reservas...</div>;

    const totaisPorStatus = opcoesStatus.reduce((acc, status) => {
        acc[status] = reservas.filter(reserva => reserva.status === status).length;
        return acc;
    }, {});

    return (
        <div style={{ padding: '60px 5%', background: 'white', color: 'var(--text-main)', minHeight: '100vh' }}>
            <div style={{ marginBottom: '40px' }}>
                <h1 className="brand-font" style={{ fontSize: '2.5rem', color: 'var(--text-main)' }}>
                    {usuario.tipo === 'cliente' ? 'Minhas Estadias' : 'Gestão de Reservas'}
                </h1>
                <p style={{ color: 'var(--text-muted)' }}>Histórico e solicitações do Hotel Fiesta.</p>
            </div>

            {podeGerenciarReservas && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '16px', marginBottom: '32px' }}>
                    {opcoesStatus.map(status => (
                        <div key={status} className="glass" style={{ padding: '20px', borderRadius: '12px' }}>
                            <p style={{ color: 'var(--text-muted)', fontSize: '0.75rem', fontWeight: 'bold', letterSpacing: '1px', textTransform: 'uppercase' }}>{status}</p>
                            <strong style={{ display: 'block', marginTop: '8px', fontSize: '1.6rem', color: 'var(--primary)' }}>{totaisPorStatus[status]}</strong>
                        </div>
                    ))}
                </div>
            )}

            <div style={{ display: 'grid', gap: '24px' }}>
                {reservas.length === 0 && (
                    <div className="glass" style={{ padding: '40px', textAlign: 'center', borderRadius: '16px' }}>
                        <p style={{ color: 'var(--text-muted)' }}>Nenhuma reserva encontrada no sistema.</p>
                    </div>
                )}
                
                {reservas.map(reserva => (
                    <div key={reserva.id} className="card-fiesta" style={{ 
                        display: 'flex', 
                        justifyContent: 'space-between', 
                        alignItems: 'center',
                        gap: '20px',
                        flexWrap: 'wrap'
                    }}>
                        <div style={{ display: 'flex', gap: '24px', alignItems: 'center' }}>
                            <div style={{ 
                                width: '60px', 
                                height: '60px', 
                                background: 'var(--primary)', 
                                borderRadius: '12px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '1.2rem',
                                fontWeight: 'bold'
                            }}>
                                {reserva.quarto?.numero || '?'}
                            </div>
                            <div>
                                <h3 className="brand-font" style={{ fontSize: '1.2rem' }}>
                                    {reserva.quarto?.tipo || 'Quarto'} - Suíte {reserva.quarto?.numero}
                                </h3>
                                <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                                    {new Date(reserva.data_entrada).toLocaleDateString('pt-PT')} → {new Date(reserva.data_saida).toLocaleDateString('pt-PT')}
                                </p>
                                {podeGerenciarReservas && (
                                    <p style={{ fontSize: '0.85rem', marginTop: '4px' }}>
                                        Cliente: <strong>{reserva.cliente?.nome}</strong> ({reserva.cliente?.email})
                                    </p>
                                )}
                            </div>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
                            <div style={{ textAlign: 'right' }}>
                                <span style={{ 
                                    padding: '6px 16px', 
                                    borderRadius: '20px', 
                                    fontSize: '0.75rem',
                                    fontWeight: 'bold',
                                    letterSpacing: '1px',
                                    backgroundColor: reserva.status === 'confirmada' ? 'rgba(34, 197, 94, 0.1)' : 
                                                     reserva.status === 'pendente' ? 'rgba(234, 179, 8, 0.1)' : 
                                                     'rgba(239, 68, 68, 0.1)',
                                    color: reserva.status === 'confirmada' ? '#22c55e' : 
                                           reserva.status === 'pendente' ? '#eab308' : 
                                           '#ef4444',
                                    border: `1px solid ${reserva.status === 'confirmada' ? '#22c55e' : reserva.status === 'pendente' ? '#eab308' : '#ef4444'}`
                                }}>
                                    {reserva.status.toUpperCase()}
                                </span>
                            </div>

                            <div style={{ display: 'flex', gap: '12px' }}>
                                {podeGerenciarReservas && (
                                    <select
                                        value={reserva.status}
                                        onChange={e => alterarStatus(reserva.id, e.target.value)}
                                        style={{ minWidth: '160px', marginBottom: 0 }}
                                    >
                                        {opcoesStatus.map(status => (
                                            <option key={status} value={status}>{status.toUpperCase()}</option>
                                        ))}
                                    </select>
                                )}

                                {podeGerenciarReservas && reserva.status === 'pendente' && (
                                    <>
                                        <button onClick={() => alterarStatus(reserva.id, 'confirmada')} className="btn-primary" style={{ padding: '8px 16px', fontSize: '0.8rem' }}>CONFIRMAR</button>
                                        <button onClick={() => alterarStatus(reserva.id, 'cancelada')} style={{ padding: '8px 16px', fontSize: '0.8rem', background: 'transparent', border: '1px solid #ef4444', color: '#ef4444', borderRadius: '8px', cursor: 'pointer' }}>REJEITAR</button>
                                    </>
                                )}
                                
                                {podeGerenciarReservas && reserva.status === 'confirmada' && (
                                    <button onClick={() => alterarStatus(reserva.id, 'concluida')} className="btn-primary" style={{ padding: '8px 16px', fontSize: '0.8rem' }}>CHECKOUT</button>
                                )}

                                {usuario.tipo === 'cliente' && reserva.status === 'pendente' && (
                                    <button onClick={() => cancelarReserva(reserva.id)} style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '0.9rem' }}>Cancelar Reserva</button>
                                )}
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};
