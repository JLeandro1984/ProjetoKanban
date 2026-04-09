# Sistema de Rastreamento de Tempo - Guia de Implementação

## 📋 Visão Geral

O sistema de rastreamento de tempo foi implementado com foco em código sênior, padrões bem estruturados e interface profissional. Ele registra automaticamente o tempo gasto em cada fase do workflow.

## 🔄 Fluxo de Funcionamento

### Lógica de Rastreamento

1. **Ao entrar em "Em Andamento"**
   - Sistema registra automaticamente `start` com timestamp ISO
   - Cria novo entry no array `timeLogs` do card

2. **Ao sair de "Em Andamento"**
   - Sistema registra `end` com timestamp ISO
   - Calcula `duration` em millisegundos
   - Entry fica finalizado

3. **Ao entrar em "Em Revisão"**
   - Fecha a sessão anterior (se houver)
   - Cria novo entry com status "Em Revisão"
   - Inicia novo período de rastreamento

4. **Ao sair de "Em Revisão"**
   - Fecha a sessão atual
   - Registra tempo gasto

5. **Ao completar (status → "Concluído")**
   - Fecha qualquer sessão aberta
   - Exibe badge com tempo total acumulado
   - Dados persistem no arquivo local

## 🗂️ Estrutura de Dados

### Formato do Time Log

```json
{
  "status": "Em Andamento",
  "start": "2024-03-15T10:30:45.123Z",
  "end": "2024-03-15T11:45:30.456Z",
  "duration": 4245000
}
```

### No Card

```json
{
  "id": "card-123456",
  "title": "Implementar feature X",
  "timeLogs": [
    {
      "status": "Em Andamento",
      "start": "2024-03-15T09:00:00Z",
      "end": "2024-03-15T09:45:00Z",
      "duration": 2700000
    },
    {
      "status": "Em Revisão",
      "start": "2024-03-15T10:00:00Z",
      "end": "2024-03-15T10:20:00Z",
      "duration": 1200000
    }
  ]
}
```

## 🎯 Componentes Principais

### Funções de Domínio (Core Logic)

#### `updateCardTimeTracking(card, newStatus, nowIso)`
- Gerencia transições de status
- Fecha sessões ao sair de status rastreado
- Inicia novas sessões ao entrar em status rastreado

#### `calculateTotalTimeMs(timeLogs)`
- Soma duração de todos os registros
- Retorna total em millisegundos

#### `formatDurationMs(ms)`
- Converte ms para formato legível
- Exemplo: "2h 45m 30s"

#### `getActiveTimeLog(timeLogs)`
- Retorna sessão ativa (com start mas sem end)
- Usado para validações

### Funções de UI

#### `openTimeLogModal(cardId)`
- Abre modal com histórico de tempo
- Renderiza conteúdo via `renderTimeLogModalContent`

#### `renderTimeLogModalContent(card)`
- Exibe resumo (tempo total + número de sessões)
- Lista todas as sessões com detalhes
- Formata timestamps em pt-BR
- Destaca sessões em progresso

#### `closeTimeLogModal()`
- Fecha modal de tempo

## 💾 Persistência

Os dados de tempo são salvos **automaticamente** junto com os cards:

- **Local Storage**: Modo fallback quando sem diretório configurado
- **Arquivo Local**: Via File System Access API quando configurado
- **Snapshot**: Histórico preservado em pasta `history/`

## 🎨 Componentes de UI

### Ícone de Time Log no Card

- **SVG com 24x24px**: Ícone de relógio
- **Estados**:
  - `.card-actions__time-log--empty`: Sem registros (cinza)
  - `.card-actions__time-log--filled`: Com registros (azul)

### Modal de Histórico

**Estrutura**:
```html
<dialog id="timeLogModal">
  <section class="time-log-modal__content">
    <header>
      <h3>Histórico de Tempo: [Título do Card]</h3>
    </header>
    <div id="timeLogModalBody">
      <!-- Renderizado dinamicamente -->
    </div>
  </section>
</dialog>
```

**Conteúdo Renderizado**:
- **Resumo**: Tempo total + quantidade de sessões
- **Entradas**: Lista detalhada de cada período
  - Status (badge)
  - Data/hora de início
  - Data/hora de conclusão (ou "Em progresso...")
  - Duração formatada

