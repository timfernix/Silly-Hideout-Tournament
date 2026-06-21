import {
  EmbedBuilder,
  MessageFlags,
  PermissionFlagsBits,
  SlashCommandBuilder,
} from "discord.js";
import {
  applyMatchResultToChampionStats,
  loadChampions,
} from "../data/champion-store.js";
import {
  createMatch,
  generateMatchId,
  getMatchById,
  listMatchesByGuild,
  updateMatch,
} from "../data/match-store.js";
import { getTeamConfiguration } from "../data/tournament-state.js";

const roles = ["Top", "Jungle", "Mid", "Adc", "Support"];
const roleEmojis = [
  "<:TopLane:1518246358891630632>",
  "<:Jungle:1518246357159247912>",
  "<:MidLane:1518246355926122616>",
  "<:ADC:1518246354684477501>",
  "<:Support:1518246351777960088>",
];
const matchStates = ["scheduled", "live", "finished", "canceled"];
const protectedSubcommands = new Set(["start", "setwinner", "cancel"]);
const blueChampionOptionNames = [
  "blue-top",
  "blue-jungle",
  "blue-mid",
  "blue-adc",
  "blue-support",
];
const redChampionOptionNames = [
  "red-top",
  "red-jungle",
  "red-mid",
  "red-adc",
  "red-support",
];
const championOptionNames = new Set([
  ...blueChampionOptionNames,
  ...redChampionOptionNames,
]);

function parseCsv(input) {
  return input
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean);
}

function resolveChampion(champions, query) {
  const normalized = query.toLowerCase();
  return champions.find((champion) => {
    return (
      champion.id?.toLowerCase() === normalized ||
      champion.name?.toLowerCase() === normalized ||
      champion.smoothName?.toLowerCase() === normalized
    );
  });
}

function formatSide(prefix, lineup) {
  const lines = lineup.map((entry, index) => {
    const role = roles[index] ?? `Slot ${index + 1}`;
    const roleEmoji = roleEmojis[index] ?? `**${role}:**`;
    const championDisplay = entry.emoji
      ? `${entry.emoji} ${entry.championLabel}`
      : entry.championLabel;
    return `${roleEmoji} ${championDisplay} - ${entry.player}`;
  });

  return {
    name: prefix,
    value: lines.join("\n"),
    inline: true,
  };
}

function toMatchStateLabel(state) {
  const labels = {
    scheduled: "Scheduled",
    live: "Live",
    finished: "Finished",
    canceled: "Canceled",
  };

  return labels[state] ?? state;
}

function toMatchColor(match) {
  if (match.status === "finished") {
    return match.winner === "Blue" ? 0x3498db : 0xe74c3c;
  }

  if (match.status === "live") {
    return 0xf39c12;
  }

  if (match.status === "canceled") {
    return 0x7f8c8d;
  }

  return 0xffd700;
}

async function hydrateMatchWithEmojis(match) {
  const champions = await loadChampions({ autoSyncIfEmpty: false });
  const byName = new Map(
    champions.map((champion) => [champion.name.toLowerCase(), champion])
  );

  const decorate = (lineup = []) =>
    lineup.map((entry) => {
      if (entry.emoji) {
        return entry;
      }

      const champion = byName.get(String(entry.championLabel || "").toLowerCase());
      if (!champion?.emoji) {
        return entry;
      }

      return {
        ...entry,
        emoji: champion.emoji,
      };
    });

  return {
    ...match,
    blueSide: decorate(match.blueSide),
    redSide: decorate(match.redSide),
  };
}

function buildMatchEmbed(match) {
  const embed = new EmbedBuilder()
    .setTitle(match.title)
    .setDescription(`Status: **${toMatchStateLabel(match.status)}**`)
    .setColor(toMatchColor(match))
    .addFields(formatSide(":blue_square: Blue Side", match.blueSide))
    .addFields(formatSide(":red_square: Red Side", match.redSide))
    .addFields({
      name: "Match",
      value: [
        `ID: **${match.id}**`,
        `Winner: **${match.winner ?? "Pending"}**`,
        `Score: **${match.score ?? "-"}**`,
      ].join("\n"),
      inline: false,
    })
    .setFooter({ text: `Created by ${match.createdByTag}` })
    .setTimestamp(new Date(match.updatedAt || match.createdAt));

  return embed;
}

