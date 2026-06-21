import { EmbedBuilder, MessageFlags, SlashCommandBuilder } from "discord.js";

export default {
    data: new SlashCommandBuilder()
        .setName("help")
        .setDescription("Show the current bot commands"),

    async execute(interaction) {
        const isAdmin = interaction.memberPermissions?.has("Administrator") ?? false;
        const userCommands = [
            "Silly Hideout Tournament is a bot to create matches, roll champions, and track results.",
            "",
            "**📋 User Commands**",
            "`/help` - Show this overview.",
            "`/champions status` - Show champion data status.",
            "`/champions winrates` - Show champion winrates.",
            "`/random champion` - Pick a random champion for a role.",
            "`/match status` - Show match details.",
            "`/match list` - List recent matches.",
        ];

        const adminCommands = [
            "",
            "**⚙️ Admin Commands**",
            "`/champions sync` - Sync champions and emojis from Riot.",
            "`/champions reset` - Clear all matches and champion stats.",
            "`/teambuilder shuffle` - Shuffle players into teams.",
            "`/teambuilder set` - Set custom teams with per-team player lists.",
            "`/match create` - Create a match.",
            "`/match start` - Set a match to live.",
            "`/match setwinner` - Set the winner and finish a match.",
            "`/match cancel` - Cancel a match.",
            "`/tournament-poll create` - Create tournament polls.",
        ];

        const description = isAdmin
            ? [...userCommands, ...adminCommands].join("\n")
            : userCommands.join("\n");

        const embed = new EmbedBuilder()
            .setTitle("Command overview")
            .setColor(0xffea00)
            .setDescription(description);

        await interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
    },
};