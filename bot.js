import "dotenv/config";
import { readdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import {
  ActivityType,
  Client,
  Collection,
  Events,
  GatewayIntentBits,
  MessageFlags,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder,
} from "discord.js";
import {
  loadChampions,
  rebuildChampionStatsFromMatches,
} from "./data/champion-store.js";

const { TOKEN } = process.env;

if (!TOKEN) {
  throw new Error("Missing required env var: TOKEN");
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const CHAMPIONS_PER_PAGE = 10;

function toChampionLine(champion) {
  const picks = champion.wins + champion.losses;
  const winrate = picks > 0 ? ((champion.wins / picks) * 100).toFixed(1) : "0.0";
  const emoji = champion.emoji ? `${champion.emoji} ` : "";
  const link = `https://u.gg/lol/champions/${champion.smoothName}/build`;

  return `${emoji}[${champion.name}](${link}) - **${winrate}%** (${champion.wins}W/${champion.losses}L, ${picks} picks)`;
}

const client = new Client({ intents: [GatewayIntentBits.Guilds] });
client.commands = new Collection();

async function loadCommands() {
  const commandsPath = path.join(__dirname, "commands");
  const commandFiles = (await readdir(commandsPath)).filter((file) =>
    file.endsWith(".js")
  );

  for (const file of commandFiles) {
    const filePath = path.join(commandsPath, file);
    const commandModule = await import(pathToFileURL(filePath).href);
    const command = commandModule.default;

    if (command?.data && command?.execute) {
      client.commands.set(command.data.name, command);
      continue;
    }

    console.warn(
      `[WARNING] Command ${file} was skipped because it is missing data or execute.`
    );
  }
}

client.once(Events.ClientReady, (readyClient) => {
  console.log(`Ready! Logged in as ${readyClient.user.tag}`);
  readyClient.user.setActivity({
    name: "your tournaments",
    type: ActivityType.Watching,
  });
});

client.on(Events.InteractionCreate, async (interaction) => {
  try {
    if (interaction.isButton()) {
      if (interaction.customId.startsWith("winrates_")) {
        await rebuildChampionStatsFromMatches();
        const champions = await loadChampions({ autoSyncIfEmpty: false });
        const played = champions
          .map((champion) => ({
            ...champion,
            picks: champion.wins + champion.losses,
          }))
          .filter((champion) => champion.picks > 0)
          .sort((left, right) => {
            const leftRate = left.picks > 0 ? left.wins / left.picks : 0;
            const rightRate = right.picks > 0 ? right.wins / right.picks : 0;

            if (rightRate !== leftRate) {
              return rightRate - leftRate;
            }

            return right.picks - left.picks;
          });

        const totalPages = Math.ceil(played.length / CHAMPIONS_PER_PAGE);
        const [action, pageStr] = interaction.customId.split("_").slice(1);
        let currentPage = parseInt(pageStr, 10) || 0;

        if (action === "prev") {
          currentPage = Math.max(0, currentPage - 1);
        } else if (action === "next") {
          currentPage = Math.min(totalPages - 1, currentPage + 1);
        }

        const startIdx = currentPage * CHAMPIONS_PER_PAGE;
        const endIdx = startIdx + CHAMPIONS_PER_PAGE;
        const pageChampions = played.slice(startIdx, endIdx);

        const lines = pageChampions.map(toChampionLine);

        const embed = new EmbedBuilder()
          .setTitle("Champion Winrates")
          .setColor(0x2ecc71)
          .setDescription(lines.join("\n"))
          .setFooter({ text: `Page ${currentPage + 1} of ${totalPages}` });

        const buttons = new ActionRowBuilder().addComponents(
          new ButtonBuilder()
            .setCustomId(`winrates_prev_${currentPage}`)
            .setLabel("◀️ Previous")
            .setStyle(ButtonStyle.Primary)
            .setDisabled(currentPage === 0),
          new ButtonBuilder()
            .setCustomId(`winrates_next_${currentPage}`)
            .setLabel("Next ▶️")
            .setStyle(ButtonStyle.Primary)
            .setDisabled(currentPage === totalPages - 1)
        );

        await interaction.update({ embeds: [embed], components: [buttons] });
      }
      return;
    }

    if (interaction.isAutocomplete()) {
      const command = client.commands.get(interaction.commandName);
      if (command && typeof command.autocomplete === "function") {
        await command.autocomplete(interaction);
      }
      return;
    }

    if (!interaction.isChatInputCommand()) {
      return;
    }

    const command = client.commands.get(interaction.commandName);
    if (!command) {
      return;
    }

    await command.execute(interaction);
  } catch (error) {
    console.error(error);
    const payload = {
      content: "An error occurred while executing this command.",
      flags: MessageFlags.Ephemeral,
    };

    if (interaction.deferred || interaction.replied) {
      await interaction.followUp(payload).catch(() => {});
    } else {
      await interaction.reply(payload).catch(() => {});
    }
  }
});

await loadCommands();
await client.login(TOKEN);
