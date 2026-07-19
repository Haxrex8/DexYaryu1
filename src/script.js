import { pokedex } from "./data/pokedex.js";
import { filterPokemon } from "./utils/filterPokemon.js";
const SHOW_ONLY_WITH_IMAGES = false;

/* ================= STATE ================= */

let currentIndex = 0;
let activeForm = "base";

let filtered = [...pokedex];

const team = [];
const favorites = new Set();

/* ================= DOM ================= */

const $ = id => document.getElementById(id);

const UI = {
  name: $("name"),
  num: $("num"),
  img: $("img"),
  types: $("types"),
  evo: $("evoChain"),
  stage: $("stageLabel"),
  formSelect: $("formSelect"),
  search: $("searchInput"),
  typeFilter: $("typeFilter"),
  jumpDex: $("jumpDex"),
  teamSize: $("teamSize"),
  darkToggle: $("darkModeToggle"),
  team: $("teamContainer"),
  favPanel: $("favoritesPanel")
};

/* ================= HELPERS ================= */

function getCurrent() {
  return filtered[currentIndex];
}

function jumpToSpecies(speciesId) {
  // Reset filters so every Pokémon can be found
  UI.search.value = "";
  UI.typeFilter.value = "";

  applyFilters();

  const idx = filtered.findIndex(
    p => p.speciesId === speciesId
  );

  if (idx >= 0) {
    setIndex(idx);
  }
}

function formatFormLabel(key, meta) {
  if (meta?.formType === "base") return "Base";
  if (meta?.formType === "spiritbound") return "Spiritbound";

  // fallback: clean up key names
  return key
    .replace("form-", "")
    .replace(/-/g, " ")
    .replace(/\b\w/g, c => c.toUpperCase());
}

/* ================= FIXED IMAGE CHECK ================= */

/* ================= TYPE ================= */

function createTypeElement(t) {
  const div = document.createElement("div");
  div.className = `type ${t}`;

  const iconLeft = document.createElement("img");
  iconLeft.src = `images/types/${t}.png`;
  iconLeft.className = "type-icon";

  const label = document.createElement("span");
  label.textContent = t.toUpperCase();

  const iconRight = document.createElement("img");
  iconRight.src = `images/types/${t}.png`;
  iconRight.className = "type-icon";

  div.append(iconLeft, label, iconRight);
  return div;
}

/* ================= FORM ================= */

function createFormOption(k, entry) {
  const opt = document.createElement("option");
  opt.value = k;

  const meta = entry.forms[k];

  opt.textContent = formatFormLabel(k, meta);

  return opt;
}

/* ================= IMAGE ================= */

function loadImage(imgEl, src) {
  const img = new Image();
  img.onload = () => (imgEl.src = src);
  img.onerror = () => (imgEl.src = "images/locked.png");
  img.src = src;
}

/* ================= EVOLUTION ================= */

function renderEvolution(entry) {
  UI.evo.innerHTML = "";

  const chain = entry.family || [entry.name];

  chain.forEach((name, i) => {
    const item = document.createElement("span");
    item.className = "evo-item";

    if (!name) {
    item.textContent = "???";
    item.classList.add("hidden-evo");
    UI.evo.appendChild(item);

    if (i < chain.length - 1) {
    const arrow = document.createElement("span");
    arrow.className = "evo-arrow";
    arrow.textContent = "→";
    UI.evo.appendChild(arrow);
    }

    return;
  }

item.textContent =
  name.charAt(0).toUpperCase() + name.slice(1);

item.onclick = () => {
  if (!name) return;

  jumpToSpecies(name);
};

    item.onclick = () => {
  const target = pokedex.find(p => p.speciesId === name);
  if (!target) return;

  const idx = filtered.findIndex(
    p => p.speciesId === target.speciesId
  );

  if (idx === -1) {
    filtered = [...pokedex];
    setIndex(
      pokedex.findIndex(
        p => p.speciesId === target.speciesId
      )
    );
  } else {
    setIndex(idx);
  }
};

    UI.evo.appendChild(item);

    if (i < chain.length - 1) {
      const arrow = document.createElement("span");
      arrow.className = "evo-arrow";
      arrow.textContent = "→";
      UI.evo.appendChild(arrow);
    }
  });
}

/* ================= STAGE ================= */

function updateStage(entry) {
  const map = {
    single: "Single",
    first: "First",
    middle: "Middle",
    final: "Final",
    spiritbound: "Spiritbound"
  };

  let key = "single";

  if (activeForm === "spiritbound") {
    key = "spiritbound";
  } else if (entry.maxStage > 1) {
    if (entry.stage === 1) key = "first";
    else if (entry.stage === entry.maxStage) key = "final";
    else key = "middle";
  }

  UI.stage.textContent = map[key];
  UI.stage.dataset.stage = key;
}

/* ================= FAVORITES ================= */

function updateFavoriteUI(entry) {
  const isFav = favorites.has(entry.speciesId);
  UI.num.classList.toggle("favorite", isFav);
}

