# Controle de Projetos - Kanban

Aplicação web Kanban para gestão de projetos com visual profissional e cards no estilo post-it, desenvolvida com HTML, CSS e JavaScript puro.

## Visao geral

Este projeto foi pensado para equilibrar:

- Interface corporativa limpa e organizada
- Experiencia visual criativa com cards de papel adesivo
- Estrutura de codigo simples para evolucao futura
- Persistencia 100% local, sem dependencia de servidor ou nuvem

A tela conta com cinco colunas padrao de fluxo de trabalho, filtros dinamicos, ordenacao, drag-and-drop e persistencia em diretorio local do usuario.

## Funcionalidades

- Header com busca global e filtros
- Criacao, edicao e exclusao de cards via modal
- Drag-and-drop entre colunas
- Contador automatico de cards por coluna
- Filtro por texto, data, prioridade e responsavel
- Destaque inteligente de prazo nos cards:
  - Estado "Vencido" para cards atrasados
  - Estado de alerta para cards que vencem em breve
  - Indicacao textual (vence hoje, amanha, em X dias, vencido ha X dias)
  - Priorizacao visual e de ordenacao para vencidos e proximos do vencimento
- Regras de ordenacao/exibicao:
  - Backlog: prioridade (Alta > Media > Baixa) e, em empate, prazo mais proximo
  - Concluido: exibe apenas os 30 mais recentes por padrao
  - Concluido: exibe todos quando houver pesquisa ativa (texto ou data)
- Ordenacao geral por mais recente, prioridade e prazo
- Datas automaticas nos cards:
  - Data de criacao exibida em todos os cards
  - Data e hora de conclusao exibidas apenas quando o card for movido para "Concluido"
  - Data de conclusao removida automaticamente se o card for reaberto
- Feedback e alertas:
  - Toast de sucesso discreto no canto superior direito (nao bloqueante)
  - Modal de alerta para erros e informacoes com acao
  - Fila de mensagens para notificacoes modais
- Instalacao opcional como PWA (Progressive Web App)
- Cache basico offline para arquivos do app shell

### Persistencia em diretorio local

O app nao usa localStorage para os dados dos cards. Na primeira utilizacao, e obrigatorio selecionar uma pasta local onde os dados serao gravados.

- Os cards sao lidos e salvos diretamente no arquivo `kanban-data.json` dentro da pasta escolhida
- A cada alteracao, um snapshot e criado automaticamente em uma subpasta `history/`
- O diretorio configurado e lembrado entre sessoes (via IndexedDB)
- Dados legados do localStorage sao migrados automaticamente na primeira abertura com diretorio configurado

#### Acesso e botoes de gerenciamento

Os controles de persistencia ficam na tela de Configuracoes, acessada pelo icone de engrenagem no canto superior direito.

| Botao | Funcao |
|---|---|
| Diretorio Ativo / Selecionar Diretorio | Escolhe (ou troca) a pasta local de dados |
| Restaurar Ultimo | Restaura o snapshot mais recente da pasta `history/` |

Na modal de Configuracoes:

- Indicador de status (bolinha semaforo):
  - Verde quando ha diretorio ativo
  - Vermelho quando nao ha diretorio configurado
- Exibicao do diretorio selecionado (nome da pasta, conforme permissao do navegador)
- Ajuste de inicio do alerta de prazo:
  - Valor padrao de 2 dias
  - Configuravel pelo usuario
- Ajuste da duracao do toast de sucesso:
  - Valor padrao de 2.8 segundos
  - Limite maximo de 5 segundos

#### Compatibilidade

Este recurso utiliza a File System Access API, suportada em navegadores baseados em Chromium (Chrome, Edge, Opera). Nao funciona no Firefox ou Safari.

Para usar o mesmo diretorio em outro navegador ou maquina, basta clicar em "Selecionar Diretorio" e apontar para a mesma pasta.

## Cards

Cada card contem:

