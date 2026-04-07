(() => {
  const STORAGE_KEY = "kanban-project-control-v1";
  const LAST_COLOR_KEY = "kanban-last-postit-color-v1";

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
    modal: document.querySelector("#cardModal"),
    modalTitle: document.querySelector("#modalTitle"),
    saveCardButton: document.querySelector("#saveCardButton"),
    closeModalButton: document.querySelector("#closeModalButton"),
    cancelModalButton: document.querySelector("#cancelModalButton"),
    form: document.querySelector("#cardForm"),
    toastContainer: document.querySelector("#toastContainer"),
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
  };

  let installPromptEvent = null;

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
      createdAt: card.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  }

  const cardRepository = {
    load() {
      try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) {
          return mockCards.map((card) => normalizeCard(card));
        }

        const parsed = JSON.parse(raw);
        if (!Array.isArray(parsed)) {
          return mockCards.map((card) => normalizeCard(card));
        }

        return parsed.map((card) => normalizeCard(card));
      } catch (error) {
        console.error("Erro ao carregar dados:", error);
        return mockCards.map((card) => normalizeCard(card));
      }
    },
    save(cards) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(cards));
    },
  };

  function formatDate(dateValue) {
    if (!dateValue) return "-";
    const [year, month, day] = dateValue.split("-");
    return `${day}/${month}/${year}`;
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
    empty.textContent = "Nenhum card nesta visualizacao.";
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

  function showToast(message, type = "success") {
    const toast = document.createElement("div");
    toast.className = `toast toast--${type}`;
    toast.textContent = message;
    refs.toastContainer.append(toast);

    setTimeout(() => {
      toast.remove();
    }, 2200);
  }

  function getCardById(cardId) {
    return state.cards.find((card) => card.id === cardId);
  }

  function deleteCard(cardId) {
    const card = getCardById(cardId);
    if (!card) return;

    state.cards = state.cards.filter((item) => item.id !== cardId);
    cardRepository.save(state.cards);
    renderBoard();
    showToast(`Card \"${card.title}\" removido.`);
  }

  function editCard(cardId) {
    const card = getCardById(cardId);
    if (!card) return;
    openModal("edit", card);
  }

  function updateCardStatus(cardId, newStatus) {
    const card = getCardById(cardId);
    if (!card || !STATUS[newStatus]) return;

    card.status = newStatus;
    card.updatedAt = new Date().toISOString();
    cardRepository.save(state.cards);
    renderBoard();
    showToast(`Card movido para ${STATUS[newStatus]}.`);
  }

  function handleFormSubmit(event) {
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

    if (state.editingId) {
      const card = getCardById(state.editingId);
      if (!card) return;

      Object.assign(card, payload, { updatedAt: new Date().toISOString() });
      showToast("Card atualizado com sucesso.");
    } else {
      state.cards.push(normalizeCard(payload));
      showToast("Novo card criado.");
    }

    cardRepository.save(state.cards);
    renderBoard();
    closeModal();
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
    refs.form.addEventListener("submit", handleFormSubmit);

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

    refs.board.addEventListener("click", handleBoardClick);
    refs.board.addEventListener("dragstart", handleDragStart);
    refs.board.addEventListener("dragend", handleDragEnd);

    bindDropZones();
  }

  function init() {
    state.cards = cardRepository.load();
    attachEvents();
    setupPwa();
    renderBoard();
  }

  init();
})();
