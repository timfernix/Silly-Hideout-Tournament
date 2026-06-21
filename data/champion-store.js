import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import axios from "axios";
import { getAllMatches, updateMatch } from "./match-store.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const championFilePath = path.join(__dirname, "champions.json");

let cachedChampions = null;

function unique(values) {
  return [...new Set(values)];
}

function mapTagsToTournamentRoles(tags = []) {
  const roles = [];

  if (tags.includes("Marksman")) {
    roles.push("Adc");
  }
  if (tags.includes("Support")) {
    roles.push("Support");
  }
  if (tags.includes("Assassin") || tags.includes("Mage")) {
    roles.push("Mid");
  }
  if (tags.includes("Tank") || tags.includes("Fighter")) {
    roles.push("Top");
  }
  if (tags.includes("Assassin") || tags.includes("Fighter") || tags.includes("Tank")) {
    roles.push("Jungle");
  }

  if (!roles.length) {
    roles.push("All");
  }

  return unique(roles);
}

function normalizeChampion(item) {
  if (!item || typeof item !== "object") {
    return null;
  }

  const role = Array.isArray(item.role)
    ? item.role.filter((entry) => typeof entry === "string" && entry.trim())
    : [];

  if (!item.name || !item.smoothName) {
    return null;
  }

  return {
    id: String(item.id ?? item.name),
    name: String(item.name),
    smoothName: String(item.smoothName),
    title: item.title ? String(item.title) : "",
    role,
    iconUrl: item.iconUrl ? String(item.iconUrl) : "",
    splashUrl: item.splashUrl ? String(item.splashUrl) : "",
    version: item.version ? String(item.version) : "",
    emojiName: item.emojiName ? String(item.emojiName) : "",
    emojiId: item.emojiId ? String(item.emojiId) : "",
    wins: Number.isFinite(item.wins) ? item.wins : 0,
    losses: Number.isFinite(item.losses) ? item.losses : 0,
    emoji: item.emoji ? String(item.emoji) : "",
  };
}

async function readLocalChampions() {
  const raw = await readFile(championFilePath, "utf8").catch(() => "[]");
  const parsed = JSON.parse(raw);

  if (!Array.isArray(parsed)) {
    return [];
  }

  return parsed.map(normalizeChampion).filter(Boolean);
}

export async function saveChampions(champions) {
  const normalized = champions.map(normalizeChampion).filter(Boolean);
  await writeFile(championFilePath, `${JSON.stringify(normalized, null, 2)}\n`, "utf8");
  cachedChampions = normalized;
  return normalized;
}

export async function fetchLatestRiotVersion() {
  const { data } = await axios.get(
    "https://ddragon.leagueoflegends.com/api/versions.json",
    { timeout: 10_000 }
  );

  if (!Array.isArray(data) || !data.length) {
    throw new Error("No Data Dragon versions received.");
  }

  return data[0];
}

export async function fetchChampionsFromRiot(version) {
  const { data } = await axios.get(
    `https://ddragon.leagueoflegends.com/cdn/${version}/data/en_US/champion.json`,
    { timeout: 15_000 }
  );

  const champions = Object.values(data.data ?? {}).map((champion) => {
    const iconPath = champion.image?.full
      ? champion.image.full
      : `${champion.id}.png`;

    return normalizeChampion({
      id: champion.id,
      name: champion.name,
      smoothName: champion.id,
      title: champion.title,
      role: mapTagsToTournamentRoles(champion.tags ?? []),
      iconUrl: `https://ddragon.leagueoflegends.com/cdn/${version}/img/champion/${iconPath}`,
      splashUrl: `https://ddragon.leagueoflegends.com/cdn/img/champion/splash/${champion.id}_0.jpg`,
      version,
      wins: 0,
      losses: 0,
      emoji: "",
    });
  });

  return champions.filter(Boolean).sort((left, right) => left.name.localeCompare(right.name));
}

