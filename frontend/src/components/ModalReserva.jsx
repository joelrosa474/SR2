import { useMemo, useState } from 'react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import toast from 'react-hot-toast';
import { useAuth } from '../hooks/useAuth';
import logoHotel from '../assets/IMG/logo1.jpeg';

const gerarReferencia = () => {
  const caracteres = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  return Array.from({ length: 8 }, () => caracteres[Math.floor(Math.random() * caracteres.length)]).join('');
};

const formatarMoeda = (valor) => `${Number(valor || 0).toLocaleString('pt-AO')} Kz`;

const formatarData = (data) => data ? new Date(data).toLocaleDateString('pt-PT') : '-';

const carregarImagem = (src) => new Promise((resolve) => {
  const imagem = new Image();
  imagem.crossOrigin = 'anonymous';
  imagem.onload = () => resolve(imagem);
  imagem.onerror = () => resolve(null);
  imagem.src = src;
});

const quebrarTexto = (ctx, texto, larguraMaxima) => {
  const palavras = String(texto || '-').split(' ');
  const linhas = [];
  let linha = '';

  palavras.forEach((palavra) => {
    const teste = linha ? `${linha} ${palavra}` : palavra;
    if (ctx.measureText(teste).width <= larguraMaxima) {
      linha = teste;
      return;
    }
    if (linha) linhas.push(linha);
    linha = palavra;
  });

  if (linha) linhas.push(linha);
  return linhas;
};

const desenharTextoQuebrado = (ctx, texto, x, y, larguraMaxima, alturaLinha) => {
  const linhas = quebrarTexto(ctx, texto, larguraMaxima);
  linhas.forEach((linha, index) => ctx.fillText(linha, x, y + index * alturaLinha));
  return y + linhas.length * alturaLinha;
};

const desenharLinhaInfo = (ctx, rotulo, valor, x, y, largura, destaque = false) => {
  ctx.fillStyle = '#777777';
  ctx.font = '700 19px Outfit, Arial, sans-serif';
  ctx.fillText(rotulo.toUpperCase(), x, y);

  ctx.fillStyle = destaque ? '#B01E28' : '#161616';
  ctx.font = `${destaque ? '800' : '700'} 27px Outfit, Arial, sans-serif`;
  const proximoY = desenharTextoQuebrado(ctx, valor, x, y + 34, largura, 31);
  return proximoY + 22;
};

const desenharCartao = (ctx, x, y, largura, altura) => {
  ctx.fillStyle = '#ffffff';
  ctx.strokeStyle = '#e6e6e6';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.roundRect(x, y, largura, altura, 16);
  ctx.fill();
  ctx.stroke();
};

const criarPdfComImagem = (jpegDataUrl, largura, altura) => {
  const bytesImagem = atob(jpegDataUrl.split(',')[1]);
  const encoder = new TextEncoder();
  const partes = [];
  const offsets = [];
  let tamanho = 0;

  const adicionarTexto = (texto) => {
    const bytes = encoder.encode(texto);
    partes.push(bytes);
    tamanho += bytes.length;
  };

  const adicionarBinario = (binario) => {
    const bytes = new Uint8Array(binario.length);
    for (let i = 0; i < binario.length; i += 1) {
      bytes[i] = binario.charCodeAt(i);
    }
    partes.push(bytes);
    tamanho += bytes.length;
  };

  const objeto = (conteudo) => {
    offsets.push(tamanho);
    adicionarTexto(conteudo);
  };

  adicionarTexto('%PDF-1.4\n');
  objeto('1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj\n');
  objeto('2 0 obj << /Type /Pages /Kids [3 0 R] /Count 1 >> endobj\n');
  objeto(`3 0 obj << /Type /Page /Parent 2 0 R /MediaBox [0 0 ${largura} ${altura}] /Resources << /XObject << /Im0 4 0 R >> >> /Contents 5 0 R >> endobj\n`);
  objeto(`4 0 obj << /Type /XObject /Subtype /Image /Width ${largura} /Height ${altura} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${bytesImagem.length} >> stream\n`);
  adicionarBinario(bytesImagem);
  adicionarTexto('\nendstream endobj\n');
  const comandoImagem = `q ${largura} 0 0 ${altura} 0 0 cm /Im0 Do Q`;
  objeto(`5 0 obj << /Length ${comandoImagem.length} >> stream\n${comandoImagem}\nendstream endobj\n`);

  const inicioXref = tamanho;
  adicionarTexto(`xref\n0 ${offsets.length + 1}\n0000000000 65535 f \n`);
  offsets.forEach((offset) => adicionarTexto(`${String(offset).padStart(10, '0')} 00000 n \n`));
  adicionarTexto(`trailer << /Size ${offsets.length + 1} /Root 1 0 R >>\nstartxref\n${inicioXref}\n%%EOF`);

  const pdf = new Uint8Array(tamanho);
  let posicao = 0;
  partes.forEach((parte) => {
    pdf.set(parte, posicao);
    posicao += parte.length;
  });
  return pdf;
};

