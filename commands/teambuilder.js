import { EmbedBuilder, MessageFlags, PermissionFlagsBits, SlashCommandBuilder } from "discord.js";
import { setTeamConfiguration } from "../data/tournament-state.js";

function shuffle(items) {
  const copy = [...items];
  for (let index = copy.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [copy[index], copy[swapIndex]] = [copy[swapIndex], copy[index]];
  }
  return copy;
}

function chunk(items, size) {
  const teams = [];
  for (let index = 0; index < items.length; index += size) {
    teams.push(items.slice(index, index + size));
  }
  return teams;
}

export default {
  data: new SlashCommandBuilder()
    .setName("teambuilder")
    .setDescription("Create and manage teams")
    .addSubcommand((subcommand) =>
      subcommand
        .setName("shuffle")
        .setDescription("Shuffle players into teams")
        .addIntegerOption((option) =>
          option
            .setName("teamsize")
            .setDescription("Players per team")
            .setRequired(true)
            .setMinValue(2)
            .setMaxValue(20)
        )
        .addStringOption((option) =>
          option
            .setName("players")
            .setDescription("Comma-separated player list")
            .setRequired(true)
        )
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("set")
        .setDescription("Set custom teams and players manually")
        .addStringOption((option) =>
          option
            .setName("team1")
            .setDescription("Team 1 name")
            .setRequired(true)
        )
        .addStringOption((option) =>
          option
            .setName("team1players")
            .setDescription("Team 1 players: Name,Name,Name")
            .setRequired(true)
        )
        .addStringOption((option) =>
          option
            .setName("team2")
            .setDescription("Team 2 name")
            .setRequired(true)
        )
        .addStringOption((option) =>
          option
            .setName("team2players")
            .setDescription("Team 2 players: Name,Name,Name")
            .setRequired(true)
        )
        .addStringOption((option) =>
          option
            .setName("team3")
            .setDescription("Team 3 name")
            .setRequired(false)
        )
        .addStringOption((option) =>
          option
            .setName("team3players")
            .setDescription("Team 3 players: Name,Name,Name")
            .setRequired(false)
        )
        .addStringOption((option) =>
          option
            .setName("team4")
            .setDescription("Team 4 name")
            .setRequired(false)
        )
        .addStringOption((option) =>
          option
            .setName("team4players")
            .setDescription("Team 4 players: Name,Name,Name")
            .setRequired(false)
        )
        .addStringOption((option) =>
          option
            .setName("team5")
            .setDescription("Team 5 name")
            .setRequired(false)
        )
        .addStringOption((option) =>
          option
            .setName("team5players")
            .setDescription("Team 5 players: Name,Name,Name")
            .setRequired(false)
        )
        .addStringOption((option) =>
          option
            .setName("team6")
            .setDescription("Team 6 name")
            .setRequired(false)
        )
        .addStringOption((option) =>
          option
            .setName("team6players")
            .setDescription("Team 6 players: Name,Name,Name")
            .setRequired(false)
        )
        .addStringOption((option) =>
          option
            .setName("team7")
            .setDescription("Team 7 name")
            .setRequired(false)
        )
        .addStringOption((option) =>
          option
            .setName("team7players")
            .setDescription("Team 7 players: Name,Name,Name")
            .setRequired(false)
        )
        .addStringOption((option) =>
          option
            .setName("team8")
            .setDescription("Team 8 name")
            .setRequired(false)
        )
        .addStringOption((option) =>
          option
            .setName("team8players")
            .setDescription("Team 8 players: Name,Name,Name")
            .setRequired(false)
        )
    ),

  async execute(interaction) {
    const subcommand = interaction.options.getSubcommand();

    if ((subcommand === "shuffle" || subcommand === "set") && !interaction.memberPermissions?.has(PermissionFlagsBits.Administrator)) {
      await interaction.reply({
        content: "You need Administrator permission to use this command.",
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    if (subcommand === "set") {
      const teams = [];
      for (let i = 1; i <= 8; i++) {
        const name = interaction.options.getString(`team${i}`);
        const playersRaw = interaction.options.getString(`team${i}players`);

        if (!name && !playersRaw) {
          continue;
        }

        if (!name || !playersRaw) {
          await interaction.reply({
            content: `For team slot ${i}, both team name and player list are required.`,
            flags: MessageFlags.Ephemeral,
          });
          return;
        }

        const players = playersRaw
          .split(",")
          .map((entry) => entry.trim())
          .filter(Boolean);

        if (!players.length) {
          await interaction.reply({
            content: `Team ${i} has no valid players. Use comma-separated names.`,
            flags: MessageFlags.Ephemeral,
          });
          return;
        }

        const uniquePlayers = [...new Set(players)];
        if (uniquePlayers.length !== players.length) {
          await interaction.reply({
            content: `Team ${i} contains duplicate player names.`,
            flags: MessageFlags.Ephemeral,
          });
          return;
        }

        teams.push({ name, players: uniquePlayers });
      }

      if (teams.length < 2) {
        await interaction.reply({
          content: "Please provide at least two teams with players.",
          flags: MessageFlags.Ephemeral,
        });
        return;
      }

      const seenPlayers = new Set();
      for (const team of teams) {
        for (const player of team.players) {
          const key = player.toLowerCase();
          if (seenPlayers.has(key)) {
            await interaction.reply({
              content: `Player ${player} is assigned to more than one team.`,
              flags: MessageFlags.Ephemeral,
            });
            return;
          }
          seenPlayers.add(key);
        }
      }

      await setTeamConfiguration(interaction.guildId, teams, "manual");

      // Build overview embed
      const lines = teams.map((team) => {
        const players = team.players.length > 0 ? team.players.join(", ") : "(no players assigned)";
        return `**${team.name}:** ${players}`;
      });

      const embed = new EmbedBuilder()
        .setTitle("Team Setup")
        .setColor(0x2ecc71)
        .setDescription(lines.join("\n"))
        .setTimestamp()
        .setImage("attachment://team2.jpg");

      await interaction.reply({ embeds: [embed], files: ["./commands/img/team2.jpg"] });
      return;
    }

    // Shuffle subcommand
    const teamSize = interaction.options.getInteger("teamsize", true);
    const playersRaw = interaction.options.getString("players", true);

    const players = playersRaw
      .split(",")
      .map((entry) => entry.trim())
      .filter(Boolean);

    if (players.length < teamSize) {
      await interaction.reply({
        content: "Not enough players for the selected team size.",
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    const uniquePlayers = [...new Set(players)];
    if (uniquePlayers.length !== players.length) {
      await interaction.reply({
        content: "The list contains duplicates. Please enter each player only once.",
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    const mixed = shuffle(uniquePlayers);
    const teams = chunk(mixed, teamSize);
    const fullTeams = teams.filter((team) => team.length === teamSize);
    const remainder = teams.find((team) => team.length < teamSize) ?? [];

    // Save teams configuration
    const teamConfig = fullTeams.map((teamPlayers, idx) => ({
      name: `Team ${idx + 1}`,
      players: teamPlayers,
    }));

    if (remainder.length) {
      teamConfig.push({
        name: "Bench",
        players: remainder,
      });
    }

    await setTeamConfiguration(interaction.guildId, teamConfig, "shuffle");

    // Create overview embed
    const lines = fullTeams.map(
      (team, index) => `**Team ${index + 1}:** ${team.join(", ")}`
    );

    if (remainder.length) {
      lines.push(`**Bench:** ${remainder.join(", ")}`);
    }

    const overviewEmbed = new EmbedBuilder()
      .setTitle("Team Shuffle")
      .setColor(0x2ecc71)
      .setDescription(lines.join("\n"))
      .setTimestamp()
      .setImage("attachment://team.jpg");

    await interaction.reply({ embeds: [overviewEmbed], files: ["./commands/img/team.jpg"] });
  },
};
