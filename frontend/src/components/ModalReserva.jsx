import { useMemo, useState } from 'react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import toast from 'react-hot-toast';
import { useAuth } from '../hooks/useAuth';

const gerarReferencia = () => {
  const caracteres = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  return Array.from({ length: 8 }, () => caracteres[Math.floor(Math.random() * caracteres.length)]).join('');
};

const formatarMoeda = (valor) => `${Number(valor || 0).toLocaleString('pt-AO')} Kz`;

export const ModalReserva = ({ quarto, onClose, onReservar }) => {
  const { usuario } = useAuth();
  const [carregando, setCarregando] = useState(false);
  const [referencia] = useState(gerarReferencia);
  const [formulario, setFormulario] = useState({
    nome: usuario?.nome || '',
    email: usuario?.email || '',
    telefone: usuario?.telefone || '',
    metodoPagamento: 'Transferencia bancaria',
    dataEntrada: null,
    dataSaida: null,
    comprovativo: null,
  });

  const quantidadeDias = useMemo(() => {
    if (!formulario.dataEntrada || !formulario.dataSaida) return 0;
    const entrada = new Date(formulario.dataEntrada);
    const saida = new Date(formulario.dataSaida);
    const diferenca = saida.setHours(0, 0, 0, 0) - entrada.setHours(0, 0, 0, 0);
    return Math.max(Math.ceil(diferenca / (1000 * 60 * 60 * 24)), 0);
  }, [formulario.dataEntrada, formulario.dataSaida]);

  const total = quarto.preco * quantidadeDias;

  const atualizarCampo = (campo, valor) => {
    setFormulario((atual) => ({ ...atual, [campo]: valor }));
  };

  const validarArquivo = (arquivo) => {
    if (!arquivo) return true;
    const tiposPermitidos = ['application/pdf', 'image/png', 'image/jpeg'];
    return tiposPermitidos.includes(arquivo.type);
  };

  const onSubmit = async (evento) => {
    evento.preventDefault();

    if (!formulario.nome.trim() || !formulario.email.trim() || !formulario.telefone.trim()) {
      toast.error('Preencha os dados do cliente.');
      return;
    }

    if (!formulario.dataEntrada || !formulario.dataSaida || quantidadeDias < 1) {
      toast.error('A data de saida deve ser maior que a data de entrada.');
      return;
    }

    if (!formulario.comprovativo) {
      toast.error('Envie o comprovativo do pagamento.');
      return;
    }

    if (!validarArquivo(formulario.comprovativo)) {
      toast.error('O comprovativo deve ser PDF, PNG ou JPG.');
      return;
    }

    const dados = new FormData();
    dados.append('quarto_id', quarto.id);
    dados.append('codigo_reserva', referencia);
    dados.append('nome_cliente', formulario.nome);
    dados.append('email_cliente', formulario.email);
    dados.append('telefone_cliente', formulario.telefone);
    dados.append('metodo_pagamento', formulario.metodoPagamento);
    dados.append('data_entrada', formulario.dataEntrada.toISOString());
    dados.append('data_saida', formulario.dataSaida.toISOString());
    dados.append('comprovativo', formulario.comprovativo);

    setCarregando(true);
    try {
      await onReservar(dados);
      toast.success('Reserva enviada. Aguarde a validacao do pagamento.');
      onClose();
    } catch (err) {
      toast.error(`Nao foi possivel processar a reserva: ${err.message}`);
    } finally {
      setCarregando(false);
    }
  };

  return (
    <div className="modal-reserva-overlay" onClick={onClose}>
      <div className="modal-reserva" onClick={(e) => e.stopPropagation()}>
        <div className="modal-reserva__topo">
          <div>
            <p className="modal-reserva__rotulo">Referencia da reserva</p>
            <h2 className="brand-font">#{referencia}</h2>
          </div>
          <button type="button" onClick={onClose} className="modal-reserva__fechar" aria-label="Fechar">x</button>
        </div>

        <div className="modal-reserva__grid">
          <aside className="resumo-reserva">
            <h3 className="brand-font">Suite {quarto.numero}</h3>
            <div className="resumo-reserva__linha"><span>Numero do quarto</span><strong>{quarto.numero}</strong></div>
            <div className="resumo-reserva__linha"><span>Tipo de diaria</span><strong>Diaria completa</strong></div>
            <div className="resumo-reserva__linha"><span>Valor da diaria</span><strong>{formatarMoeda(quarto.preco)}</strong></div>
            <div className="resumo-reserva__linha"><span>Quantidade de dias</span><strong>{quantidadeDias || '-'}</strong></div>
            <div className="resumo-reserva__total"><span>Total a pagar</span><strong>{formatarMoeda(total)}</strong></div>
            <p className="resumo-reserva__alerta">Voce tem 5 horas para submeter o comprovativo do pagamento.</p>

            <section className="pagamento-box">
              <h4>Informacoes de pagamento</h4>
              <p><span>Banco</span><strong>Banco Atlantico</strong></p>
              <p><span>Conta</span><strong>0000 0000 0000</strong></p>
              <p><span>IBAN</span><strong>AO06 0000 0000 0000 0000 0000 0</strong></p>
              <p><span>Beneficiario</span><strong>Hotel Fiesta</strong></p>
              <p><span>Referencia</span><strong>{referencia}</strong></p>
            </section>
          </aside>

          <form className="formulario-reserva" onSubmit={onSubmit}>
            <label>Nome do cliente
              <input value={formulario.nome} onChange={(e) => atualizarCampo('nome', e.target.value)} placeholder="Nome completo" />
            </label>

            <label>Email
              <input type="email" value={formulario.email} onChange={(e) => atualizarCampo('email', e.target.value)} placeholder="cliente@email.com" />
            </label>

            <label>Numero de telefone
              <input value={formulario.telefone} onChange={(e) => atualizarCampo('telefone', e.target.value)} placeholder="+244 900 000 000" />
            </label>

            <div className="formulario-reserva__datas">
              <label>Data de entrada
                <DatePicker
                  selected={formulario.dataEntrada}
                  onChange={(date) => atualizarCampo('dataEntrada', date)}
                  dateFormat="dd/MM/yyyy"
                  minDate={new Date()}
                  className="date-picker"
                  placeholderText="Selecionar"
                />
              </label>
              <label>Data de saida
                <DatePicker
                  selected={formulario.dataSaida}
                  onChange={(date) => atualizarCampo('dataSaida', date)}
                  dateFormat="dd/MM/yyyy"
                  minDate={formulario.dataEntrada || new Date()}
                  className="date-picker"
                  placeholderText="Selecionar"
                />
              </label>
            </div>

            <label>Quantidade de dias
              <input value={quantidadeDias || ''} readOnly placeholder="Calculado automaticamente" />
            </label>

            <label>Metodo de pagamento
              <select value={formulario.metodoPagamento} onChange={(e) => atualizarCampo('metodoPagamento', e.target.value)}>
                <option>Transferencia bancaria</option>
                <option>Deposito bancario</option>
                <option>Multicaixa Express</option>
              </select>
            </label>

            <label>Upload do comprovativo
              <input
                type="file"
                accept="application/pdf,image/png,image/jpeg"
                onChange={(e) => atualizarCampo('comprovativo', e.target.files?.[0] || null)}
              />
            </label>

            <button type="submit" className="btn-primary" disabled={carregando}>
              {carregando ? 'Confirmando...' : 'Confirmar Reserva'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
