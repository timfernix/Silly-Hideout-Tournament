import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const stateFilePath = path.join(__dirname, "tournament-state.json");

function getTodayDateString() {
  const now = new Date();
  return `${now.getUTCFullYear()}${String(now.getUTCMonth() + 1).padStart(2, "0")}${String(
    now.getUTCDate()
  ).padStart(2, "0")}`;
}

async function readState() {
  const raw = await readFile(stateFilePath, "utf8").catch(() => "{}");
  const parsed = JSON.parse(raw);
  return typeof parsed === "object" && parsed !== null ? parsed : {};
}

async function writeState(state) {
  await writeFile(stateFilePath, `${JSON.stringify(state, null, 2)}\n`, "utf8");
}

export async function getTeamConfiguration(guildId) {
  const state = await readState();
  const today = getTodayDateString();
  const key = `${guildId}-${today}`;
  
  return state[key] ?? {
    date: today,
    teams: [
      { name: "Team 1", players: [] },
      { name: "Team 2", players: [] },
    ],
    type: null,
  };
}

export async function setTeamConfiguration(guildId, teams, type = "shuffle") {
  const state = await readState();
  const today = getTodayDateString();
  const key = `${guildId}-${today}`;
  
  state[key] = {
    date: today,
    teams,
    type,
    updatedAt: new Date().toISOString(),
  };
  await writeState(state);
  return state[key];
}

export async function clearOldTeamConfigurations(guildId, daysToKeep = 7) {
  const state = await readState();
  const now = new Date();
  const cutoffDate = new Date(now.getTime() - daysToKeep * 24 * 60 * 60 * 1000);
  
  const keysToDelete = [];
  for (const key of Object.keys(state)) {
    if (key.startsWith(guildId)) {
      const dateStr = key.split("-").slice(1).join("-");
      const year = parseInt(dateStr.substring(0, 4), 10);
      const month = parseInt(dateStr.substring(4, 6), 10) - 1;
      const day = parseInt(dateStr.substring(6, 8), 10);
      const configDate = new Date(year, month, day);
      
      if (configDate < cutoffDate) {
        keysToDelete.push(key);
      }
    }
  }
  
  keysToDelete.forEach((key) => delete state[key]);
  await writeState(state);
  return keysToDelete.length;
}