export async function syncChampionsFromRiot() {
  const version = await fetchLatestRiotVersion();
  const champions = await fetchChampionsFromRiot(version);

  await saveChampions(champions);

  return { version, champions };
}

export async function applyChampionEmojiMap(emojiMap) {
  const champions = await readLocalChampions();

  const updated = champions.map((champion) => {
    const data = emojiMap[champion.id] ?? null;
    if (!data) {
      return champion;
    }

    return {
      ...champion,
      emoji: data.mention,
      emojiName: data.name,
      emojiId: data.id,
    };
  });

  await saveChampions(updated);
  return updated;
}

export async function applyMatchResultToChampionStats(match) {
  const winner = match?.winner;
  if (!winner || !["Blue", "Red"].includes(winner)) {
    return { updatedChampions: 0 };
  }

  const champions = await readLocalChampions();
  const byName = new Map(
    champions.map((champion, index) => [champion.name.toLowerCase(), index])
  );

  const blueNames = (match.blueSide ?? [])
    .map((entry) => String(entry?.championLabel || "").toLowerCase())
    .filter(Boolean);
  const redNames = (match.redSide ?? [])
    .map((entry) => String(entry?.championLabel || "").toLowerCase())
    .filter(Boolean);

  let updatedChampions = 0;

  const apply = (names, key) => {
    for (const name of names) {
      const index = byName.get(name);
      if (typeof index !== "number") {
        continue;
      }

      const current = champions[index];
      champions[index] = {
        ...current,
        [key]: (current[key] ?? 0) + 1,
      };
      updatedChampions += 1;
    }
  };

  if (winner === "Blue") {
    apply(blueNames, "wins");
    apply(redNames, "losses");
  } else {
    apply(redNames, "wins");
    apply(blueNames, "losses");
  }

  await saveChampions(champions);
  return { updatedChampions };
}

export async function clearChampionStats() {
  const champions = await readLocalChampions();
  const reset = champions.map((champion) => ({
    ...champion,
    wins: 0,
    losses: 0,
  }));

  await saveChampions(reset);
  return reset.length;
}

export async function rebuildChampionStatsFromMatches() {
  const champions = await readLocalChampions();
  const reset = champions.map((champion) => ({
    ...champion,
    wins: 0,
    losses: 0,
  }));

  const byName = new Map(
    reset.map((champion, index) => [champion.name.toLowerCase(), index])
  );

  const matches = await getAllMatches();
  let processedMatches = 0;

  const apply = (names, key) => {
    for (const name of names) {
      const index = byName.get(name);
      if (typeof index !== "number") {
        continue;
      }

      reset[index] = {
        ...reset[index],
        [key]: (reset[index][key] ?? 0) + 1,
      };
    }
  };

  for (const match of matches) {
    if (!match?.winner || !["Blue", "Red"].includes(match.winner)) {
      continue;
    }

    const blueNames = (match.blueSide ?? [])
      .map((entry) => String(entry?.championLabel || "").toLowerCase())
      .filter(Boolean);
    const redNames = (match.redSide ?? [])
      .map((entry) => String(entry?.championLabel || "").toLowerCase())
      .filter(Boolean);

    if (match.winner === "Blue") {
      apply(blueNames, "wins");
      apply(redNames, "losses");
    } else {
      apply(redNames, "wins");
      apply(blueNames, "losses");
    }

    processedMatches += 1;

    if (!match.statsApplied && match.id) {
      await updateMatch(match.id, (previous) => ({
        ...previous,
        statsApplied: true,
      }));
    }
  }

  await saveChampions(reset);
  return { processedMatches };
}

export async function loadChampions(options = {}) {
  const { forceRefresh = false, autoSyncIfEmpty = true } = options;

  if (!forceRefresh && cachedChampions) {
    return cachedChampions;
  }

  let champions = await readLocalChampions();

  if (!champions.length && autoSyncIfEmpty) {
    const synced = await syncChampionsFromRiot();
    champions = synced.champions;
  }

  cachedChampions = champions;
  return champions;
}
