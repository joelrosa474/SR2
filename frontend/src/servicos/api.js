const BASE_URL = 'http://localhost:8000';

async function fetchComAuth(endpoint, options = {}) {
    const { redirectOn401 = true, ...fetchOptions } = options;
    const headers = {
        'Content-Type': 'application/json',
        ...fetchOptions.headers,
    };

    const response = await fetch(`${BASE_URL}${endpoint}`, {
        ...fetchOptions,
        headers,
        credentials: 'include',
    });

    if (response.status === 401 && redirectOn401) {
        window.location.href = '/login';
        throw new Error('Sessao expirada. Faca login novamente.');
    }

    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Erro na requisicao');
    }

    return response.json();
}

export const apiServico = {
    login: async (email, senha) => {
        const formData = new URLSearchParams();
        formData.append('username', email);
        formData.append('password', senha);

        const response = await fetch(`${BASE_URL}/token`, {
            method: 'POST',
            body: formData,
            credentials: 'include',
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.detail || 'Login falhou');
        }

        return response.json();
    },

    logout: () => fetchComAuth('/logout', {
        method: 'POST',
        redirectOn401: false,
    }),

    me: () => fetchComAuth('/usuarios/me', {
        redirectOn401: false,
    }),

    sessao: () => fetchComAuth('/sessao', {
        redirectOn401: false,
    }),

    registrar: (dados) => fetchComAuth('/registrar', {
        method: 'POST',
        body: JSON.stringify(dados),
    }),

    // Quartos
    listarQuartos: () => fetchComAuth('/quartos/'),
    obterQuarto: (id) => fetchComAuth(`/quartos/${id}/`),
    criarQuarto: (dados) => fetchComAuth('/quartos/', {
        method: 'POST',
        body: JSON.stringify(dados),
    }),
    atualizarQuarto: (id, dados) => fetchComAuth(`/quartos/${id}/`, {
        method: 'PUT',
        body: JSON.stringify(dados),
    }),
    removerQuarto: (id) => fetchComAuth(`/quartos/${id}/`, {
        method: 'DELETE',
    }),

    // Usuarios/Funcionarios
    listarUsuarios: () => fetchComAuth('/usuarios/'),
    criarUsuario: (dados) => fetchComAuth('/usuarios/', {
        method: 'POST',
        body: JSON.stringify(dados),
    }),
    atualizarUsuario: (id, dados) => fetchComAuth(`/usuarios/${id}`, {
        method: 'PUT',
        body: JSON.stringify(dados),
    }),
    removerUsuario: (id) => fetchComAuth(`/usuarios/${id}/`, {
        method: 'DELETE',
    }),

    // Reservas
    listarReservas: () => fetchComAuth('/reservas/'),
    listarMinhasReservas: () => fetchComAuth('/reservas/minhas/'),
    realizarReserva: (dados) => fetchComAuth('/reservas/', {
        method: 'POST',
        body: JSON.stringify(dados),
    }),
    atualizarStatusReserva: (id, status) => fetchComAuth(`/reservas/${id}/status/?novo_status=${status}`, {
        method: 'PATCH',
    }),
    removerReserva: (id) => fetchComAuth(`/reservas/${id}/`, {
        method: 'DELETE',
    }),

    // Dashboard
    obterDashboard: () => fetchComAuth('/dashboard/'),

    // Itens Adicionais
    listarItensAdicionais: () => fetchComAuth('/itens-adicionais/'),
    criarItemAdicional: (dados) => fetchComAuth('/itens-adicionais/', {
        method: 'POST',
        body: JSON.stringify(dados),
    }),
    removerItemAdicional: (id) => fetchComAuth(`/itens-adicionais/${id}`, {
        method: 'DELETE',
    }),
};
