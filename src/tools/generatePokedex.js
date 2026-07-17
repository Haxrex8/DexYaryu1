import { raw } from "../data/raw.js";
import { evolutionLines } from "../data/evolutionLines.js";
import fs from "fs";
import path from "path";
const SHOW_ONLY_WITH_IMAGES = true;

/* ================= NORMALIZATION (SAFE VERSION) ================= */

function normalize(text) {
  return text
    .replace(/\[.*?\]/g, "")
    .replace(/^(SB-|Y-|Z-)/, "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .replace(/-+/g, "-")          //  prevents double dashes
    .replace(/^-|-$/g, "");       //  removes leading/trailing dashes
}

const speciesId = normalize;
const assetId = normalize;

/* ================= PARSE RAW ================= */

function parseRaw(rawText) {
  return rawText
    .trim()
    .split("\n")
    .map(line => {
      const match = line.match(/^(.+?)\s*\((.+?)\)$/);
      if (!match) return null;

      const fullName = match[1].trim();
      const types = match[2];

      const formMatch = fullName.match(/^(.+?)\[(.+?)\]$/);

      const speciesName = formMatch
        ? formMatch[1].trim()
        : fullName;

      const customForm = formMatch
        ? formMatch[2].trim()
        : null;

      const isSpiritbound = fullName.startsWith("SB-");

      return {
        speciesId: speciesId(fullName),
        fullName,
        speciesName,
        customForm,
        isSpiritbound,
        isRegional: /^SB-|^Y-|^Z-/.test(fullName),
        types: types.split("/").map(t => t.trim().toLowerCase())
      };
    })
    .filter(Boolean);
}

/* ================= EVOLUTION LOOKUP (FIXED: NO OVERWRITE COLLISION) ================= */

const evolutionLookup = new Map();

/*
  Instead of overwriting:
  → we store ALL possible lines per species
*/

for (const line of evolutionLines) {
  const normalizedLine = line.map(speciesId);

  for (const id of normalizedLine) {
    if (!evolutionLookup.has(id)) {
      evolutionLookup.set(id, []);
    }

    evolutionLookup.get(id).push(normalizedLine);
  }
}

/* ================= GROUP RAW FOR FORMS ================= */

const parsed = parseRaw(raw);

const groups = {};
const firstSeen = {};

parsed.forEach((entry, i) => {
  if (!groups[entry.speciesId]) {
    groups[entry.speciesId] = [];
    firstSeen[entry.speciesId] = i;
  }
  groups[entry.speciesId].push(entry);
});

const orderedIds = Object.keys(groups).sort(
  (a, b) => firstSeen[a] - firstSeen[b]
);

/* ================= EVOLUTION HELPERS ================= */

function getEvolutionLine(id) {
  const lines = evolutionLookup.get(id);

  if (!lines || lines.length === 0) return [id];

  // pick shortest clean line
  return lines.sort((a, b) => a.length - b.length)[0];
}

function computeStage(id) {
  const line = getEvolutionLine(id);
  const index = line.indexOf(id);

  // fail loudly if mismatch happens 
  if (index === -1) {
    console.warn(`⚠️ Evolution mismatch for: ${id}`);
    return 1;
  }

  return index + 1;
}

/* ================= BUILD POKEDEX ================= */

export const pokedex = orderedIds
  .map((id, index) => {
  const forms = groups[id];
  const evolutionLine = getEvolutionLine(id);

  return {
    dex: index + 1,
    speciesId: id,
    name: forms[0]?.speciesName || id,

    /* ===== EVOLUTION ===== */
    family: evolutionLine,
    stage: computeStage(id),
    maxStage: evolutionLine.length,

    parents: [],
    children: [],

    cry: `sounds/pokemon/${id}.mp3`,

    /* ===== FORMS ===== */
       forms: Object.fromEntries(
      forms.map(f => {
        let key = "base";
        let formType = "base";

        if (f.isSpiritbound) {
          key = "spiritbound";
          formType = "spiritbound";
        } else if (f.customForm) {
          key = `form-${normalize(f.customForm)}`;
          formType = "cosmetic";
        }

        const image = `images/pokemon/${assetId(f.fullName)}.png`;
        const imageFile = path.resolve(
         process.cwd(),
          "images",
         "pokemon",
         `${assetId(f.fullName)}.png`
      );

        return [
          key,
          {
            name: f.speciesName,
            fullName: f.fullName,
            types: f.types,
            image,
            hasImage: fs.existsSync(imageFile),
            formType
          }
        ];
      })
    )
  };
})
.filter(entry =>
  !SHOW_ONLY_WITH_IMAGES ||
  Object.values(entry.forms).some(form => form.hasImage)
);

/* ================= WRITE OUTPUT ================= */

fs.writeFileSync(
  path.resolve("src/data/pokedex.js"),
  `export const pokedex = ${JSON.stringify(pokedex, null, 2)};`
);

console.log("✅ Pokédex built successfully");