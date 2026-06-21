import "dotenv/config";
import { readdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { REST, Routes } from "discord.js";

const { TOKEN, APPLICATION_ID, GUILD_ID } = process.env;

if (!TOKEN) {
  throw new Error("Missing required env var: TOKEN");
}

if (!APPLICATION_ID) {
  throw new Error("Missing required env var: APPLICATION_ID");
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const commandsPath = path.join(__dirname, "commands");

const commandFiles = (await readdir(commandsPath)).filter((file) =>
  file.endsWith(".js")
);

const commands = [];

for (const file of commandFiles) {
  const filePath = path.join(commandsPath, file);
  const commandModule = await import(pathToFileURL(filePath).href);
  const command = commandModule.default;

  if (!command?.data) {
    console.warn(`[WARNING] Skipping ${file}, no data found.`);
    continue;
  }

  commands.push(command.data.toJSON());
}

const rest = new REST({ version: "10" }).setToken(TOKEN);

async function deployGlobal() {
  console.log(`Refreshing ${commands.length} command(s) on global scope...`);
  const data = await rest.put(Routes.applicationCommands(APPLICATION_ID), {
    body: commands,
  });
  console.log(`Successfully deployed ${data.length} global command(s).`);
}

async function clearGlobal() {
  console.log("Clearing global commands to avoid duplicates on single-server setup...");
  await rest.put(Routes.applicationCommands(APPLICATION_ID), {
    body: [],
  });
  console.log("Successfully cleared global command scope.");
}

async function deployGuild(guildId) {
  console.log(`Refreshing ${commands.length} command(s) on guild scope (${guildId})...`);
  const data = await rest.put(
    Routes.applicationGuildCommands(APPLICATION_ID, guildId),
    {
      body: commands,
    }
  );
  console.log(`Successfully deployed ${data.length} guild command(s).`);
}

if (GUILD_ID) {
  await deployGuild(GUILD_ID);
  await clearGlobal();
} else {
  await deployGlobal();
  console.warn("GUILD_ID not set: deployed only global commands.");
}