function renderFavoritesPanel() {
  UI.favPanel.innerHTML = "";

  const favList = pokedex.filter(p =>
    favorites.has(p.speciesId)
  );

  if (!favList.length) {
    UI.favPanel.textContent = "No favorites yet";
    return;
  }

  favList.forEach(p => {
    const div = document.createElement("div");
    div.className = "favorite-item";
    div.textContent = `#${String(p.dex).padStart(3, "0")} ${p.name}`;

   div.onclick = () => {
  jumpToSpecies(p.speciesId);
};

    UI.favPanel.appendChild(div);
  });
}

/* ================= RENDER ================= */

function render(entry) {
  if (!entry) return;

  const forms = Object.keys(entry.forms || {});
  let formKey = activeForm;

  if (!forms.includes(formKey)) {
    formKey =
      forms.includes("base")
        ? "base"
        : forms.length
          ? forms[0]
          : null;

    activeForm = formKey;
  }

  if (!formKey) return;

  console.log(entry.speciesId, formKey, entry.forms);
  const form = entry.forms[formKey];
  if (!form) return;

  UI.name.textContent = form.name;
  UI.num.textContent = `#${String(entry.dex).padStart(3, "0")}`;

  loadImage(UI.img, form.image);

  updateFavoriteUI(entry);

  UI.types.innerHTML = "";
  form.types.forEach(t =>
    UI.types.appendChild(createTypeElement(t))
  );

  UI.formSelect.innerHTML = "";
  Object.keys(entry.forms || {}).forEach(k =>
    UI.formSelect.appendChild(createFormOption(k, entry))
  );
  UI.formSelect.value = formKey;

  renderEvolution(entry);
  updateStage(entry);
}

/* ================= NAV ================= */

function setIndex(i) {
  if (!filtered.length) return;

  currentIndex = Math.max(0, Math.min(i, filtered.length - 1));
  render(filtered[currentIndex]);
}

function next() {
  setIndex((currentIndex + 1) % filtered.length);
}

function prev() {
  setIndex((currentIndex - 1 + filtered.length) % filtered.length);
}

/* ================= FILTERS ================= */

function applyFilters() {
  let result = filterPokemon(pokedex, {
    search: UI.search.value,
    type: UI.typeFilter.value
  });
}

/* ================= TEAM ================= */

function renderTeam() {
  UI.team.innerHTML = "";

  const wrapper = document.createElement("div");
  wrapper.className = "trainer-card";

  team.slice(0, 6).forEach(p => {
    const card = document.createElement("div");
    card.className = "team-slot";

    card.innerHTML = `
      <div>#${String(p.dex).padStart(3, "0")}</div>
      <div>${p.name}</div>
    `;

    card.onclick = () => {
  jumpToSpecies(p.speciesId);
};

    wrapper.appendChild(card);
  });

  UI.team.appendChild(wrapper);
}

/* ================= GLOBAL ================= */

window.next = next;
window.prev = prev;

window.randomPokemon = () => {
  if (!filtered.length) return;
  setIndex(Math.floor(Math.random() * filtered.length));
};

window.jumpToDex = () => {
  const n = parseInt(UI.jumpDex.value);
  const i = filtered.findIndex(p => p.dex === n);
  if (i >= 0) setIndex(i);
};

window.playCry = () => {
  const p = getCurrent();
  if (!p?.cry) return;
  new Audio(p.cry).play().catch(() => {});
};

window.toggleFavorite = () => {
  const p = getCurrent();
  if (!p) return;

  if (favorites.has(p.speciesId)) {
    favorites.delete(p.speciesId);
  } else {
    favorites.add(p.speciesId);
  }

  render(p);
  renderFavoritesPanel();
};

window.generateRandomTeam = () => {
  team.length = 0;

  const pool = [...pokedex];
  const size = Math.min(
    Math.max(parseInt(UI.teamSize?.value) || 6, 1),
    6
  );

  for (let i = 0; i < size; i++) {
    const rand = Math.floor(Math.random() * pool.length);
    team.push(pool.splice(rand, 1)[0]);
  }

  renderTeam();
};

/* ================= INIT (FIXED + VISUAL TOGGLE) ================= */

function init() {
  filtered = [...pokedex];
  setIndex(0);

  UI.search.addEventListener("input", applyFilters);
  UI.typeFilter.addEventListener("change", applyFilters);

  const imageToggle = document.getElementById("imageFilterToggle");

  imageToggle?.addEventListener("change", (e) => {
    showOnlyWithImages = e.target.checked;

    imageToggle.closest(".toggle-row")?.classList.toggle(
  "active",
  showOnlyWithImages
);

    applyFilters();
  });

  UI.formSelect.addEventListener("change", e => {
    activeForm = e.target.value;
    render(getCurrent());
  });

  UI.darkToggle?.addEventListener("click", () => {
    document.body.classList.toggle("dark");
  });

  renderFavoritesPanel();
}

init();