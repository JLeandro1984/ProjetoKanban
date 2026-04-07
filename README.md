# Controle de Projetos - Kanban

Aplicação web Kanban para gestão de projetos com visual profissional e cards no estilo post-it, desenvolvida com HTML, CSS e JavaScript puro.

## Visao geral

Este projeto foi pensado para equilibrar:

- Interface corporativa limpa e organizada
- Experiencia visual criativa com cards de papel adesivo
- Estrutura de codigo simples para evolucao futura

A tela conta com cinco colunas padrao de fluxo de trabalho, filtros dinâmicos, ordenacao, drag-and-drop e persistencia local.

## Funcionalidades

- Header com busca global e filtros
- Criacao, edicao e exclusao de cards via modal
- Drag-and-drop entre colunas
- Persistencia com localStorage
- Contador automatico de cards por coluna
- Filtro por texto
- Filtro por prioridade
- Filtro por responsavel
- Ordenacao por:
  - mais recente
  - prioridade (alta para baixa)
  - prioridade (baixa para alta)
  - prazo (mais proximo)
  - prazo (mais distante)
- Toasts de confirmacao para acoes-chave
- Instalacao opcional como PWA (Progressive Web App)
- Cache basico offline para arquivos do app shell

## Estilo visual

- Layout responsivo para desktop e mobile
- Colunas com visual elegante e separacao clara
- Cards com comportamento de post-it:
  - cor aleatoria
  - rotacao aleatoria sutil
  - sombra suave
  - fita no topo
  - dobra no canto inferior
  - textura leve de papel
- Animacoes suaves de hover e arraste

## Estrutura do projeto

- index.html: estrutura semantica da interface
- style.css: tema visual, responsividade, animacoes e estilos de componentes
- script.js: estado da aplicacao, renderizacao, eventos, persistencia e regras de negocio
- manifest.webmanifest: metadados PWA (nome, icones, tema e modo standalone)
- service-worker.js: cache e estrategia de resposta offline
- assets/icon.svg: icone profissional do aplicativo

## Como executar

1. Baixe ou clone este repositorio.
2. Abra a pasta do projeto no VS Code.
3. Abra o arquivo index.html no navegador.

Opcionalmente, use uma extensao como Live Server para recarregamento automatico.

## Opcao PWA

O projeto esta preparado para funcionar como aplicativo instalavel.

1. Execute por servidor local (exemplo: Live Server).
2. Abra no navegador compatível (Chrome/Edge).
3. Clique no botao "Instalar App" quando ele aparecer no topo.

### Observacoes

- O botao de instalacao aparece somente quando o navegador dispara o evento beforeinstallprompt.
- Em ambiente local sem HTTPS, alguns navegadores podem limitar a instalacao.
- O service worker faz cache dos arquivos principais para melhorar abertura recorrente e suporte offline parcial.

## Dados iniciais (mock)

Ao abrir pela primeira vez, o board carrega cards de exemplo com tarefas reais de desenvolvimento, como:

- Criar tela de login
- Integrar API de pagamento
- Ajustar responsividade mobile
- Configurar pipeline CI/CD

Esses dados sao salvos no localStorage apos qualquer alteracao.

## Arquitetura e evolucao

A logica foi organizada para facilitar evolucao futura:

- Estado central da aplicacao (cards e filtros)
- Repositorio de dados isolado (cardRepository)
- Renderizacao desacoplada das acoes
- Funcoes reutilizaveis para filtros e ordenacao

### Proximos passos sugeridos

- Integracao com Firebase Firestore
- Integracao com API REST (Node, .NET, Java, etc.)
- Autenticacao e permissao por usuario
- Historico de mudancas por card
- Notificacoes e alertas de vencimento

## Licenca

Uso livre para fins de estudo, adaptacao e apresentacao de portifolio.
