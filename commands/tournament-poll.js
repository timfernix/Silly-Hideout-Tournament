import {
    EmbedBuilder,
    MessageFlags,
    PermissionFlagsBits,
    PollLayoutType,
    SlashCommandBuilder,
} from "discord.js";
import dayjs from "dayjs";
import customParseFormat from "dayjs/plugin/customParseFormat.js";

dayjs.extend(customParseFormat);

function parseCsv(input) {
    return input
        .split(",")
        .map((entry) => entry.trim())
        .filter(Boolean);
}

export default {
    data: new SlashCommandBuilder()
        .setName("tournament-poll")
        .setDescription("Create tournament polls")
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
        .addSubcommand((subcommand) =>
            subcommand
                .setName("create")
                .setDescription("Create all polls for a tournament")
                .addStringOption((option) =>
                    option
                        .setName("title")
                        .setDescription("Tournament title")
                        .setRequired(true)
                )
                .addIntegerOption((option) =>
                    option
                        .setName("duration")
                        .setDescription("Duration in hours (1-168)")
                        .setRequired(true)
                        .setMinValue(1)
                        .setMaxValue(168)
                )
                .addStringOption((option) =>
                    option
                        .setName("dates")
                        .setDescription("Date list: YYYY-MM-DD,YYYY-MM-DD,...")
                        .setRequired(true)
                )
                .addStringOption((option) =>
                    option
                        .setName("times")
                        .setDescription("Time list: HH:mm,HH:mm,...")
                        .setRequired(true)
                )
        ),

    async execute(interaction) {
        const title = interaction.options.getString("title", true);
        const duration = interaction.options.getInteger("duration", true);
        const rawDates = parseCsv(interaction.options.getString("dates", true));
        const rawTimes = parseCsv(interaction.options.getString("times", true));

        if (rawDates.length < 2 || rawTimes.length < 2) {
            await interaction.reply({
                content: "Please provide at least 2 dates and 2 times.",
                flags: MessageFlags.Ephemeral,
            });
            return;
        }

        const formattedDates = [];
        for (const value of rawDates) {
            const parsed = dayjs(value, "YYYY-MM-DD", true);
            if (!parsed.isValid()) {
                await interaction.reply({
                    content: `Invalid date: ${value}. Expected format is YYYY-MM-DD.`,
                    flags: MessageFlags.Ephemeral,
                });
                return;
            }
            formattedDates.push(parsed.format("dddd, D MMM YYYY"));
        }

        for (const value of rawTimes) {
            const parsed = dayjs(value, "HH:mm", true);
            if (!parsed.isValid()) {
                await interaction.reply({
                    content: `Invalid time: ${value}. Expected format is HH:mm.`,
                    flags: MessageFlags.Ephemeral,
                });
                return;
            }
        }

        await interaction.reply({
            embeds: [
                new EmbedBuilder()
                    .setTitle(title)
                    .setDescription(
                        `${interaction.user} is organizing a new tournament. Vote in the polls below.`
                    )
                    .setColor(0xffd700),
            ],
        });

        await interaction.channel.send({
            poll: {
                question: { text: "Do you want to participate in the tournament?" },
                answers: [
                    { text: "Yes, I want to participate", emoji: "✔️" },
                    { text: "No", emoji: "✖️" },
                ],
                allowMultiselect: false,
                duration,
                layoutType: PollLayoutType.Default,
            },
        });

        await interaction.channel.send({
            poll: {
                question: { text: "Which dates work for you?" },
                answers: formattedDates.map((date) => ({ text: date })),
                allowMultiselect: true,
                duration,
                layoutType: PollLayoutType.Default,
            },
        });

        await interaction.channel.send({
            poll: {
                question: { text: "When should the tournament start?" },
                answers: rawTimes.map((time) => ({ text: time })),
                allowMultiselect: true,
                duration,
                layoutType: PollLayoutType.Default,
            },
        });
    },
};