async function resolveMatchById(interaction, matchId) {
  const match = await getMatchById(matchId);
  if (!match || match.guildId !== interaction.guildId) {
    return null;
  }

  return match;
}

async function resolveStoredMessage(interaction, match) {
  const channel = await interaction.client.channels.fetch(match.channelId).catch(() => null);
  if (!channel || typeof channel.messages?.fetch !== "function") {
    return null;
  }

  const message = await channel.messages.fetch(match.messageId).catch(() => null);
  if (!message) {
    return null;
  }

  return message;
}

export default {
  data: new SlashCommandBuilder()
    .setName("match")
    .setDescription("Create and manage match overviews")
    .addSubcommand((subcommand) =>
      subcommand
        .setName("create")
        .setDescription("Create a match")
        .addStringOption((option) =>
          option.setName("title").setDescription("Match title").setRequired(true)
        )
        .addStringOption((option) =>
          option
            .setName("blue-players")
            .setDescription("Blue team players: Name,Name,Name,Name,Name")
            .setRequired(true)
        )
        .addStringOption((option) =>
          option
            .setName("red-players")
            .setDescription("Red team players: Name,Name,Name,Name,Name")
            .setRequired(true)
        )
        .addStringOption((option) =>
          option
            .setName("blue-top")
            .setDescription("Blue Top Champion")
            .setAutocomplete(true)
            .setRequired(true)
        )
        .addStringOption((option) =>
          option
            .setName("blue-jungle")
            .setDescription("Blue Jungle Champion")
            .setAutocomplete(true)
            .setRequired(true)
        )
        .addStringOption((option) =>
          option
            .setName("blue-mid")
            .setDescription("Blue Mid Champion")
            .setAutocomplete(true)
            .setRequired(true)
        )
        .addStringOption((option) =>
          option
            .setName("blue-adc")
            .setDescription("Blue ADC Champion")
            .setAutocomplete(true)
            .setRequired(true)
        )
        .addStringOption((option) =>
          option
            .setName("blue-support")
            .setDescription("Blue Support Champion")
            .setAutocomplete(true)
            .setRequired(true)
        )
        .addStringOption((option) =>
          option
            .setName("red-top")
            .setDescription("Red Top Champion")
            .setAutocomplete(true)
            .setRequired(true)
        )
        .addStringOption((option) =>
          option
            .setName("red-jungle")
            .setDescription("Red Jungle Champion")
            .setAutocomplete(true)
            .setRequired(true)
        )
        .addStringOption((option) =>
          option
            .setName("red-mid")
            .setDescription("Red Mid Champion")
            .setAutocomplete(true)
            .setRequired(true)
        )
        .addStringOption((option) =>
          option
            .setName("red-adc")
            .setDescription("Red ADC Champion")
            .setAutocomplete(true)
            .setRequired(true)
        )
        .addStringOption((option) =>
          option
            .setName("red-support")
            .setDescription("Red Support Champion")
            .setAutocomplete(true)
            .setRequired(true)
        )
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("start")
        .setDescription("Set a match to live")
        .addStringOption((option) =>
          option
            .setName("match-id")
            .setDescription("Internal match ID")
            .setAutocomplete(true)
            .setRequired(true)
        )
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("setwinner")
        .setDescription("Set winner and finish a match")
        .addStringOption((option) =>
          option
            .setName("match-id")
            .setDescription("Internal match ID")
            .setAutocomplete(true)
            .setRequired(true)
        )
        .addStringOption((option) =>
          option
            .setName("winner")
            .setDescription("Winning side")
            .setRequired(true)
            .addChoices(
              { name: "Blue", value: "Blue" },
              { name: "Red", value: "Red" }
            )
        )
        .addStringOption((option) =>
          option
            .setName("score")
            .setDescription("Match score, e.g. 2:1")
            .setRequired(true)
        )
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("cancel")
        .setDescription("Cancel a match")
        .addStringOption((option) =>
          option
            .setName("match-id")
            .setDescription("Internal match ID")
            .setAutocomplete(true)
            .setRequired(true)
        )
        .addStringOption((option) =>
          option
            .setName("reason")
            .setDescription("Optional reason")
            .setRequired(false)
        )
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("status")
        .setDescription("Show details for a match")
        .addStringOption((option) =>
          option
            .setName("match-id")
            .setDescription("Internal match ID")
            .setAutocomplete(true)
            .setRequired(true)
        )
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("list")
        .setDescription("List recent matches")
        .addStringOption((option) =>
          option
            .setName("state")
            .setDescription("Optional status filter")
            .setRequired(false)
            .addChoices(
              { name: "All", value: "all" },
              { name: "Scheduled", value: "scheduled" },
              { name: "Live", value: "live" },
              { name: "Finished", value: "finished" },
              { name: "Canceled", value: "canceled" }
            )
        )
    ),

  async autocomplete(interaction) {
    const subcommand = interaction.options.getSubcommand(false);
    const focusedOption = interaction.options.getFocused(true);

    if (!subcommand || !focusedOption) {
      await interaction.respond([]).catch(() => {});
      return;
    }

    if (subcommand === "create" && championOptionNames.has(focusedOption.name)) {
      const champions = await loadChampions();
      const focused = String(focusedOption.value || "").toLowerCase().trim();

      const suggestions = champions
        .filter((champion) => {
          if (!focused) {
            return true;
          }

          return (
            champion.name.toLowerCase().includes(focused) ||
            champion.id.toLowerCase().includes(focused)
          );
        })
        .slice(0, 25)
        .map((champion) => {
          return {
            name: champion.name.slice(0, 100),
            value: champion.name.slice(0, 100),
          };
        });

      await interaction.respond(suggestions).catch(() => {});
      return;
    }

    if (focusedOption.name === "match-id") {
      const matches = await listMatchesByGuild(interaction.guildId, 25);
      const query = String(focusedOption.value || "").toLowerCase();
      const suggestions = matches
        .filter((match) => (query ? match.id.toLowerCase().includes(query) : true))
        .map((match) => ({
          name: `${match.id} | ${match.title} | ${toMatchStateLabel(match.status)}`.slice(0, 100),
          value: match.id,
        }))
        .slice(0, 25);

      await interaction.respond(suggestions).catch(() => {});
      return;
    }

    await interaction.respond([]).catch(() => {});
  },

  async execute(interaction) {
    const subcommand = interaction.options.getSubcommand();

    if ((subcommand === "create" || protectedSubcommands.has(subcommand)) && !interaction.memberPermissions?.has(PermissionFlagsBits.Administrator)) {
      await interaction.reply({
        content: "You need Administrator permission to modify matches.",
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    if (subcommand === "list") {
      const state = interaction.options.getString("state") || "all";
      const matches = await listMatchesByGuild(interaction.guildId, 15);
      const filtered =
        state === "all" ? matches : matches.filter((match) => match.status === state);

      if (!filtered.length) {
        await interaction.reply({
          content: "No matches found for the selected filter.",
          flags: MessageFlags.Ephemeral,
        });
        return;
      }

      const lines = filtered.map(
        (match) =>
          `**${match.id}** | ${match.title} | ${toMatchStateLabel(match.status)} | Winner: ${
            match.winner ?? "-"
          }`
      );

      await interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setTitle("Match list")
            .setColor(0x95a5a6)
            .setDescription(lines.join("\n")),
        ],
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    if (subcommand === "status") {
      const matchId = interaction.options.getString("match-id", true);
      const match = await resolveMatchById(interaction, matchId);

      if (!match) {
        await interaction.reply({
          content: `No match found with ID ${matchId}.`,
          flags: MessageFlags.Ephemeral,
        });
        return;
      }

      await interaction.reply({
        embeds: [buildMatchEmbed(await hydrateMatchWithEmojis(match))],
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    if (subcommand === "start") {
      const matchId = interaction.options.getString("match-id", true);
      const match = await resolveMatchById(interaction, matchId);

      if (!match) {
        await interaction.reply({
          content: `No match found with ID ${matchId}.`,
          flags: MessageFlags.Ephemeral,
        });
        return;
      }

      if (match.status === "finished" || match.status === "canceled") {
        await interaction.reply({
          content: `Match ${match.id} is already ${toMatchStateLabel(match.status)} and cannot be started.`,
          flags: MessageFlags.Ephemeral,
        });
        return;
      }

      const now = new Date().toISOString();
      const updated = await updateMatch(match.id, (previous) => ({
        ...previous,
        status: "live",
        startedAt: previous.startedAt ?? now,
        updatedAt: now,
        updatedBy: interaction.user.id,
        updatedByTag: interaction.user.tag,
      }));

      const message = await resolveStoredMessage(interaction, updated);
      if (!message) {
        await interaction.reply({
          content: "The stored match message could not be found.",
          flags: MessageFlags.Ephemeral,
        });
        return;
      }

      await message.edit({ embeds: [buildMatchEmbed(await hydrateMatchWithEmojis(updated))] });
      await message.channel.send({
        content: `:crossed_swords: Match **${updated.title}** (${updated.id}) is now live!`,
      });

      await interaction.reply({
        content: `Match ${updated.id} has been set to live.`,
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    if (subcommand === "cancel") {
      const matchId = interaction.options.getString("match-id", true);
      const reason = interaction.options.getString("reason") || "No reason provided.";
      const match = await resolveMatchById(interaction, matchId);

      if (!match) {
        await interaction.reply({
          content: `No match found with ID ${matchId}.`,
          flags: MessageFlags.Ephemeral,
        });
        return;
      }

      const now = new Date().toISOString();
      const updated = await updateMatch(match.id, (previous) => ({
        ...previous,
        status: "canceled",
        cancelReason: reason,
        updatedAt: now,
        updatedBy: interaction.user.id,
        updatedByTag: interaction.user.tag,
      }));

      const message = await resolveStoredMessage(interaction, updated);
      if (!message) {
        await interaction.reply({
          content: "The stored match message could not be found.",
          flags: MessageFlags.Ephemeral,
        });
        return;
      }

      await message.edit({ embeds: [buildMatchEmbed(await hydrateMatchWithEmojis(updated))] });
      await message.channel.send({
        content: `:warning: Match **${updated.title}** (${updated.id}) was canceled. Reason: ${reason}`,
      });

      await interaction.reply({
        content: `Match ${updated.id} was canceled.`,
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    if (subcommand === "setwinner") {
      const matchId = interaction.options.getString("match-id", true);
      const winner = interaction.options.getString("winner", true);
      const score = interaction.options.getString("score") || null;
      const match = await resolveMatchById(interaction, matchId);

      if (!match) {
        await interaction.reply({
          content: `No match found with ID ${matchId}.`,
          flags: MessageFlags.Ephemeral,
        });
        return;
      }

      if (!/^\d+[:\-]\d+$/.test(score)) {
        await interaction.reply({
          content: "Invalid score format. Use e.g. 2:1 or 3-0.",
          flags: MessageFlags.Ephemeral,
        });
        return;
      }

      const now = new Date().toISOString();
      const normalizedScore = score.replace("-", ":");
      const updated = await updateMatch(match.id, (previous) => ({
        ...previous,
        status: "finished",
        winner,
        score: normalizedScore,
        finishedAt: now,
        updatedAt: now,
        updatedBy: interaction.user.id,
        updatedByTag: interaction.user.tag,
      }));

      if (!match.statsApplied) {
        await applyMatchResultToChampionStats(updated);
      }

      const finalized = await updateMatch(match.id, (previous) => ({
        ...previous,
        statsApplied: true,
      }));

      const message = await resolveStoredMessage(interaction, finalized);
      if (!message) {
        await interaction.reply({
          content: "The stored match message could not be found.",
          flags: MessageFlags.Ephemeral,
        });
        return;
      }

      await message.edit({ embeds: [buildMatchEmbed(await hydrateMatchWithEmojis(finalized))] });
      await message.channel.send({
        content: `:trophy: Winner of **${finalized.title}** (${finalized.id}): **${winner} Side** | Score: **${normalizedScore}**`,
      });

      await interaction.reply({
        content: `Winner has been set for match ${finalized.id}.`,
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    const title = interaction.options.getString("title", true);
    const bluePlayersRaw = interaction.options.getString("blue-players", true);
    const redPlayersRaw = interaction.options.getString("red-players", true);

    const bluePlayers = parseCsv(bluePlayersRaw);
    const redPlayers = parseCsv(redPlayersRaw);
    const blueChampionNames = blueChampionOptionNames.map((name) =>
      interaction.options.getString(name, true)
    );
    const redChampionNames = redChampionOptionNames.map((name) =>
      interaction.options.getString(name, true)
    );

    if (bluePlayers.length !== 5 || redPlayers.length !== 5) {
      await interaction.reply({
        content: "Blue and Red players must each contain exactly 5 entries.",
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    if (
      new Set([...bluePlayers, ...redPlayers].map((value) => value.toLowerCase())).size !==
      10
    ) {
      await interaction.reply({
        content: "Player names must be unique within a match.",
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    const champions = await loadChampions();
    const championByName = new Map(
      champions.map((champion) => [champion.name.toLowerCase(), champion])
    );

    const unknownChampions = [...blueChampionNames, ...redChampionNames].filter(
      (name) => !championByName.has(name.toLowerCase())
    );

    if (unknownChampions.length) {
      await interaction.reply({
        content: `Unknown champions: ${unknownChampions.join(
          ", "
        )}. Use autocomplete in each champion field.`,
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    const mappedBlue = bluePlayers.map((player, index) => {
      const champion = resolveChampion(champions, blueChampionNames[index] ?? "");
      return {
        player,
        championLabel: champion ? champion.name : blueChampionNames[index],
        emoji: champion?.emoji ?? "",
        iconUrl: champion?.iconUrl ?? "",
      };
    });

    const mappedRed = redPlayers.map((player, index) => {
      const champion = resolveChampion(champions, redChampionNames[index] ?? "");
      return {
        player,
        championLabel: champion ? champion.name : redChampionNames[index],
        emoji: champion?.emoji ?? "",
        iconUrl: champion?.iconUrl ?? "",
      };
    });

    let matchId = generateMatchId();
    while (await getMatchById(matchId)) {
      matchId = generateMatchId();
    }

    const { teams } = await getTeamConfiguration(interaction.guildId);
    const blueTeamName = teams[0]?.name || "Team 1";
    const redTeamName = teams[1]?.name || "Team 2";

    const now = new Date().toISOString();
    const pendingMatch = {
      id: matchId,
      guildId: interaction.guildId,
      channelId: interaction.channelId,
      messageId: "",
      title,
      status: matchStates[0],
      winner: null,
      score: null,
      blueSide: mappedBlue,
      redSide: mappedRed,
      blueTeamName,
      redTeamName,
      createdAt: now,
      updatedAt: now,
      createdBy: interaction.user.id,
      createdByTag: interaction.user.tag,
      updatedBy: interaction.user.id,
      updatedByTag: interaction.user.tag,
    };

    await interaction.reply({
      embeds: [buildMatchEmbed(pendingMatch)],
    });

    const replyMessage = await interaction.fetchReply();

    await createMatch({
      ...pendingMatch,
      messageId: replyMessage.id,
    });
  },
};
