document.addEventListener("DOMContentLoaded", () => {
    const hamburgerBtn = document.getElementById('hamburgerBtn');
    const mobileDrawer = document.getElementById('mobileDrawer');
    const drawerClose = document.getElementById('drawerClose');

    // Captura todos os links de dentro do menu mobile
    const drawerLinks = mobileDrawer.querySelectorAll('a');

    // Função centralizada para abrir o Menu
    function openDrawer() {
        mobileDrawer.classList.add('open');
        document.body.style.overflow = 'hidden'; // Trava o scroll da página ao fundo
    }

    // Função centralizada para fechar o Menu
    function closeDrawer() {
        mobileDrawer.classList.remove('open');
        document.body.style.overflow = ''; // Devolve o scroll natural da página
    }

    // Disparadores de Eventos Básicos
    if (hamburgerBtn && mobileDrawer && drawerClose) {
        hamburgerBtn.addEventListener('click', (e) => {
            e.stopPropagation(); // Evita que o evento borbulhe indesejadamente
            openDrawer();
        });

        drawerClose.addEventListener('click', closeDrawer);

        // EXTRA: Fecha o menu automaticamente se clicar em qualquer link de ancoragem
        drawerLinks.forEach(link => {
            link.addEventListener('click', closeDrawer);
        });
    }

    // EXTRA RESILIENTE: Se o usuário girar o tablet/celular e passar do limite mobile, fecha o menu sozinho
    window.addEventListener('resize', () => {
        if (window.innerWidth > 768 && mobileDrawer.classList.contains('open')) {
            closeDrawer();
        }
    });
});




// Registra o plugin ScrollTrigger no GSAP
gsap.registerPlugin(ScrollTrigger);

// Criamos uma Timeline vinculada ao Scroll da seção Hero
const heroTimeline = gsap.timeline({
    scrollTrigger: {
        trigger: ".hero",           // O gatilho da animação é a seção Hero
        start: "top top",           // Começa assim que o topo do Hero bate no topo da tela
        end: "bottom top",          // Termina quando o fundo do Hero sai pelo topo da tela
        scrub: 1,                   // Sincroniza a animação com o movimento do scroll (suavidade de 1 segundo)
    }
});

// 1. Animação da Lata Central (Cresce levemente e desce girando com o scroll)
heroTimeline.to(".hero-can", {
    y: 80,
    rotate: 15,
    scale: 1.05,
    duration: 1
}, 0); // O "0" faz todas as animações começarem juntas

// 2. Elementos Flutuantes se espalhando (Efeito Paralaxe Explosivo)
heroTimeline.to(".float-orange-top", {
    y: -70,
    x: -40,
    rotate: -25,
    duration: 1
}, 0);

heroTimeline.to(".float-orange-bottom", {
    y: 100,
    x: -60,
    rotate: 60,
    duration: 1
}, 0);

heroTimeline.to(".float-mint-right", {
    y: -50,
    x: 50,
    rotate: 90,
    duration: 1
}, 0);

// 3. Textos e Badges sumindo suavemente para as laterais
heroTimeline.to(".hero-left", {
    x: -50,
    opacity: 0,
    duration: 0.8
}, 0);

heroTimeline.to(".hero-right", {
    x: 50,
    opacity: 0,
    duration: 0.8
}, 0);

// 4. Marca d'água de fundo correndo para os lados opostos
heroTimeline.to(".hero-watermark span:first-child", {
    x: -100,
    opacity: 0.1,
    duration: 1
}, 0);

heroTimeline.to(".hero-watermark span:last-child", {
    x: 100,
    opacity: 0.1,
    duration: 1
}, 0);