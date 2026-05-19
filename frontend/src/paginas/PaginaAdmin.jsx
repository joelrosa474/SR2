import { useState, useEffect } from 'react';
import { apiServico } from '../servicos/api';
import toast from 'react-hot-toast';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

export const PaginaAdmin = () => {
    const [aba, setAba] = useState('stats');
    const [stats, setStats] = useState(null);
    const [quartos, setQuartos] = useState([]);
    const [usuarios, setUsuarios] = useState([]);
    const [itens, setItens] = useState([]);
    const [carregando, setCarregando] = useState(false);
    
    // Estados para os formulários
    const [novoQuarto, setNovoQuarto] = useState({ numero: '', tipo: '', preco: '', preco_5h: '', descricao: '' });
    const [novoItem, setNovoItem] = useState({ nome: '', preco: '', descricao: '' });
    const [novoMembro, setNovoMembro] = useState({
        nome: '',
        email: '',
        telefone: '',
        senha: '',
        tipo: 'funcionario',
        cargo: '',
        status: 'ativo',
    });
    const [exibirForm, setExibirForm] = useState(false);

    useEffect(() => {
        carregarDados();
    }, [aba]);

    const carregarDados = async () => {
        setCarregando(true);
        try {
            if (aba === 'stats') {
                const data = await apiServico.obterDashboard();
                setStats(data);
            } else if (aba === 'quartos') {
                const data = await apiServico.listarQuartos();
                setQuartos(data);
            } else if (aba === 'usuarios') {
                const data = await apiServico.listarUsuarios();
                setUsuarios(data);
            } else if (aba === 'itens') {
                const data = await apiServico.listarItensAdicionais();
                setItens(data);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setCarregando(false);
        }
    };

    const handleCriarQuarto = async (e) => {
        e.preventDefault();
        try {
            await apiServico.criarQuarto({ 
                ...novoQuarto, 
                preco: parseFloat(novoQuarto.preco),
                preco_5h: novoQuarto.preco_5h ? parseFloat(novoQuarto.preco_5h) : null
            });
            setNovoQuarto({ numero: '', tipo: '', preco: '', preco_5h: '', descricao: '' });
            setExibirForm(false);
            carregarDados();
            toast.success('Quarto cadastrado com sucesso!');
        } catch (err) { alert(err.message); }
    };

    const handleCriarItem = async (e) => {
        e.preventDefault();
        try {
            await apiServico.criarItemAdicional({ 
                ...novoItem, 
                preco: parseFloat(novoItem.preco) 
            });
            setNovoItem({ nome: '', preco: '', descricao: '' });
            setExibirForm(false);
            carregarDados();
            toast.success('Serviço cadastrado com sucesso!');
        } catch (err) { alert(err.message); }
    };

    const handleCriarMembro = async (e) => {
        e.preventDefault();
        try {
            await apiServico.criarUsuario(novoMembro);
            setNovoMembro({
                nome: '',
                email: '',
                telefone: '',
                senha: '',
                tipo: 'funcionario',
                cargo: '',
                status: 'ativo',
            });
            setExibirForm(false);
            carregarDados();
            toast.success('Membro da equipe cadastrado com sucesso!');
        } catch (err) { alert(err.message); }
    };

    const handleAtualizarMembro = async (id, dados) => {
        try {
            await apiServico.atualizarUsuario(id, dados);
            carregarDados();
            toast.success('Equipe atualizada com sucesso!');
        } catch (err) { alert(err.message); }
    };

    const NavItem = ({ id, label }) => (
        <button 
            onClick={() => { setAba(id); setExibirForm(false); }} 
            style={{ 
                padding: '12px 20px', 
                border: 'none',
                borderRadius: '8px',
                color: aba === id ? 'white' : 'var(--text-muted)',
                background: aba === id ? 'var(--primary)' : 'transparent',
                cursor: 'pointer',
                fontWeight: '600',
                transition: 'var(--transition-smooth)'
            }}
        >
            {label}
        </button>
    );

    return (
        <div style={{ padding: '40px 5%', background: 'white', color: 'var(--text-main)', minHeight: '100vh' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px', flexWrap: 'wrap', gap: '20px' }}>
                <div>
                    <h1 className="brand-font" style={{ fontSize: '2.5rem', color: 'var(--primary)' }}>Painel Administrativo</h1>
                    <p style={{ color: 'var(--text-muted)' }}>Gestão do Hotel Fiesta</p>
                </div>
                <div style={{ display: 'flex', gap: '4px', padding: '4px', borderRadius: '10px', background: 'white', border: '1px solid var(--border)' }}>
                    <NavItem id="stats" label="Início" />
                    <NavItem id="quartos" label="Quartos" />
                    <NavItem id="itens" label="Serviços" />
                    <NavItem id="usuarios" label="Equipe" />
                </div>
            </div>

            {carregando ? (
                <div style={{ textAlign: 'center', padding: '100px', color: 'var(--primary)' }}>Carregando dados do sistema...</div>
            ) : (
                <>
                    {aba === 'stats' && stats && (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '24px' }}>
                            <div className="card-fiesta">
                                <h3 style={{ color: 'var(--text-muted)', fontSize: '0.8rem', letterSpacing: '1px', fontWeight: 'bold' }}>FATURAMENTO</h3>
                                <div style={{ fontSize: '1.8rem', fontWeight: 'bold', color: 'var(--primary)', marginTop: '8px' }}>
                                    {stats.estatisticas.faturamento_total.toLocaleString('pt-PT', { style: 'currency', currency: 'AOA' })}
                                </div>
                            </div>
                            <div className="card-fiesta">
                                <h3 style={{ color: 'var(--text-muted)', fontSize: '0.8rem', letterSpacing: '1px', fontWeight: 'bold' }}>OCUPAÇÃO</h3>
                                <div style={{ fontSize: '1.8rem', fontWeight: 'bold', marginTop: '8px', color: 'var(--text-main)' }}>{stats.estatisticas.taxa_ocupacao.toFixed(1)}%</div>
                            </div>
                            <div className="card-fiesta">
                                <h3 style={{ color: 'var(--text-muted)', fontSize: '0.8rem', letterSpacing: '1px', fontWeight: 'bold' }}>RESERVAS HOJE</h3>
                                <div style={{ fontSize: '1.8rem', fontWeight: 'bold', marginTop: '8px', color: 'var(--text-main)' }}>{stats.estatisticas.reservas_hoje}</div>
                            </div>
                            <div className="card-fiesta">
                                <h3 style={{ color: 'var(--text-muted)', fontSize: '0.8rem', letterSpacing: '1px', fontWeight: 'bold' }}>DISPONÍVEIS</h3>
                                <div style={{ fontSize: '1.8rem', fontWeight: 'bold', color: '#22c55e', marginTop: '8px' }}>{stats.estatisticas.quartos_disponiveis}</div>
                            </div>
                        </div>
                    )}

                    {aba === 'stats' && stats && (
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginTop: '40px' }}>
                            <div className="card-fiesta">
                                <h3 style={{ marginBottom: '20px', color: 'var(--text-main)' }}>Reservas por Status</h3>
                                <ResponsiveContainer width="100%" height={300}>
                                    <PieChart>
                                        <Pie
                                            data={[
                                                { name: 'Confirmadas', value: stats.estatisticas.reservas_confirmadas || 0, fill: '#22c55e' },
                                                { name: 'Pendentes', value: stats.estatisticas.reservas_pendentes || 0, fill: '#f59e0b' },
                                                { name: 'Canceladas', value: stats.estatisticas.reservas_canceladas || 0, fill: '#ef4444' }
                                            ]}
                                            cx="50%"
                                            cy="50%"
                                            outerRadius={80}
                                            dataKey="value"
                                            label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                                        />
                                        <Tooltip />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>

                            <div className="card-fiesta">
                                <h3 style={{ marginBottom: '20px', color: 'var(--text-main)' }}>Faturamento Mensal</h3>
                                <ResponsiveContainer width="100%" height={300}>
                                    <BarChart data={stats.graficos?.faturamento_mensal || []}>
                                        <CartesianGrid strokeDasharray="3 3" />
                                        <XAxis dataKey="mes" />
                                        <YAxis />
                                        <Tooltip formatter={(value) => [value.toLocaleString('pt-PT', { style: 'currency', currency: 'AOA' }), 'Faturamento']} />
                                        <Bar dataKey="valor" fill="var(--primary)" />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    )}

                    {aba === 'quartos' && (
                        <div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '32px' }}>
                                <h2 className="brand-font">Quartos</h2>
                                <button className="btn-primary" onClick={() => setExibirForm(!exibirForm)}>
                                    {exibirForm ? 'CANCELAR' : '+ NOVO QUARTO'}
                                </button>
                            </div>

                            {exibirForm && (
                                <div className="glass card-fiesta" style={{ marginBottom: '40px', padding: '32px' }}>
                                    <h3 className="brand-font" style={{ marginBottom: '24px' }}>Cadastrar Nova Suíte</h3>
                                    <form onSubmit={handleCriarQuarto} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                                        <input placeholder="Número (Ex: 106)" value={novoQuarto.numero} onChange={e => setNovoQuarto({...novoQuarto, numero: e.target.value})} required />
                                        <select value={novoQuarto.tipo} onChange={e => setNovoQuarto({...novoQuarto, tipo: e.target.value})} required>
                                            <option value="">Selecione a Tipologia</option>
                                            <option value="Suite Super VIP">Suite Super VIP</option>
                                            <option value="Suite VIP">Suite VIP</option>
                                            <option value="Suite Executivo">Suite Executivo</option>
                                            <option value="Suite Fiesta">Suite Fiesta</option>
                                            <option value="Suite Premium">Suite Premium</option>
                                            <option value="Suite Standard 1">Suite Standard 1</option>
                                        </select>
                                        <input type="number" placeholder="Preço Diária (Kz)" value={novoQuarto.preco} onChange={e => setNovoQuarto({...novoQuarto, preco: e.target.value})} required />
                                        <input type="number" placeholder="Preço 5h (Opcional)" value={novoQuarto.preco_5h} onChange={e => setNovoQuarto({...novoQuarto, preco_5h: e.target.value})} />
                                        <textarea placeholder="Descrição da suíte..." style={{ gridColumn: 'span 2', minHeight: '100px' }} value={novoQuarto.descricao} onChange={e => setNovoQuarto({...novoQuarto, descricao: e.target.value})} required />
                                        <button type="submit" className="btn-primary" style={{ gridColumn: 'span 2' }}>SALVAR QUARTO</button>
                                    </form>
                                </div>
                            )}

                            <div className="glass" style={{ padding: '24px', borderRadius: '16px', overflowX: 'auto' }}>
                                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                    <thead>
                                        <tr style={{ textAlign: 'left', color: 'var(--text-muted)', borderBottom: '1px solid var(--glass-border)' }}>
                                            <th style={{ padding: '16px' }}>Nº</th>
                                            <th>TIPO</th>
                                            <th>DIÁRIA</th>
                                            <th>5H</th>
                                            <th>AÇÕES</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {quartos.map(q => (
                                            <tr key={q.id} style={{ borderBottom: '1px solid var(--glass-border)' }}>
                                                <td style={{ padding: '16px', fontWeight: 'bold' }}>{q.numero}</td>
                                                <td>{q.tipo}</td>
                                                <td>{q.preco.toLocaleString()}</td>
                                                <td>{q.preco_5h?.toLocaleString() || '-'}</td>
                                                <td>
                                                    <button onClick={() => { if(confirm('Remover?')) apiServico.removerQuarto(q.id).then(carregarDados) }} style={{ color: '#ef4444', background: 'transparent', border: 'none', cursor: 'pointer' }}>Excluir</button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {aba === 'itens' && (
                        <div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '32px' }}>
                                <h2 className="brand-font">Serviços</h2>
                                <button className="btn-primary" onClick={() => setExibirForm(!exibirForm)}>
                                    {exibirForm ? 'CANCELAR' : '+ NOVO SERVIÇO'}
                                </button>
                            </div>

                            {exibirForm && (
                                <div className="glass card-fiesta" style={{ marginBottom: '40px', padding: '32px', maxWidth: '600px' }}>
                                    <h3 className="brand-font" style={{ marginBottom: '24px' }}>Novo Serviço Adicional</h3>
                                    <form onSubmit={handleCriarItem}>
                                        <input placeholder="Nome (Ex: Decoração de Núpcias)" value={novoItem.nome} onChange={e => setNovoItem({...novoItem, nome: e.target.value})} required />
                                        <input type="number" placeholder="Preço (Kz)" value={novoItem.preco} onChange={e => setNovoItem({...novoItem, preco: e.target.value})} required />
                                        <textarea placeholder="Pequena descrição..." value={novoItem.descricao} onChange={e => setNovoItem({...novoItem, descricao: e.target.value})} />
                                        <button type="submit" className="btn-primary" style={{ width: '100%' }}>SALVAR SERVIÇO</button>
                                    </form>
                                </div>
                            )}

                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '20px' }}>
                                {itens.map(item => (
                                    <div key={item.id} className="card-fiesta" style={{ textAlign: 'center' }}>
                                        <h3 className="brand-font">{item.nome}</h3>
                                        <p style={{ color: 'var(--secondary)', fontWeight: 'bold', margin: '12px 0' }}>{item.preco.toLocaleString()} Kz</p>
                                        <button onClick={() => apiServico.removerItemAdicional(item.id).then(carregarDados)} style={{ color: '#ef4444', background: 'transparent', border: '1px solid #ef4444', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer' }}>Remover</button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {aba === 'usuarios' && (
                        <div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '32px', gap: '16px', flexWrap: 'wrap' }}>
                                <div>
                                    <h2 className="brand-font">Equipe</h2>
                                    <p style={{ color: 'var(--text-muted)', marginTop: '6px' }}>Funcionarios e administradores do sistema</p>
                                </div>
                                <button className="btn-primary" onClick={() => setExibirForm(!exibirForm)}>
                                    {exibirForm ? 'CANCELAR' : '+ NOVO MEMBRO'}
                                </button>
                            </div>

                            {exibirForm && (
                                <div className="glass card-fiesta" style={{ marginBottom: '40px', padding: '32px' }}>
                                    <h3 className="brand-font" style={{ marginBottom: '24px' }}>Cadastrar Membro da Equipe</h3>
                                    <form onSubmit={handleCriarMembro} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px' }}>
                                        <input placeholder="Nome completo" value={novoMembro.nome} onChange={e => setNovoMembro({...novoMembro, nome: e.target.value})} required />
                                        <input type="email" placeholder="Email" value={novoMembro.email} onChange={e => setNovoMembro({...novoMembro, email: e.target.value})} required />
                                        <input placeholder="Telefone" value={novoMembro.telefone} onChange={e => setNovoMembro({...novoMembro, telefone: e.target.value})} />
                                        <input type="password" placeholder="Senha inicial" value={novoMembro.senha} onChange={e => setNovoMembro({...novoMembro, senha: e.target.value})} required />
                                        <select value={novoMembro.tipo} onChange={e => setNovoMembro({...novoMembro, tipo: e.target.value})} required>
                                            <option value="funcionario">Funcionario</option>
                                            <option value="administrador">Administrador</option>
                                        </select>
                                        <input placeholder="Cargo (Ex: Recepcionista)" value={novoMembro.cargo} onChange={e => setNovoMembro({...novoMembro, cargo: e.target.value})} required />
                                        <select value={novoMembro.status} onChange={e => setNovoMembro({...novoMembro, status: e.target.value})} required>
                                            <option value="ativo">Ativo</option>
                                            <option value="inativo">Inativo</option>
                                        </select>
                                        <button type="submit" className="btn-primary">SALVAR MEMBRO</button>
                                    </form>
                                </div>
                            )}

                            <div className="glass" style={{ padding: '24px', borderRadius: '16px', overflowX: 'auto' }}>
                                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                    <thead>
                                        <tr style={{ textAlign: 'left', color: 'var(--text-muted)', borderBottom: '1px solid var(--glass-border)' }}>
                                            <th style={{ padding: '16px' }}>NOME</th>
                                            <th>EMAIL</th>
                                            <th>TELEFONE</th>
                                            <th>CARGO</th>
                                            <th>PERFIL</th>
                                            <th>STATUS</th>
                                            <th>ACOES</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {usuarios.filter(usuario => usuario.tipo !== 'cliente').map(usuario => (
                                            <tr key={usuario.id} style={{ borderBottom: '1px solid var(--glass-border)' }}>
                                                <td style={{ padding: '16px', fontWeight: 'bold' }}>{usuario.nome}</td>
                                                <td>{usuario.email}</td>
                                                <td>{usuario.telefone || '-'}</td>
                                                <td>
                                                    <input
                                                        value={usuario.cargo || ''}
                                                        onChange={e => setUsuarios(usuarios.map(item => item.id === usuario.id ? { ...item, cargo: e.target.value } : item))}
                                                        onBlur={e => handleAtualizarMembro(usuario.id, { cargo: e.target.value })}
                                                        placeholder="Cargo"
                                                        style={{ minWidth: '150px', marginBottom: 0 }}
                                                    />
                                                </td>
                                                <td>
                                                    <select
                                                        value={usuario.tipo}
                                                        onChange={e => handleAtualizarMembro(usuario.id, { tipo: e.target.value })}
                                                        style={{ minWidth: '150px', marginBottom: 0 }}
                                                    >
                                                        <option value="funcionario">Funcionario</option>
                                                        <option value="administrador">Administrador</option>
                                                    </select>
                                                </td>
                                                <td>
                                                    <select
                                                        value={usuario.status}
                                                        onChange={e => handleAtualizarMembro(usuario.id, { status: e.target.value })}
                                                        style={{ minWidth: '120px', marginBottom: 0 }}
                                                    >
                                                        <option value="ativo">Ativo</option>
                                                        <option value="inativo">Inativo</option>
                                                    </select>
                                                </td>
                                                <td>
                                                    <button onClick={() => { if(confirm('Remover membro da equipe?')) apiServico.removerUsuario(usuario.id).then(carregarDados) }} style={{ color: '#ef4444', background: 'transparent', border: 'none', cursor: 'pointer' }}>Excluir</button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                                {usuarios.filter(usuario => usuario.tipo !== 'cliente').length === 0 && (
                                    <div style={{ textAlign: 'center', padding: '32px', color: 'var(--text-muted)' }}>
                                        Nenhum membro da equipe cadastrado.
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </>
            )}
        </div>
    );
};
