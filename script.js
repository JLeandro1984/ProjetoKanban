(() => {
  const LEGACY_STORAGE_KEY = "kanban-project-control-v1";
  const LAST_COLOR_KEY = "kanban-last-postit-color-v1";
  const BACKUP_DB_NAME = "kanban-backup-config-v1";
  const BACKUP_DB_STORE = "settings";
  const BACKUP_HANDLE_KEY = "backup-directory-handle";
  const LEGACY_BACKUP_FILE_NAME = "kanban-backup.json";
  const DATA_FILE_NAME = "kanban-data.json";
  const HISTORY_DIR_NAME = "history";

  const STATUS = {
    backlog: "Backlog",
    todo: "A Fazer",
    progress: "Em Andamento",
    review: "Em Revisao",
    done: "Concluido",
  };

  const PRIORITY_LABEL = {
    baixa: "Baixa",
    media: "Media",
    alta: "Alta",
  };

  const PRIORITY_WEIGHT = {
    baixa: 1,
    media: 2,
    alta: 3,
  };

  const POST_IT_COLORS = [
    "var(--postit-yellow)",
    "var(--postit-blue)",
    "var(--postit-green)",
    "var(--postit-pink)",
    "var(--postit-peach)",
    "var(--postit-lilac)",
  ];

  const PRESET_COLOR_TO_HEX = {
    "var(--postit-yellow)": "#ffe98f",
    "var(--postit-blue)": "#bce6ff",
    "var(--postit-green)": "#c8f2bf",
    "var(--postit-pink)": "#ffd1e5",
    "var(--postit-peach)": "#ffd9bf",
    "var(--postit-lilac)": "#e3d7ff",
  };

  const mockCards = [
    {
      title: "Criar tela de login",
      description: "Definir estrutura, validacao de campos e fluxo de recuperacao de senha.",
      assignee: "Ana Silva",
      priority: "alta",
      dueDate: "2026-04-14",
      tag: "Frontend",
      status: "todo",
    },
    {
      title: "Integrar API de pagamento",
      description: "Conectar endpoint de checkout com tratamento de erros e logs de falha.",
      assignee: "Carlos Mendes",
      priority: "alta",
      dueDate: "2026-04-18",
      tag: "Backend",
      status: "progress",
    },
    {
      title: "Ajustar responsividade mobile",
      description: "Refinar grid de componentes para resolucoes menores e revisar legibilidade.",
      assignee: "Julia Rocha",
      priority: "media",
      dueDate: "2026-04-11",
      tag: "UX",
      status: "review",
    },
    {
      title: "Configurar pipeline CI/CD",
      description: "Automatizar lint, testes e deploy para ambiente de homologacao.",
      assignee: "Pedro Alves",
      priority: "media",
      dueDate: "2026-04-20",
      tag: "DevOps",
      status: "backlog",
    },
    {
      title: "Documentar regras de negocio",
      description: "Atualizar wiki com criterios de aceite, fluxos e politicas de aprovacao.",
      assignee: "Ana Silva",
      priority: "baixa",
      dueDate: "2026-04-23",
      tag: "Documentacao",
      status: "done",
    },
  ];

  const state = {
    cards: [],
    storageReady: false,
    filters: {
      search: "",
      priority: "all",
      assignee: "all",
      sortBy: "updated_desc",
    },
    editingId: null,
    draggingId: null,
  };

  const refs = {
    board: document.querySelector("#kanbanBoard"),
    lists: {
      backlog: document.querySelector("#backlogList"),
      todo: document.querySelector("#todoList"),
      progress: document.querySelector("#progressList"),
      review: document.querySelector("#reviewList"),
      done: document.querySelector("#doneList"),
    },
    counters: document.querySelectorAll("[data-counter]"),
    searchInput: document.querySelector("#searchInput"),
    priorityFilter: document.querySelector("#priorityFilter"),
    assigneeFilter: document.querySelector("#assigneeFilter"),
    sortBy: document.querySelector("#sortBy"),
    newCardButton: document.querySelector("#newCardButton"),
    installAppButton: document.querySelector("#installAppButton"),
    backupButton: document.querySelector("#backupButton"),
    restoreSnapshotButton: document.querySelector("#restoreSnapshotButton"),
    modal: document.querySelector("#cardModal"),
    alertModal: document.querySelector("#alertModal"),
    alertTitle: document.querySelector("#alertTitle"),
    alertMessage: document.querySelector("#alertMessage"),
    alertBadge: document.querySelector("#alertBadge"),
    alertCloseButton: document.querySelector("#alertCloseButton"),
    alertOkButton: document.querySelector("#alertOkButton"),
    modalTitle: document.querySelector("#modalTitle"),
    saveCardButton: document.querySelector("#saveCardButton"),
    closeModalButton: document.querySelector("#closeModalButton"),
    cancelModalButton: document.querySelector("#cancelModalButton"),
    form: document.querySelector("#cardForm"),
    fields: {
      title: document.querySelector("#titleInput"),
      description: document.querySelector("#descriptionInput"),
      assignee: document.querySelector("#assigneeInput"),
      priority: document.querySelector("#priorityInput"),
      dueDate: document.querySelector("#dueDateInput"),
      tag: document.querySelector("#tagInput"),
      status: document.querySelector("#statusInput"),
      postItColor: document.querySelector("#colorInput"),
    },
    interactive: [],
  };

  let installPromptEvent = null;
  const alertQueue = [];

  function generateId() {
    return `card-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
  }

  function pickPostItColor() {
    return POST_IT_COLORS[Math.floor(Math.random() * POST_IT_COLORS.length)];
  }

  function toColorInputValue(color) {
    if (!color) {
      return "#ffe98f";
    }

    if (PRESET_COLOR_TO_HEX[color]) {
      return PRESET_COLOR_TO_HEX[color];
    }

    if (/^#[0-9a-fA-F]{6}$/.test(color)) {
      return color;
    }

    return "#ffe98f";
  }

  function getLastPickedColor() {
    const savedColor = localStorage.getItem(LAST_COLOR_KEY);
    return toColorInputValue(savedColor);
  }

  function saveLastPickedColor(color) {
    localStorage.setItem(LAST_COLOR_KEY, toColorInputValue(color));
  }

  function normalizeCard(card) {
    const nowIso = new Date().toISOString();
    const createdAt = card.createdAt || nowIso;
    const updatedAt = card.updatedAt || createdAt;

    return {
      id: card.id || generateId(),
      title: card.title?.trim() || "",
      description: card.description?.trim() || "",
      assignee: card.assignee?.trim() || "",
      priority: card.priority || "media",
      dueDate: card.dueDate || "",
      tag: card.tag?.trim() || "",
      status: card.status || "backlog",
      postItColor: card.postItColor || pickPostItColor(),
      rotation: 0,
      createdAt,
      completedAt:
        card.completedAt || ((card.status || "backlog") === "done" ? updatedAt : ""),
      updatedAt,
    };
  }

  function isBackupSupported() {
    return typeof window.showDirectoryPicker === "function" && "indexedDB" in window;
  }

  function openBackupDb() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(BACKUP_DB_NAME, 1);

      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains(BACKUP_DB_STORE)) {
          db.createObjectStore(BACKUP_DB_STORE);
        }
      };

      request.onsuccess = () => {
        resolve(request.result);
      };

      request.onerror = () => {
        reject(request.error);
      };
    });
  }

  async function getStoredBackupDirectoryHandle() {
    try {
      const db = await openBackupDb();

      return await new Promise((resolve, reject) => {
        const transaction = db.transaction(BACKUP_DB_STORE, "readonly");
        const store = transaction.objectStore(BACKUP_DB_STORE);
        const request = store.get(BACKUP_HANDLE_KEY);

        request.onsuccess = () => {
          resolve(request.result || null);
        };

        request.onerror = () => {
          reject(request.error);
        };
      });
    } catch (error) {
      console.error("Erro ao carregar configuracao de backup:", error);
      return null;
    }
  }

  async function saveBackupDirectoryHandle(handle) {
    const db = await openBackupDb();

    return await new Promise((resolve, reject) => {
      const transaction = db.transaction(BACKUP_DB_STORE, "readwrite");
      const store = transaction.objectStore(BACKUP_DB_STORE);
      const request = store.put(handle, BACKUP_HANDLE_KEY);

      request.onsuccess = () => {
        resolve();
      };

      request.onerror = () => {
        reject(request.error);
      };
    });
  }

  async function ensureDirectoryPermission(handle, mode = "read") {
    if (!handle) return false;

    try {
      if (typeof handle.queryPermission === "function") {
        const permission = await handle.queryPermission({ mode });
        if (permission === "granted") {
          return true;
        }
      }

      if (typeof handle.requestPermission === "function") {
        const permission = await handle.requestPermission({ mode });
        return permission === "granted";
      }
    } catch (error) {
      console.error("Erro ao validar permissao de backup:", error);
      return false;
    }

    return false;
  }

  async function readCardsFromBackupFile(dirHandle) {
    const parseCards = (content) => {
      const parsed = JSON.parse(content);

      if (Array.isArray(parsed)) {
        return parsed;
      }

      if (Array.isArray(parsed?.cards)) {
        return parsed.cards;
      }

      return [];
    };

    try {
      const fileHandle = await dirHandle.getFileHandle(DATA_FILE_NAME);
      const file = await fileHandle.getFile();
      const content = await file.text();
      return parseCards(content);
    } catch (error) {
      if (error?.name !== "NotFoundError") {
        throw error;
      }

      const legacyFileHandle = await dirHandle.getFileHandle(LEGACY_BACKUP_FILE_NAME);
      const legacyFile = await legacyFileHandle.getFile();
      const legacyContent = await legacyFile.text();
      return parseCards(legacyContent);
    }
  }

  const backupManager = {
    directoryHandle: null,

    async init() {
      if (!isBackupSupported()) {
        return;
      }

      this.directoryHandle = await getStoredBackupDirectoryHandle();
    },

    async configureDirectory() {
      if (!isBackupSupported()) {
        throw new Error("Backup local nao suportado neste navegador.");
      }

      const handle = await window.showDirectoryPicker({
        id: "kanban-backup-directory",
        mode: "readwrite",
      });

      const hasPermission = await ensureDirectoryPermission(handle, "readwrite");
      if (!hasPermission) {
        throw new Error("Permissao de escrita negada para pasta de backup.");
      }

      this.directoryHandle = handle;
      await saveBackupDirectoryHandle(handle);
    },

    async sync(cards) {
      if (!this.directoryHandle) {
        return;
      }

      const hasPermission = await ensureDirectoryPermission(this.directoryHandle, "readwrite");
      if (!hasPermission) {
        return;
      }

      const fileHandle = await this.directoryHandle.getFileHandle(DATA_FILE_NAME, {
        create: true,
      });
      const writable = await fileHandle.createWritable();
      const payload = {
        version: 1,
        updatedAt: new Date().toISOString(),
        cards,
      };

      await writable.write(JSON.stringify(payload, null, 2));
      await writable.close();

      const historyDirectory = await this.directoryHandle.getDirectoryHandle(HISTORY_DIR_NAME, {
        create: true,
      });
      const historyFileName = `kanban-snapshot-${new Date()
        .toISOString()
        .replaceAll(":", "-")
        .replaceAll(".", "-")}.json`;
      const historyFileHandle = await historyDirectory.getFileHandle(historyFileName, {
        create: true,
      });
      const historyWritable = await historyFileHandle.createWritable();
      await historyWritable.write(JSON.stringify(payload, null, 2));
      await historyWritable.close();
    },

    async readCards() {
      if (!this.directoryHandle) {
        throw new Error("Diretorio de dados nao configurado.");
      }

      const hasReadPermission = await ensureDirectoryPermission(this.directoryHandle, "read");
      if (!hasReadPermission) {
        throw new Error("Permissao de leitura negada para o diretorio de dados.");
      }

      return await readCardsFromBackupFile(this.directoryHandle);
    },

    async readLatestSnapshotCards() {
      if (!this.directoryHandle) {
        throw new Error("Diretorio de dados nao configurado.");
      }

      const hasReadPermission = await ensureDirectoryPermission(this.directoryHandle, "read");
      if (!hasReadPermission) {
        throw new Error("Permissao de leitura negada para o diretorio de dados.");
      }

      const historyDirectory = await this.directoryHandle.getDirectoryHandle(HISTORY_DIR_NAME);
      const snapshotNames = [];

      for await (const [entryName, entryHandle] of historyDirectory.entries()) {
        if (entryHandle.kind !== "file") {
          continue;
        }

        if (!entryName.startsWith("kanban-snapshot-") || !entryName.endsWith(".json")) {
          continue;
        }

        snapshotNames.push(entryName);
      }

      if (!snapshotNames.length) {
        throw new Error("Nenhum snapshot encontrado no historico.");
      }

      snapshotNames.sort((a, b) => b.localeCompare(a));
      const latestSnapshotHandle = await historyDirectory.getFileHandle(snapshotNames[0]);
      const latestSnapshotFile = await latestSnapshotHandle.getFile();
      const content = await latestSnapshotFile.text();
      const parsed = JSON.parse(content);

      if (Array.isArray(parsed)) {
        return parsed;
      }

      if (Array.isArray(parsed?.cards)) {
        return parsed.cards;
      }

      throw new Error("Snapshot invalido.");
    },
  };

  const cardRepository = {
    loadLegacyLocalStorage() {
      try {
        const raw = localStorage.getItem(LEGACY_STORAGE_KEY);
        if (!raw) return [];

        const parsed = JSON.parse(raw);
        return Array.isArray(parsed) ? parsed : [];
      } catch (error) {
        console.error("Erro ao carregar dados legados:", error);
        return [];
      }
    },
    clearLegacyLocalStorage() {
      localStorage.removeItem(LEGACY_STORAGE_KEY);
    },
    async load() {
      if (!backupManager.directoryHandle) {
        throw new Error("Diretorio de dados nao configurado.");
      }

      try {
        const fromFile = await backupManager.readCards();
        if (Array.isArray(fromFile)) {
          return fromFile.map((card) => normalizeCard(card));
        }
      } catch (error) {
        if (error?.name !== "NotFoundError") {
          console.error("Erro ao carregar dados do diretorio local:", error);
          throw error;
        }
      }

      const legacyCards = this.loadLegacyLocalStorage();
      if (legacyCards.length) {
        const normalizedLegacyCards = legacyCards.map((card) => normalizeCard(card));
        await this.save(normalizedLegacyCards);
        this.clearLegacyLocalStorage();
        return normalizedLegacyCards;
      }

      const initialCards = mockCards.map((card) => normalizeCard(card));
      await this.save(initialCards);
      return initialCards;
    },
    async save(cards) {
      if (!backupManager.directoryHandle) {
        throw new Error("Diretorio de dados nao configurado.");
      }

      await backupManager.sync(cards);
    },
  };

  function setStorageReady(isReady) {
    state.storageReady = isReady;

    refs.interactive.forEach((element) => {
      if (!element) return;
      element.disabled = !isReady;
    });
  }

  function updateBackupButtonState() {
    if (!refs.backupButton) return;

    if (!isBackupSupported()) {
      refs.backupButton.disabled = true;
      if (refs.restoreSnapshotButton) {
        refs.restoreSnapshotButton.disabled = true;
      }
      refs.backupButton.textContent = "Backup indisponivel";
      refs.backupButton.title = "Use um navegador baseado em Chromium para backup em pasta local.";
      return;
    }

    refs.backupButton.disabled = false;
    refs.backupButton.title = "";
    refs.backupButton.textContent = backupManager.directoryHandle
      ? "Diretorio Ativo"
      : "Selecionar Diretorio";

    if (refs.restoreSnapshotButton) {
      refs.restoreSnapshotButton.disabled = !backupManager.directoryHandle;
    }
  }

  async function loadCardsFromDirectory() {
    const loadedCards = await cardRepository.load();
    state.cards = loadedCards;
    setStorageReady(true);
  }

  function formatDate(dateValue) {
    if (!dateValue) return "-";
    const [year, month, day] = dateValue.split("-");
    return `${day}/${month}/${year}`;
  }

  function formatDateFromIso(dateValue) {
    if (!dateValue) return "-";

    const parsed = new Date(dateValue);
    if (Number.isNaN(parsed.getTime())) return "-";

    return new Intl.DateTimeFormat("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(parsed);
  }

  function resolveCompletedAt(previousStatus, nextStatus, currentCompletedAt, nowIso) {
    if (previousStatus !== "done" && nextStatus === "done") {
      return nowIso;
    }

    if (previousStatus === "done" && nextStatus !== "done") {
      return "";
    }

    return currentCompletedAt || "";
  }

  function toSearchable(card) {
    return `${card.title} ${card.description} ${card.assignee} ${card.tag}`.toLowerCase();
  }

  function matchesFilters(card) {
    const search = state.filters.search.toLowerCase().trim();
    const matchesSearch = !search || toSearchable(card).includes(search);
    const matchesPriority =
      state.filters.priority === "all" || card.priority === state.filters.priority;
    const matchesAssignee =
      state.filters.assignee === "all" || card.assignee === state.filters.assignee;

    return matchesSearch && matchesPriority && matchesAssignee;
  }

  function compareDates(dateA, dateB) {
    const timeA = dateA ? new Date(dateA).getTime() : Number.MAX_SAFE_INTEGER;
    const timeB = dateB ? new Date(dateB).getTime() : Number.MAX_SAFE_INTEGER;
    return timeA - timeB;
  }

  function sortCards(cards) {
    const sorted = [...cards];

    sorted.sort((a, b) => {
      switch (state.filters.sortBy) {
        case "priority_desc": {
          const byPriority = PRIORITY_WEIGHT[b.priority] - PRIORITY_WEIGHT[a.priority];
          if (byPriority !== 0) return byPriority;
          return compareDates(a.dueDate, b.dueDate);
        }
        case "priority_asc": {
          const byPriority = PRIORITY_WEIGHT[a.priority] - PRIORITY_WEIGHT[b.priority];
          if (byPriority !== 0) return byPriority;
          return compareDates(a.dueDate, b.dueDate);
        }
        case "due_asc":
          return compareDates(a.dueDate, b.dueDate);
        case "due_desc":
          return compareDates(b.dueDate, a.dueDate);
        case "updated_desc":
        default: {
          const aTime = new Date(a.updatedAt || a.createdAt).getTime();
          const bTime = new Date(b.updatedAt || b.createdAt).getTime();
          return bTime - aTime;
        }
      }
    });

    return sorted;
  }

  function renderAssigneeFilter() {
    const assignees = [...new Set(state.cards.map((card) => card.assignee))].sort((a, b) =>
      a.localeCompare(b, "pt-BR")
    );

    const currentValue = state.filters.assignee;
    refs.assigneeFilter.innerHTML = "";

    const allOption = document.createElement("option");
    allOption.value = "all";
    allOption.textContent = "Todos";
    refs.assigneeFilter.append(allOption);

    assignees.forEach((name) => {
      const option = document.createElement("option");
      option.value = name;
      option.textContent = name;
      refs.assigneeFilter.append(option);
    });

    refs.assigneeFilter.value = assignees.includes(currentValue) ? currentValue : "all";
    if (refs.assigneeFilter.value === "all") {
      state.filters.assignee = "all";
    }
  }

  function createCardElement(card) {
    const li = document.createElement("li");
    li.className = "kanban-card";
    li.draggable = true;
    li.dataset.id = card.id;
    li.dataset.status = card.status;
    li.style.setProperty("--rotation", `${card.rotation}deg`);
    li.style.setProperty("--card-color", card.postItColor);

    li.innerHTML = `
      <div class="kanban-card__paper"></div>
      <article class="kanban-card__content">
        <h3 class="kanban-card__title">${escapeHTML(card.title)}</h3>
        <p class="kanban-card__description">${escapeHTML(card.description)}</p>

        <ul class="kanban-card__meta">
          <li><strong>Responsavel:</strong> ${escapeHTML(card.assignee)}</li>
          <li><strong>Prazo:</strong> ${formatDate(card.dueDate)}</li>
          <li><strong>Criado em:</strong> ${formatDateFromIso(card.createdAt)}</li>
          ${
            card.completedAt
              ? `<li><strong>Concluido em:</strong> ${formatDateFromIso(card.completedAt)}</li>`
              : ""
          }
          <li><strong>Tag:</strong> ${escapeHTML(card.tag)}</li>
        </ul>

        <footer class="kanban-card__footer">
          <span class="badge badge--${card.priority}">${PRIORITY_LABEL[card.priority]}</span>
          <div class="card-actions">
            <button type="button" data-action="edit">Editar</button>
            <button type="button" data-action="delete">Excluir</button>
          </div>
        </footer>
      </article>
    `;

    return li;
  }

  function renderEmptyState(listElement) {
    const empty = document.createElement("li");
    empty.className = "empty-state";
    empty.textContent = state.storageReady
      ? "Nenhum card nesta visualizacao."
      : "Selecione um diretorio local para carregar os cards.";
    listElement.append(empty);
  }

  function updateCounters(filteredCards) {
    const counts = {
      backlog: 0,
      todo: 0,
      progress: 0,
      review: 0,
      done: 0,
    };

    filteredCards.forEach((card) => {
      if (counts[card.status] !== undefined) {
        counts[card.status] += 1;
      }
    });

    refs.counters.forEach((counter) => {
      const status = counter.dataset.counter;
      counter.textContent = String(counts[status] || 0);
    });
  }

  function renderBoard() {
    if (!state.storageReady) {
      Object.values(refs.lists).forEach((list) => {
        list.innerHTML = "";
        renderEmptyState(list);
      });

      updateCounters([]);
      return;
    }

    const filteredCards = sortCards(state.cards.filter(matchesFilters));

    Object.values(refs.lists).forEach((list) => {
      list.innerHTML = "";
    });

    filteredCards.forEach((card) => {
      const list = refs.lists[card.status];
      if (!list) return;
      list.append(createCardElement(card));
    });

    Object.values(refs.lists).forEach((list) => {
      if (!list.children.length) {
        renderEmptyState(list);
      }
    });

    updateCounters(filteredCards);
    renderAssigneeFilter();
  }

  function openModal(mode, card = null) {
    state.editingId = card?.id || null;

    refs.modalTitle.textContent = mode === "create" ? "Novo Card" : "Editar Card";
    refs.saveCardButton.textContent = mode === "create" ? "Salvar Card" : "Salvar Alteracoes";

    if (card) {
      refs.fields.title.value = card.title;
      refs.fields.description.value = card.description;
      refs.fields.assignee.value = card.assignee;
      refs.fields.priority.value = card.priority;
      refs.fields.dueDate.value = card.dueDate;
      refs.fields.tag.value = card.tag;
      refs.fields.status.value = card.status;
      refs.fields.postItColor.value = toColorInputValue(card.postItColor);
    } else {
      refs.form.reset();
      refs.fields.priority.value = "media";
      refs.fields.status.value = "backlog";
      refs.fields.dueDate.value = new Date().toISOString().slice(0, 10);
      refs.fields.postItColor.value = getLastPickedColor();
    }

    refs.modal.showModal();
    refs.fields.title.focus();
  }

  function closeModal() {
    refs.modal.close();
    state.editingId = null;
  }

  function openNextAlert() {
    if (!refs.alertModal || refs.alertModal.open || !alertQueue.length) {
      return;
    }

    const nextAlert = alertQueue.shift();
    const titleByType = {
      success: "Sucesso",
      error: "Atenção",
      info: "Informação",
    };
    const badgeByType = {
      success: "OK",
      error: "!",
      info: "i",
    };

    const alertType = titleByType[nextAlert.type] ? nextAlert.type : "info";
    refs.alertModal.dataset.type = alertType;
    refs.alertTitle.textContent = titleByType[alertType];
    refs.alertBadge.textContent = badgeByType[alertType];
    refs.alertMessage.textContent = nextAlert.message;
    refs.alertOkButton.textContent = nextAlert.confirmLabel || "Entendi";
    refs.alertCloseButton.classList.toggle("u-hidden", Boolean(nextAlert.hideClose));
    refs.alertModal.showModal();
  }

  function closeAlertModal() {
    if (refs.alertModal?.open) {
      refs.alertModal.close();
    }
  }

  function showToast(message, type = "success", confirmLabel = "", hideClose = false) {
    alertQueue.push({ message, type, confirmLabel, hideClose });
    openNextAlert();
  }

  function getCardById(cardId) {
    return state.cards.find((card) => card.id === cardId);
  }

  async function deleteCard(cardId) {
    const card = getCardById(cardId);
    if (!card) return;

    state.cards = state.cards.filter((item) => item.id !== cardId);

    let persisted = true;

    try {
      await cardRepository.save(state.cards);
    } catch (error) {
      persisted = false;
      console.error("Erro ao salvar exclusao:", error);
      showToast("Falha ao salvar no diretorio local.", "error");
    }

    renderBoard();
    if (persisted) {
      showToast(`Card "${card.title}" removido.`, "success", "Ok", true);
    }
  }

  function editCard(cardId) {
    const card = getCardById(cardId);
    if (!card) return;
    openModal("edit", card);
  }

  async function updateCardStatus(cardId, newStatus) {
    const card = getCardById(cardId);
    if (!card || !STATUS[newStatus]) return;

    const previousStatus = card.status;
    const nowIso = new Date().toISOString();

    card.status = newStatus;
    card.completedAt = resolveCompletedAt(previousStatus, newStatus, card.completedAt, nowIso);
    card.updatedAt = nowIso;
    let persisted = true;

    try {
      await cardRepository.save(state.cards);
    } catch (error) {
      persisted = false;
      console.error("Erro ao salvar mudanca de status:", error);
      showToast("Falha ao salvar no diretorio local.", "error");
    }

    renderBoard();
    if (persisted) {
      showToast(`Card movido para ${STATUS[newStatus]}.`);
    }
  }

  async function handleFormSubmit(event) {
    event.preventDefault();

    if (!refs.form.reportValidity()) return;

    const formData = new FormData(refs.form);
    const payload = {
      title: String(formData.get("title") || ""),
      description: String(formData.get("description") || ""),
      assignee: String(formData.get("assignee") || ""),
      priority: String(formData.get("priority") || "media"),
      dueDate: String(formData.get("dueDate") || ""),
      tag: String(formData.get("tag") || ""),
      status: String(formData.get("status") || "backlog"),
      postItColor: String(formData.get("postItColor") || ""),
    };

    payload.postItColor = toColorInputValue(payload.postItColor);
    saveLastPickedColor(payload.postItColor);

    const isEditing = Boolean(state.editingId);

    if (isEditing) {
      const card = getCardById(state.editingId);
      if (!card) return;

      const previousStatus = card.status;
      const nowIso = new Date().toISOString();

      Object.assign(card, payload, {
        completedAt: resolveCompletedAt(previousStatus, payload.status, card.completedAt, nowIso),
        updatedAt: nowIso,
      });
    } else {
      state.cards.push(normalizeCard(payload));
    }

    let persisted = true;

    try {
      await cardRepository.save(state.cards);
    } catch (error) {
      persisted = false;
      console.error("Erro ao salvar card:", error);
      showToast("Falha ao salvar no diretorio local.", "error");
    }

    renderBoard();

    if (persisted) {
      showToast(isEditing ? "Card atualizado com sucesso." : "Novo card criado.");
      closeModal();
    }
  }

  function handleBoardClick(event) {
    const button = event.target.closest("button[data-action]");
    if (!button) return;

    const cardElement = button.closest(".kanban-card");
    if (!cardElement) return;

    const cardId = cardElement.dataset.id;
    const action = button.dataset.action;

    if (action === "edit") {
      editCard(cardId);
      return;
    }

    if (action === "delete") {
      deleteCard(cardId);
    }
  }

  function handleDragStart(event) {
    const cardElement = event.target.closest(".kanban-card");
    if (!cardElement || cardElement.classList.contains("empty-state")) return;

    state.draggingId = cardElement.dataset.id;
    cardElement.classList.add("dragging");
    event.dataTransfer.effectAllowed = "move";
    event.dataTransfer.setData("text/plain", state.draggingId);
  }

  function handleDragEnd(event) {
    const cardElement = event.target.closest(".kanban-card");
    if (cardElement) {
      cardElement.classList.remove("dragging");
    }

    document.querySelectorAll(".kanban-column__body").forEach((zone) => {
      zone.classList.remove("is-over");
    });

    state.draggingId = null;
  }

  function handleDropZoneEnter(zoneElement) {
    zoneElement.classList.add("is-over");
  }

  function handleDropZoneLeave(zoneElement, relatedTarget) {
    if (!zoneElement.contains(relatedTarget)) {
      zoneElement.classList.remove("is-over");
    }
  }

  function handleDrop(event, zoneElement) {
    event.preventDefault();
    zoneElement.classList.remove("is-over");

    const droppedId = event.dataTransfer.getData("text/plain") || state.draggingId;
    if (!droppedId) return;

    const newStatus = zoneElement.dataset.dropzone;
    updateCardStatus(droppedId, newStatus);
  }

  function bindDropZones() {
    document.querySelectorAll(".kanban-column__body").forEach((zone) => {
      zone.addEventListener("dragover", (event) => {
        event.preventDefault();
        event.dataTransfer.dropEffect = "move";
      });

      zone.addEventListener("dragenter", () => {
        handleDropZoneEnter(zone);
      });

      zone.addEventListener("dragleave", (event) => {
        handleDropZoneLeave(zone, event.relatedTarget);
      });

      zone.addEventListener("drop", (event) => {
        handleDrop(event, zone);
      });
    });
  }

  function escapeHTML(text) {
    return String(text)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#39;");
  }

  function setupPwa() {
    if ("serviceWorker" in navigator) {
      window.addEventListener("load", () => {
        navigator.serviceWorker.register("./service-worker.js").catch((error) => {
          console.error("Falha ao registrar service worker:", error);
        });
      });
    }

    window.addEventListener("beforeinstallprompt", (event) => {
      event.preventDefault();
      installPromptEvent = event;
      refs.installAppButton.classList.remove("u-hidden");
    });

    refs.installAppButton.addEventListener("click", async () => {
      if (!installPromptEvent) return;

      installPromptEvent.prompt();
      const { outcome } = await installPromptEvent.userChoice;
      installPromptEvent = null;
      refs.installAppButton.classList.add("u-hidden");

      if (outcome === "accepted") {
        showToast("App instalado com sucesso.");
      }
    });

    window.addEventListener("appinstalled", () => {
      installPromptEvent = null;
      refs.installAppButton.classList.add("u-hidden");
      showToast("Controle de Projetos instalado.");
    });
  }

  function attachEvents() {
    refs.newCardButton.addEventListener("click", () => openModal("create"));
    refs.closeModalButton.addEventListener("click", closeModal);
    refs.cancelModalButton.addEventListener("click", closeModal);
    refs.form.addEventListener("submit", (event) => {
      handleFormSubmit(event);
    });

    refs.alertOkButton?.addEventListener("click", closeAlertModal);
    refs.alertCloseButton?.addEventListener("click", closeAlertModal);

    refs.alertModal?.addEventListener("click", (event) => {
      const bounds = refs.alertModal.getBoundingClientRect();
      const clickedOutside =
        event.clientX < bounds.left ||
        event.clientX > bounds.right ||
        event.clientY < bounds.top ||
        event.clientY > bounds.bottom;

      if (clickedOutside) {
        closeAlertModal();
      }
    });

    refs.alertModal?.addEventListener("close", () => {
      openNextAlert();
    });

    refs.modal.addEventListener("click", (event) => {
      const bounds = refs.modal.getBoundingClientRect();
      const clickedOutside =
        event.clientX < bounds.left ||
        event.clientX > bounds.right ||
        event.clientY < bounds.top ||
        event.clientY > bounds.bottom;

      if (clickedOutside) {
        closeModal();
      }
    });

    refs.searchInput.addEventListener("input", (event) => {
      state.filters.search = event.target.value;
      renderBoard();
    });

    refs.priorityFilter.addEventListener("change", (event) => {
      state.filters.priority = event.target.value;
      renderBoard();
    });

    refs.assigneeFilter.addEventListener("change", (event) => {
      state.filters.assignee = event.target.value;
      renderBoard();
    });

    refs.sortBy.addEventListener("change", (event) => {
      state.filters.sortBy = event.target.value;
      renderBoard();
    });

    refs.backupButton?.addEventListener("click", async () => {
      if (!isBackupSupported()) {
        showToast("Diretorio local nao e suportado neste navegador.", "error");
        return;
      }

      try {
        await backupManager.configureDirectory();
        await loadCardsFromDirectory();
        updateBackupButtonState();
        renderBoard();
        showToast("Diretorio local configurado com sucesso.");
      } catch (error) {
        if (error?.name === "AbortError") {
          return;
        }

        console.error("Erro ao configurar backup:", error);
        showToast("Nao foi possivel configurar o diretorio local.", "error");
      }
    });

    refs.restoreSnapshotButton?.addEventListener("click", async () => {
      if (!backupManager.directoryHandle) {
        showToast("Selecione um diretorio local antes de restaurar.", "error");
        return;
      }

      try {
        const snapshotCards = await backupManager.readLatestSnapshotCards();
        const normalizedCards = snapshotCards.map((card) => normalizeCard(card));
        state.cards = normalizedCards;
        await cardRepository.save(state.cards);
        setStorageReady(true);
        renderBoard();
        showToast("Ultimo snapshot restaurado com sucesso.");
      } catch (error) {
        console.error("Erro ao restaurar snapshot:", error);
        showToast("Nao foi possivel restaurar o ultimo snapshot.", "error");
      }
    });

    refs.board.addEventListener("click", handleBoardClick);
    refs.board.addEventListener("dragstart", handleDragStart);
    refs.board.addEventListener("dragend", handleDragEnd);

    bindDropZones();
  }

  async function init() {
    refs.interactive = [
      refs.newCardButton,
      refs.searchInput,
      refs.priorityFilter,
      refs.assigneeFilter,
      refs.sortBy,
    ];

    setStorageReady(false);
    await backupManager.init();
    updateBackupButtonState();
    attachEvents();
    setupPwa();

    if (backupManager.directoryHandle) {
      try {
        await loadCardsFromDirectory();
        showToast("Cards carregados do diretorio local.");
      } catch (error) {
        console.error("Erro ao carregar cards do diretorio local:", error);
        setStorageReady(false);
        showToast("Falha ao carregar dados do diretorio local.", "error");
      }
    } else {
      showToast("Selecione um diretorio local para usar o Kanban.", "error");
    }

    renderBoard();
  }

  init();
})();
