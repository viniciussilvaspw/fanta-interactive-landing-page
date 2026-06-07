# 📍 Fanta Store Locator Premium

Um localizador de pontos de venda interativo, responsivo e de alta performance desenvolvido puramente em **Vanilla JavaScript (ES6+)**. O ecossistema permite que os utilizadores encontrem estabelecimentos parceiros que vendem produtos Fanta próximos da sua localização atual, seja por captura automatizada via GPS (Geolocalização nativa) ou por pesquisa manual de cidades.

---

## 📸 Interface do Projeto

Abaixo podes ver o layout e o design visual implementado para o ecossistema do localizador de lojas Fanta, construído com foco na experiência do utilizador e responsividade móvel:

![Layout do Localizador de Lojas Fanta](imagem-site.jpeg)

---

## ✨ Demonstração das Funcionalidades

* **Geolocalização Ativa (Reativa):** Captura em tempo real as coordenadas geográficas (`Latitude` e `Longitude`) do hardware do utilizador via satélite ou triangulação de rede.
* **Busca Manual com Autocomplete (Debounce):** Fallback inteligente utilizando a API do *OpenStreetMap (Nominatim)* para geocodificar cidades ou ruas digitadas, sem travar a interface.
* **Gerador Geográfico Dinâmico (Modo Demo):** Caso nenhuma chave de API comercial esteja configurada, o sistema aciona um algoritmo matemático baseado na fórmula de *Haversine* para dispersar lojas plausíveis e reais ao redor do utilizador, evitando erros regionais (ex: exibição de redes inexistentes localmente).
* **Rotas Universais:** Integração direta com o Google Maps para traçar rotas de navegação (`Ver Rota`) ou visualizar o ponto comercial (`Abrir no Maps`).
* **Arquitetura Baseada em Estados:** Gerenciamento visual fluído através de estados de UI (`loading`, `error`, `results`, `prompt`).

![Layout do Localizador de Lojas Fanta](locations.png)

---

## 🛠️ Tecnologias Utilizadas

* **HTML5 & CSS3:** Estrutura semântica e estilização personalizada com os padrões visuais vibrantes da marca.
* **Vanilla JavaScript (ES6+):** Lógica assíncrona (`async/await`), manipulação precisa do DOM e proteção de concorrência com *Debounce*.
* **OpenStreetMap Nominatim API:** Serviço gratuito e sem chaves para geocodificação de endereços.
* **Foursquare Places API (Opcional):** Arquitetura preparada para integração de dados comerciais do mundo real em produção.

---

## 🚀 Como Executar o Projeto Localmente

Devido às restrições de segurança estritas dos navegadores modernos em relação à API de Geolocalização (`navigator.geolocation`), **o projeto não funcionará corretamente se for aberto dando duplo clique direto no ficheiro HTML (`file:///`)**. Ele precisa de ser executado através de um servidor local (`http://localhost`).

### Passo 1: Clonar ou Baixar os Arquivos
Certifica-te de que a estrutura de pastas está organizada da seguinte forma:
```text
├── index.html
├── css/
│   └── styles.css (ou o teu ficheiro de estilos)
└── js/
    └── Locations.js