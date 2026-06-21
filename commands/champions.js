import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder,
  MessageFlags,
  PermissionFlagsBits,
  SlashCommandBuilder,
} from "discord.js";
import {
  clearChampionStats,
  applyChampionEmojiMap,
  loadChampions,
  rebuildChampionStatsFromMatches,
  syncChampionsFromRiot,
} from "../data/champion-store.js";
import { clearMatches } from "../data/match-store.js";
import {
  loadChampionEmojiMap,
  syncChampionApplicationEmojis,
} from "../data/champion-emoji-store.js";

const OWNER_ID = "589773984447463434";
const CHAMPIONS_PER_PAGE = 10;

function toChampionLine(champion) {
  const picks = champion.wins + champion.losses;
  const winrate = picks > 0 ? ((champion.wins / picks) * 100).toFixed(1) : "0.0";
  const emoji = champion.emoji ? `${champion.emoji} ` : "";
  const link = `https://u.gg/lol/champions/${champion.smoothName}/build`;

  return `${emoji}[${champion.name}](${link}) - **${winrate}%** (${champion.wins}W/${champion.losses}L, ${picks} picks)`;
}

function chunkLines(lines, maxCharPerChunk = 1024) {
  const chunks = [];
  let currentChunk = [];
  let currentLength = 0;

  for (const line of lines) {
    const lineLength = line.length + 1; // +1 for newline

    if (currentLength + lineLength > maxCharPerChunk && currentChunk.length > 0) {
      chunks.push(currentChunk);
      currentChunk = [];
      currentLength = 0;
    }

    currentChunk.push(line);
    currentLength += lineLength;
  }

  if (currentChunk.length > 0) {
    chunks.push(currentChunk);
  }

  return chunks;
}

export default {
  data: new SlashCommandBuilder()
    .setName("champions")
    .setDescription("Manage champion data")
    .addSubcommand((subcommand) =>
      subcommand
        .setName("sync")
        .setDescription("Sync champion data from Riot Data Dragon")
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("status")
        .setDescription("Show local champion data status")
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("winrates")
        .setDescription("Show champion winrates from played matches")
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("reset")
        .setDescription("Clear all matches and champion winrates")
    ),

  async execute(interaction) {
    const subcommand = interaction.options.getSubcommand();

    if (
      subcommand === "sync" &&
      !interaction.memberPermissions?.has(PermissionFlagsBits.Administrator)
    ) {
      await interaction.reply({
        content: "You need Administrator permission to sync champion data.",
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    if (subcommand === "sync") {
      await interaction.deferReply({ flags: MessageFlags.Ephemeral });

      const { version, champions } = await syncChampionsFromRiot();
      const emojiSync = await syncChampionApplicationEmojis(interaction.client, champions);
      await applyChampionEmojiMap(emojiSync.emojiMap);

      await interaction.editReply({
        embeds: [
          new EmbedBuilder()
            .setTitle("Champion sync completed")
            .setColor(0x2ecc71)
            .setDescription(
              [
                `Version: **${version}**`,
                `Champions: **${champions.length}**`,
                `Emojis created: **${emojiSync.created}**`,
                `Emojis reused: **${emojiSync.reused}**`,
                `Emoji failures: **${emojiSync.failed}**`,
              ].join("\n")
            ),
        ],
      });
      return;
    }

    if (subcommand === "winrates") {
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

      if (!played.length) {
        await interaction.reply({
          content: "No champion winrates available yet. Play matches first.",
          flags: MessageFlags.Ephemeral,
        });
        return;
      }

      const lines = played.map(toChampionLine);
      const chunks = chunkLines(lines);
      const embeds = chunks.map((chunk, index) =>
        new EmbedBuilder()
          .setTitle(index === 0 ? "Champion Winrates" : `Champion Winrates (Page ${index + 1})`)
          .setColor(0x2ecc71)
          .setDescription(chunk.join("\n"))
      );

      await interaction.reply({ embeds });
      return;
    }

    if (subcommand === "reset") {
      if (interaction.user.id !== OWNER_ID) {
        await interaction.reply({
          content: "Only the bot owner can use this command.",
          flags: MessageFlags.Ephemeral,
        });
        return;
      }

      await clearMatches();
      await clearChampionStats();

      await interaction.reply({
        content: "Reset completed. All matches and champion stats were cleared.",
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    const champions = await loadChampions({ autoSyncIfEmpty: false });
    const latestVersion = champions.find((entry) => entry.version)?.version || "unknown";
    const emojiMap = await loadChampionEmojiMap();
    const emojiCount = Object.keys(emojiMap).length;

    await interaction.reply({
      embeds: [
        new EmbedBuilder()
          .setTitle("Champion data")
          .setColor(0x3498db)
          .setDescription(
            `Local champions: **${champions.length}**\nVersion: **${latestVersion}**\nStored champion emojis: **${emojiCount}**\nUse /champions sync to update.`
          ),
      ],
      flags: MessageFlags.Ephemeral,
    });
  },
};
