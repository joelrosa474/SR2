const imagensPorCaminho = import.meta.glob('../assets/IMG/*.{jpg,jpeg,png,webp}', {
    eager: true,
    import: 'default',
});

const imagem = (nome) => imagensPorCaminho[`../assets/IMG/${nome}`];

const secoesGaleria = [
    {
        id: 'quartos',
        titulo: 'Quartos',
        descricao: 'Ambientes preparados para descanso, conforto e privacidade durante a estadia.',
        imagens: [
            { src: imagem('Quarto1.jpeg'), alt: 'Quarto com cama arrumada no Hotel Fiesta' },
            { src: imagem('Quarto2.jpeg'), alt: 'Quarto acolhedor do Hotel Fiesta' },
            { src: imagem('Quarto3.jpeg'), alt: 'Quarto com mobiliario do Hotel Fiesta' },
        ],
    },
    {
        id: 'cozinha',
        titulo: 'Cozinha',
        descricao: 'Espacos de preparo e servico pensados para refeicoes praticas e bem cuidadas.',
        imagens: [
            { src: imagem('cozinha1.jpeg'), alt: 'Cozinha do Hotel Fiesta' },
            { src: imagem('cozinha2.jpeg'), alt: 'Bancada da cozinha do Hotel Fiesta' },
            { src: imagem('cozinha3.jpeg'), alt: 'Area interna da cozinha do Hotel Fiesta' },
            { src: imagem('cozinha4.jpeg'), alt: 'Equipamentos da cozinha do Hotel Fiesta' },
            { src: imagem('pratos1.jpeg'), alt: 'Prato servido no Hotel Fiesta' },
            { src: imagem('pratos2.jpeg'), alt: 'Refeicao preparada no Hotel Fiesta' },
        ],
    },
    {
        id: 'suites',
        titulo: 'Suites',
        descricao: 'Suites com acabamento elegante para quem procura uma experiencia mais reservada.',
        imagens: [
            { src: imagem('Suite Vip1.jpeg'), alt: 'Suite VIP do Hotel Fiesta' },
            { src: imagem('Suite VIp2 (2).jpeg'), alt: 'Suite VIP com cama preparada' },
            { src: imagem('Suipe Vip3.jpeg'), alt: 'Suite VIP com decoracao interna' },
            { src: imagem('Suipe Vip4.jpeg'), alt: 'Suite VIP espacosa do Hotel Fiesta' },
            { src: imagem('Suipe Vip4 (2).jpeg'), alt: 'Outro angulo da Suite VIP' },
        ],
    },
    {
        id: 'exterior',
        titulo: 'Parte de Fora',
        descricao: 'Fachada, varanda e areas externas para reconhecer o hotel antes de chegar.',
        imagens: [
            { src: imagem('Fora1.jpeg'), alt: 'Parte externa do Hotel Fiesta' },
            { src: imagem('Fora2.jpeg'), alt: 'Fachada do Hotel Fiesta' },
            { src: imagem('Fora3.jpeg'), alt: 'Entrada exterior do Hotel Fiesta' },
            { src: imagem('Fora4.jpeg'), alt: 'Area externa do Hotel Fiesta' },
            { src: imagem('Fora8.jpeg'), alt: 'Vista externa do Hotel Fiesta' },
            { src: imagem('Varanda.jpeg'), alt: 'Varanda do Hotel Fiesta' },
        ],
    },
    {
        id: 'interior',
        titulo: 'Parte de Dentro',
        descricao: 'Detalhes dos ambientes internos, corredores e areas de circulacao do Hotel Fiesta.',
        imagens: [
            { src: imagem('WhatsApp Image 2026-05-11 at 11.27.09 (2).jpeg'), alt: 'Ambiente interno do Hotel Fiesta' },
            { src: imagem('WhatsApp Image 2026-05-11 at 11.27.09 (3).jpeg'), alt: 'Area interna iluminada do Hotel Fiesta' },
            { src: imagem('WhatsApp Image 2026-05-11 at 11.27.12 (1).jpeg'), alt: 'Detalhe de area interna do Hotel Fiesta' },
            { src: imagem('WhatsApp Image 2026-05-11 at 11.27.14 (1).jpeg'), alt: 'Espaco interno do Hotel Fiesta' },
            { src: imagem('WhatsApp Image 2026-05-11 at 11.27.14 (2).jpeg'), alt: 'Interior do Hotel Fiesta' },
            { src: imagem('WhatsApp Image 2026-05-11 at 11.27.15.jpeg'), alt: 'Area de dentro do Hotel Fiesta' },
        ],
    },
];

export const PaginaGaleriaHotel = () => {
    const secoesComImagens = secoesGaleria.map((secao) => ({
        ...secao,
        imagens: secao.imagens.filter((item) => item.src),
    }));

    const imagemDestaque = secoesComImagens.find((secao) => secao.imagens.length)?.imagens[0]?.src;

    return (
        <main className="pagina-galeria-hotel">
            <section className="galeria-hero" style={{ backgroundImage: `url(${imagemDestaque})` }}>
                <div className="galeria-hero__conteudo">
                    <span>Galeria de fotos</span>
                    <h1 className="brand-font">Hotel Fiesta</h1>
                    <p>Conheca os quartos, suites, cozinha e os principais ambientes de dentro e de fora do hotel.</p>
                </div>
            </section>

            <nav className="galeria-categorias" aria-label="Categorias da galeria">
                {secoesComImagens.map((secao) => (
                    <a key={secao.id} href={`#${secao.id}`}>
                        {secao.titulo}
                    </a>
                ))}
            </nav>

            {secoesComImagens.map((secao) => (
                <section key={secao.id} id={secao.id} className="galeria-secao">
                    <div className="galeria-secao__cabecalho">
                        <span>{String(secao.imagens.length).padStart(2, '0')} fotos</span>
                        <h2 className="brand-font">{secao.titulo}</h2>
                        <p>{secao.descricao}</p>
                    </div>

                    <div className="galeria-grid">
                        {secao.imagens.map((item, index) => (
                            <figure
                                key={`${secao.id}-${item.alt}-${index}`}
                                className="galeria-card"
                            >
                                <img src={item.src} alt={item.alt} loading="lazy" />
                                <figcaption>{item.alt}</figcaption>
                            </figure>
                        ))}
                    </div>
                </section>
            ))}
        </main>
    );
};