const baixarPdfReserva = async ({ referencia, quarto, formulario, quantidadeDias, total }) => {
  const largura = 1240;
  const altura = 1754;
  const margem = 92;
  const canvas = document.createElement('canvas');
  canvas.width = largura;
  canvas.height = altura;
  const ctx = canvas.getContext('2d');
  const logo = await carregarImagem(logoHotel);

  ctx.fillStyle = '#f7f7f7';
  ctx.fillRect(0, 0, largura, altura);
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(margem - 28, margem - 28, largura - margem * 2 + 56, altura - margem * 2 + 56);

  ctx.fillStyle = '#B01E28';
  ctx.fillRect(margem - 28, margem - 28, largura - margem * 2 + 56, 18);

  if (logo) {
    ctx.save();
    ctx.beginPath();
    ctx.roundRect(margem, margem + 16, 122, 122, 18);
    ctx.clip();
    ctx.drawImage(logo, margem, margem + 16, 122, 122);
    ctx.restore();
  } else {
    ctx.fillStyle = '#B01E28';
    ctx.beginPath();
    ctx.roundRect(margem, margem + 16, 122, 122, 18);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.font = '800 44px Playfair Display, Georgia, serif';
    ctx.fillText('HF', margem + 32, margem + 92);
  }

  ctx.fillStyle = '#111111';
  ctx.font = '700 50px Playfair Display, Georgia, serif';
  ctx.fillText('Hotel Fiesta', margem + 154, margem + 64);
  ctx.fillStyle = '#666666';
  ctx.font = '500 24px Outfit, Arial, sans-serif';
  ctx.fillText('Comprovativo de Reserva', margem + 154, margem + 102);
  ctx.fillText('Validacao pendente apos conferencia do pagamento', margem + 154, margem + 136);

  ctx.fillStyle = '#B01E28';
  ctx.font = '800 29px Outfit, Arial, sans-serif';
  ctx.fillText(`#${referencia}`, largura - margem - 190, margem + 72);
  ctx.fillStyle = '#777777';
  ctx.font = '700 18px Outfit, Arial, sans-serif';
  ctx.fillText('REFERENCIA', largura - margem - 190, margem + 36);

  let y = margem + 220;
  desenharCartao(ctx, margem, y, largura - margem * 2, 190);
  ctx.fillStyle = '#111111';
  ctx.font = '700 34px Playfair Display, Georgia, serif';
  ctx.fillText(`Suite ${quarto.numero}`, margem + 34, y + 58);
  ctx.fillStyle = '#666666';
  ctx.font = '500 22px Outfit, Arial, sans-serif';
  desenharTextoQuebrado(ctx, quarto.tipo, margem + 34, y + 96, 510, 28);
  ctx.fillStyle = '#B01E28';
  ctx.font = '800 38px Outfit, Arial, sans-serif';
  ctx.fillText(formatarMoeda(total), largura - margem - 340, y + 74);
  ctx.fillStyle = '#777777';
  ctx.font = '700 18px Outfit, Arial, sans-serif';
  ctx.fillText('TOTAL A PAGAR', largura - margem - 340, y + 34);
  ctx.fillStyle = '#111111';
  ctx.font = '700 24px Outfit, Arial, sans-serif';
  ctx.fillText(`${quantidadeDias} dia(s)`, largura - margem - 340, y + 118);
  ctx.fillText(`${formatarMoeda(quarto.preco)} / diaria`, largura - margem - 340, y + 154);

  y += 250;
  ctx.fillStyle = '#111111';
  ctx.font = '700 32px Playfair Display, Georgia, serif';
  ctx.fillText('Dados do cliente', margem, y);
  y += 42;
  desenharCartao(ctx, margem, y, largura - margem * 2, 250);
  const colunaEsq = margem + 34;
  const colunaDir = margem + 560;
  let yEsq = y + 48;
  let yDir = y + 48;
  yEsq = desenharLinhaInfo(ctx, 'Nome', formulario.nome, colunaEsq, yEsq, 450);
  yEsq = desenharLinhaInfo(ctx, 'Telefone', formulario.telefone, colunaEsq, yEsq, 450);
  yDir = desenharLinhaInfo(ctx, 'Email', formulario.email, colunaDir, yDir, 510);
  desenharLinhaInfo(ctx, 'Metodo', formulario.metodoPagamento, colunaDir, yDir, 510);

  y += 330;
  ctx.fillStyle = '#111111';
  ctx.font = '700 32px Playfair Display, Georgia, serif';
  ctx.fillText('Detalhes da estadia', margem, y);
  y += 42;
  desenharCartao(ctx, margem, y, largura - margem * 2, 300);
  yEsq = y + 48;
  yDir = y + 48;
  yEsq = desenharLinhaInfo(ctx, 'Entrada', formatarData(formulario.dataEntrada), colunaEsq, yEsq, 450);
  yEsq = desenharLinhaInfo(ctx, 'Saida', formatarData(formulario.dataSaida), colunaEsq, yEsq, 450);
  yDir = desenharLinhaInfo(ctx, 'Tipo de diaria', 'Diaria completa', colunaDir, yDir, 510);
  yDir = desenharLinhaInfo(ctx, 'Valor da diaria', formatarMoeda(quarto.preco), colunaDir, yDir, 510);
  desenharLinhaInfo(ctx, 'Status', 'Pendente de validacao', colunaDir, yDir, 510, true);

  y += 380;
  desenharCartao(ctx, margem, y, largura - margem * 2, 190);
  ctx.fillStyle = '#B01E28';
  ctx.font = '800 24px Outfit, Arial, sans-serif';
  ctx.fillText('IMPORTANTE', margem + 34, y + 48);
  ctx.fillStyle = '#333333';
  ctx.font = '500 23px Outfit, Arial, sans-serif';
  desenharTextoQuebrado(
    ctx,
    'A reserva fica pendente ate a equipa do Hotel Fiesta validar o comprovativo de pagamento. Guarde este documento e apresente a referencia quando necessario.',
    margem + 34,
    y + 88,
    largura - margem * 2 - 68,
    32,
  );

  ctx.fillStyle = '#777777';
  ctx.font = '500 19px Outfit, Arial, sans-serif';
  ctx.fillText(`Documento gerado em ${new Date().toLocaleString('pt-PT')}`, margem, altura - margem);
  ctx.fillText('Hotel Fiesta - Sistema de Reservas', largura - margem - 330, altura - margem);

  const jpegDataUrl = canvas.toDataURL('image/jpeg', 0.92);
  const pdfBytes = criarPdfComImagem(jpegDataUrl, largura, altura);
  const url = URL.createObjectURL(new Blob([pdfBytes], { type: 'application/pdf' }));
  const link = document.createElement('a');
  link.href = url;
  link.download = `reserva-${referencia}.pdf`;
  link.click();
  URL.revokeObjectURL(url);
};

