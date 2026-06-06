import { useEffect, useState } from 'react';
import { observarRequisicoes } from '../servicos/api';

export const BarraProgressoServidor = () => {
    const [ativo, setAtivo] = useState(false);

    useEffect(() => observarRequisicoes(setAtivo), []);

    return (
        <div
            className={`barra-progresso-servidor${ativo ? ' barra-progresso-servidor--ativa' : ''}`}
            aria-hidden={!ativo}
        >
            <span />
        </div>
    );
};