## 🎨 Estilos CSS

### Classes Principais

- `.card-actions__time-log`: Container do botão
- `.card-actions__time-log-icon`: SVG do ícone
- `.time-log-modal__content`: Modal wrapper
- `.time-log__summary`: Box de resumo (tempo total)
- `.time-log__entries`: Container das entradas
- `.time-log__entry`: Card individual de sessão
- `.time-log__duration-badge`: Badge com duração formatada

### Temas Suportados

- **Light Mode**: Azul e tons neutros
- **Dark Mode**: Tons mais claros para contraste

## 🔧 Integração no Workflow

### 1. Novo Card é Criado
```javascript
card.timeLogs = [] // Inicializado vazio
```

### 2. Status Muda
```javascript
updateCardStatus(cardId, "progress")
  → updateCardTimeTracking() // Gerencia logs
  → cardRepository.save() // Persiste
```

### 3. Visualizar Histórico
```javascript
openTimeLogModal(cardId)
  → renderTimeLogModalContent() // Exibe dados
```

## 📊 Exemplo Prático

**Cenário**: Card passa por "Em Andamento" → "Em Revisão" → "Concluído"

### Timeline

```
10:00 - Move para "Em Andamento"
├─ timeLogs[0].start = "10:00:00Z"

10:30 - Move para "Em Revisão"
├─ timeLogs[0].end = "10:30:00Z"
├─ timeLogs[0].duration = 1800000 (30 minutos)
├─ timeLogs[1].start = "10:30:00Z"

11:00 - Move para "Concluído"
├─ timeLogs[1].end = "11:00:00Z"
├─ timeLogs[1].duration = 1800000 (30 minutos)
└─ Total: 1h (exibido no card/modal)
```

## 🔍 Validações e Regras

### Regras de Negócio

1. ✅ Apenas "Em Andamento" e "Em Revisão" são rastreados
2. ✅ Card pode passar múltiplas vezes por um status
3. ✅ Cada passagem gera um novo registro
4. ✅ Duração é calculada automaticamente
5. ✅ Sessão ativa mostra "Em progresso..."
6. ✅ Tempo total é soma de todas as sessões
7. ✅ Dados persistem permanentemente

### Tratamento de Edge Cases

- **Card sem registros**: Modal exibe mensagem vazia
- **Card em progresso**: Entry mostra "Em progresso..." em vez de end time
- **Timestamps inválidos**: Ignorados no cálculo
- **Duração negativa**: Convertida para 0

## 🚀 Performance

- **Cálculos**: O(n) onde n = número de sessões
- **Renderização**: Otimizada com innerHTML + validações
- **Persistência**: Assíncrona, não bloqueia UI
- **Memory**: Estrutura leve, ~200 bytes por sessão

## 🛠️ Extensibilidade

### Para Adicionar Nova Métrica

1. Adicione campo em `timeLogs` entry
2. Implemente cálculo na função apropriada
3. Atualize `renderTimeLogModalContent` para exibir
4. Adicione CSS para novo elemento

### Para Adicionar Novo Status Rastreado

1. Adicione em `TIME_TRACKED_STATUSES`
2. Lógica em `updateCardTimeTracking` funciona automaticamente

## 📝 Notas de Manutenção

- **Storage key**: Dados salvos junto com cards (sem chave separada)
- **Compatibilidade**: Funciona com localStorage e File System API
- **Migração**: Cards antigos sem `timeLogs` recebem array vazio
- **Formato de data**: ISO 8601 (padrão internacional)
- **Timezone**: ISO preserva timezone original

## 🐛 Debug

### Verificar Dados no Console

```javascript
// Obter card com logs
const card = state.cards[0];
console.log(card.timeLogs);

// Calcular tempo total
console.log(calculateTotalTimeMs(card.timeLogs));

// Ver entrada ativa
console.log(getActiveTimeLog(card.timeLogs));
```

### Monitorar Mudanças

```javascript
// Em updateCardStatus(), após updateCardTimeTracking():
console.log(`Card: ${card.id}, Novos logs:`, card.timeLogs);
```

---

**Implementação concluída**: Código profissional, tesável e mantível ✅
