import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const matchFilePath = path.join(__dirname, "matches.json");

async function readMatches() {
  const raw = await readFile(matchFilePath, "utf8").catch(() => "[]");
  const parsed = JSON.parse(raw);
  return Array.isArray(parsed) ? parsed : [];
}

export async function getAllMatches() {
  return readMatches();
}

async function writeMatches(matches) {
  await writeFile(matchFilePath, `${JSON.stringify(matches, null, 2)}\n`, "utf8");
}

export function generateMatchId() {
  const now = new Date();
  const datePart = `${now.getUTCFullYear()}${String(now.getUTCMonth() + 1).padStart(2, "0")}${String(
    now.getUTCDate()
  ).padStart(2, "0")}`;
  const randomPart = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `M-${datePart}-${randomPart}`;
}

export async function createMatch(match) {
  const matches = await readMatches();
  matches.push(match);
  await writeMatches(matches);
  return match;
}

export async function updateMatch(matchId, updater) {
  const matches = await readMatches();
  const index = matches.findIndex((item) => item.id === matchId);

  if (index === -1) {
    return null;
  }

  const previous = matches[index];
  const next = updater(previous);
  matches[index] = next;
  await writeMatches(matches);
  return next;
}

export async function getMatchById(matchId) {
  const matches = await readMatches();
  return matches.find((item) => item.id === matchId) ?? null;
}

export async function listMatchesByGuild(guildId, limit = 10) {
  const matches = await readMatches();
  return matches
    .filter((item) => item.guildId === guildId)
    .sort((a, b) => {
      const left = new Date(a.updatedAt || a.createdAt || 0).getTime();
      const right = new Date(b.updatedAt || b.createdAt || 0).getTime();
      return right - left;
    })
    .slice(0, limit);
}

export async function clearMatches() {
  await writeMatches([]);
}