export const ModalReserva = ({ quarto, onClose, onReservar }) => {
  const { usuario } = useAuth();
  const [carregando, setCarregando] = useState(false);
  const [referencia] = useState(gerarReferencia);
  const [etapa, setEtapa] = useState('dados');
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

  const validarDadosReserva = () => {
    if (!formulario.nome.trim() || !formulario.email.trim() || !formulario.telefone.trim()) {
      toast.error('Preencha os dados do cliente.');
      return false;
    }

    if (!formulario.dataEntrada || !formulario.dataSaida || quantidadeDias < 1) {
      toast.error('A data de saida deve ser maior que a data de entrada.');
      return false;
    }

    return true;
  };

  const avancarParaPagamento = (evento) => {
    evento.preventDefault();
    if (validarDadosReserva()) {
      setEtapa('pagamento');
    }
  };

  const confirmarReserva = async (evento) => {
    evento.preventDefault();

    if (!validarDadosReserva()) return;

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
      await baixarPdfReserva({ referencia, quarto, formulario, quantidadeDias, total });
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
          </aside>

          {etapa === 'dados' ? (
            <form className="formulario-reserva" onSubmit={avancarParaPagamento}>
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

              <button type="submit" className="btn-primary">
                Fazer Reserva
              </button>
            </form>
          ) : (
            <form className="formulario-reserva" onSubmit={confirmarReserva}>
              <section className="pagamento-box pagamento-box--formulario">
                <h4>Informacoes de pagamento</h4>
                <p><span>Banco</span><strong>Banco Atlantico</strong></p>
                <p><span>Conta</span><strong>0000 0000 0000</strong></p>
                <p><span>IBAN</span><strong>AO06 0000 0000 0000 0000 0000 0</strong></p>
                <p><span>Beneficiario</span><strong>Hotel Fiesta</strong></p>
                <p><span>Referencia</span><strong>{referencia}</strong></p>
              </section>

              <label>Upload do comprovativo
                <input
                  type="file"
                  accept="application/pdf,image/png,image/jpeg"
                  onChange={(e) => atualizarCampo('comprovativo', e.target.files?.[0] || null)}
                />
              </label>

              <div className="formulario-reserva__acoes">
                <button type="button" className="btn-secondary" onClick={() => setEtapa('dados')}>
                  Voltar
                </button>
                <button type="submit" className="btn-primary" disabled={carregando}>
                  {carregando ? 'Confirmando...' : 'Confirmar Reserva'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
