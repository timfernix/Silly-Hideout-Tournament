import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import axios from "axios";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const emojiFilePath = path.join(__dirname, "champion-emojis.json");

function sanitizeEmojiName(smoothName) {
  const base = String(smoothName || "champ")
    .replace(/[^a-zA-Z0-9_]/g, "")
    .toLowerCase();
  const withPrefix = `ch_${base}`;
  return withPrefix.slice(0, 32);
}

function toMention(name, id) {
  return `<:${name}:${id}>`;
}

async function readEmojiMap() {
  const raw = await readFile(emojiFilePath, "utf8").catch(() => "{}");
  const parsed = JSON.parse(raw);
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    return {};
  }
  return parsed;
}

async function writeEmojiMap(data) {
  await writeFile(emojiFilePath, `${JSON.stringify(data, null, 2)}\n`, "utf8");
}

async function fetchImageBuffer(url) {
  const response = await axios.get(url, {
    responseType: "arraybuffer",
    timeout: 20_000,
  });
  return Buffer.from(response.data);
}

export async function syncChampionApplicationEmojis(client, champions) {
  if (!client.application) {
    await client.application?.fetch?.();
  }

  if (!client.application) {
    throw new Error("Application context unavailable. Try again after the bot is ready.");
  }

  const manager = client.application.emojis;
  const existing = await manager.fetch();
  const map = await readEmojiMap();

  let created = 0;
  let reused = 0;
  let failed = 0;

  for (const champion of champions) {
    const emojiName = sanitizeEmojiName(champion.smoothName);
    let emoji = existing.find((entry) => entry.name === emojiName) ?? null;

    if (!emoji) {
      try {
        const image = await fetchImageBuffer(champion.iconUrl);
        emoji = await manager.create({
          attachment: image,
          name: emojiName,
        });
        created += 1;
      } catch {
        failed += 1;
        continue;
      }
    } else {
      reused += 1;
    }

    map[champion.id] = {
      id: emoji.id,
      name: emoji.name,
      mention: toMention(emoji.name, emoji.id),
      updatedAt: new Date().toISOString(),
    };
  }

  await writeEmojiMap(map);

  return {
    created,
    reused,
    failed,
    emojiMap: map,
  };
}

export async function loadChampionEmojiMap() {
  return readEmojiMap();
}
