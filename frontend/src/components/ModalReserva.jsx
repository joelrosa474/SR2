import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import toast from 'react-hot-toast';

const schema = yup.object({
  dataEntrada: yup.date().required('Data de entrada e obrigatoria').min(new Date(), 'Data deve ser futura'),
  dataSaida: yup.date()
    .required('Data de saida e obrigatoria')
    .test('apos-entrada', 'Data de saida deve ser apos entrada', function (value) {
      const { dataEntrada } = this.parent;
      return value && dataEntrada && value > dataEntrada;
    }),
});

export const ModalReserva = ({ quarto, onClose, onReservar }) => {
  const [carregando, setCarregando] = useState(false);

  const { handleSubmit, setValue, watch, formState: { errors } } = useForm({
    resolver: yupResolver(schema),
  });

  const dataEntrada = watch('dataEntrada');
  const dataSaida = watch('dataSaida');

  const onSubmit = async (data) => {
    setCarregando(true);
    try {
      await onReservar({
        quarto_id: quarto.id,
        data_entrada: data.dataEntrada.toISOString(),
        data_saida: data.dataSaida.toISOString(),
      });
      toast.success('Solicitacao de reserva enviada com sucesso!');
      onClose();
    } catch (err) {
      toast.error('Nao foi possivel processar a reserva: ' + err.message);
    } finally {
      setCarregando(false);
    }
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0,0,0,0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 2000,
    }} onClick={onClose}>
      <div className="card-fiesta" style={{ maxWidth: '500px', width: '90%' }} onClick={e => e.stopPropagation()}>
        <h2 className="brand-font" style={{ marginBottom: '20px' }}>Reservar Suite {quarto.numero}</h2>
        <p style={{ marginBottom: '20px', color: 'var(--text-muted)' }}>{quarto.descricao}</p>

        <form onSubmit={handleSubmit(onSubmit)}>
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600' }}>Data de Entrada</label>
            <DatePicker
              selected={dataEntrada}
              onChange={date => setValue('dataEntrada', date, { shouldValidate: true })}
              dateFormat="dd/MM/yyyy"
              minDate={new Date()}
              className="date-picker"
              placeholderText="Selecione a data"
            />
            {errors.dataEntrada && <p style={{ color: 'red', fontSize: '0.8rem' }}>{errors.dataEntrada.message}</p>}
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600' }}>Data de Saida</label>
            <DatePicker
              selected={dataSaida}
              onChange={date => setValue('dataSaida', date, { shouldValidate: true })}
              dateFormat="dd/MM/yyyy"
              minDate={dataEntrada || new Date()}
              className="date-picker"
              placeholderText="Selecione a data"
            />
            {errors.dataSaida && <p style={{ color: 'red', fontSize: '0.8rem' }}>{errors.dataSaida.message}</p>}
          </div>

          <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
            <button type="button" onClick={onClose} className="btn-secondary" style={{ background: 'var(--text-muted)' }}>
              Cancelar
            </button>
            <button type="submit" className="btn-primary" disabled={carregando}>
              {carregando ? 'Reservando...' : 'Reservar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
