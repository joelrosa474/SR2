const BASE_URL = import.meta.env.VITE_API_URL || 'https://sr2-41zp.onrender.com';
const TOKEN_STORAGE_KEY = 'hotel_fiesta_access_token';

const obterToken = () => localStorage.getItem(TOKEN_STORAGE_KEY);

const guardarToken = (token) => {
    if (token) localStorage.setItem(TOKEN_STORAGE_KEY, token);
};

const limparToken = () => localStorage.removeItem(TOKEN_STORAGE_KEY);

async function fetchComAuth(endpoint, options = {}) {
    const { redirectOn401 = true, ...fetchOptions } = options;
    const bodyEhFormulario = fetchOptions.body instanceof FormData;
    const token = obterToken();
    const headers = {
        ...(bodyEhFormulario ? {} : { 'Content-Type': 'application/json' }),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...fetchOptions.headers,
    };

    const response = await fetch(`${BASE_URL}${endpoint}`, {
        ...fetchOptions,
        headers,
        credentials: 'include',
    });

    if (response.status === 401 && redirectOn401) {
        limparToken();
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

        const dados = await response.json();
        guardarToken(dados.access_token);
        return dados;
    },

    logout: async () => {
        try {
            return await fetchComAuth('/logout', {
                method: 'POST',
                redirectOn401: false,
            });
        } finally {
            limparToken();
        }
    },

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
    realizarReservaComComprovativo: (dados) => fetchComAuth('/reservas/com-comprovativo', {
        method: 'POST',
        body: dados,
    }),
    obterUrlComprovativo: (id) => `${BASE_URL}/reservas/${id}/comprovativo`,
    baixarComprovativo: async (id) => {
        const token = obterToken();
        const response = await fetch(`${BASE_URL}/reservas/${id}/comprovativo`, {
            credentials: 'include',
            headers: token ? { Authorization: `Bearer ${token}` } : {},
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.detail || 'Erro ao baixar comprovativo');
        }

        return response.blob();
    },
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