- Titulo
- Descricao
- Responsavel
- Prioridade (Baixa, Media, Alta)
- Prazo
- Tag / Categoria
- Cor personalizada
- Seletor rapido com 6 cores classicas de post-it e opcao de cor livre
- Coluna de destino
- Observacao opcional (icone dedicado no card, com modal exclusiva para adicionar/visualizar/editar)
- Data de criacao (automatica)
- Data e hora de conclusao (automatica, exibida apenas na coluna "Concluido")

## Estilo visual

- Layout responsivo para desktop e mobile
- Topbar com filtros em grid e alinhamento fluido
- Botao de Configuracoes em icone-only no canto superior direito, com estado ativo quando a modal esta aberta
- Colunas com visual elegante e separacao clara
- Cards com comportamento de post-it:
  - cor personalizada pelo usuario
  - presets visuais com 6 cores comuns de post-it
  - rotacao sutil aleatoria
  - sombra suave
  - fita no topo
  - dobra no canto inferior
  - textura leve de papel
- Acao de observacao por card:
  - icone com estado "sem observacao" e "com observacao"
  - modal exclusiva para edicao da observacao
- Animacoes suaves de hover e arraste
- Notificacoes com dois niveis:
  - toast de sucesso com fade-in/fade-out e auto-fechamento
  - modal de alerta para erro/info com botao de acao configuravel e fechamento ao clicar fora

## Estrutura do projeto

- `index.html` — estrutura semantica da interface
- `style.css` — tema visual, responsividade, animacoes e estilos de componentes
- `script.js` — estado da aplicacao, renderizacao, eventos, persistencia local e regras de negocio
- `manifest.webmanifest` — metadados PWA
- `service-worker.js` — cache e estrategia de resposta offline
- `assets/icon.svg` — icone do aplicativo

### Arquivos gerados em execucao (na pasta escolhida pelo usuario)

- `kanban-data.json` — dados atuais dos cards
- `history/kanban-snapshot-<timestamp>.json` — historico de snapshots automaticos

## Como executar

1. Baixe ou clone este repositorio.
2. Abra o arquivo `index.html` em um navegador baseado em Chromium (Chrome ou Edge).
3. Na primeira abertura, confirme o alerta de diretorio e abra Configuracoes.
4. Clique em **Selecionar Diretorio** e escolha uma pasta local para os dados.
5. O board inicia vazio e passa a salvar os cards no diretorio selecionado.

Opcionalmente, use uma extensao como Live Server para recarregamento automatico durante o desenvolvimento.

## Opcao PWA

O projeto esta preparado para funcionar como aplicativo instalavel.

1. Execute por servidor local (exemplo: Live Server).
2. Abra no Chrome ou Edge.
3. Clique no botao "Instalar App" quando ele aparecer no topo.

### Observacoes

- O botao de instalacao aparece somente quando o navegador dispara o evento `beforeinstallprompt`.
- Em ambiente local sem HTTPS, alguns navegadores podem limitar a instalacao.
- O service worker faz cache dos arquivos principais para abertura recorrente e suporte offline parcial.

## Dados iniciais

Ao configurar o diretorio pela primeira vez (sem dados previos), o board inicia sem cards.
Os cards sao criados manualmente pelo usuario e salvos imediatamente no arquivo local.

## Arquitetura

- Estado central da aplicacao (`state`)
- Repositorio de dados isolado (`cardRepository`) com operacoes async sobre o sistema de arquivos
- `backupManager` centraliza leitura, escrita e snapshots no diretorio local
- Renderizacao desacoplada das acoes
- Sistema de notificacoes hibrido:
  - fila modal para alertas de erro/info (`alertQueue`)
  - stack de toast para sucessos nao bloqueantes (`successToastStack`)

### Proximos passos sugeridos

- Integracao com base de dados compartilhada para uso em equipe (Firebase, Supabase, API REST)
- Autenticacao e permissao por usuario
- Notificacoes de vencimento
- Visualizacao e restauracao de snapshots pelo historico completo

## Licenca

Uso livre para fins de estudo, adaptação e apresentação em portfólio.
Proprietário: José Leandro (JL).

