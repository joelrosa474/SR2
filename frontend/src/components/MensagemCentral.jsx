import { useEffect, useState } from 'react';

let mostrarMensagem = () => {};

export const exibirMensagemCentral = (mensagem, tipo = 'info') => {
    mostrarMensagem({ mensagem, tipo, id: Date.now() });
};

export const MensagemCentral = () => {
    const [notificacao, setNotificacao] = useState(null);

    useEffect(() => {
        let temporizador;

        mostrarMensagem = (novaNotificacao) => {
            clearTimeout(temporizador);
            setNotificacao(novaNotificacao);
            temporizador = setTimeout(() => setNotificacao(null), 3600);
        };

        return () => {
            clearTimeout(temporizador);
            mostrarMensagem = () => {};
        };
    }, []);

    if (!notificacao) return null;

    return (
        <div className="mensagem-central" role="status" aria-live="polite">
            <div className={`mensagem-central__cartao mensagem-central__cartao--${notificacao.tipo}`}>
                {notificacao.mensagem}
            </div>
        </div>
    );
};
