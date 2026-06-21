import { EmbedBuilder, MessageFlags, SlashCommandBuilder } from "discord.js";
import { loadChampions } from "../data/champion-store.js";

const { GUILD_ID } = process.env;

const roleChoices = ["Top", "Jungle", "Mid", "Adc", "Support", "All"];

export default {
    data: new SlashCommandBuilder()
        .setName("random")
        .setDescription("Random selection")
        .addSubcommand((subcommand) =>
            subcommand
                .setName("champion")
                .setDescription("Pick a random champion for a role")
                .addStringOption((option) =>
                    option
                        .setName("role")
                        .setDescription("Requested role")
                        .setRequired(true)
                        .addChoices(...roleChoices.map((role) => ({ name: role, value: role })))
                )
        ),

    async execute(interaction) {
        const role = interaction.options.getString("role", true);
        const champions = await loadChampions();

        if (!champions.length) {
            await interaction.reply({
                content:
                    "No valid champion data found. Fill data/champions.json or run champion sync.",
                flags: MessageFlags.Ephemeral,
            });
            return;
        }

        const pool =
            role === "All"
                ? champions
                : champions.filter((champion) =>
                        champion.role.some((entry) => entry.toLowerCase() === role.toLowerCase())
                    );

        if (!pool.length) {
            await interaction.reply({
                content: `No champions found for role ${role}.`,
                flags: MessageFlags.Ephemeral,
            });
            return;
        }

        const selected = pool[Math.floor(Math.random() * pool.length)];
        const chance = ((1 / pool.length) * 100).toFixed(2);
        const championImage =
            selected.splashUrl ||
            `https://ddragon.leagueoflegends.com/cdn/img/champion/splash/${selected.smoothName}_0.jpg`;

        const details = [
            `You rolled **${selected.name}** for **${role}**.`,
            `Chance: **~${chance}%**`,
        ];

        if (
            interaction.guildId === GUILD_ID &&
            Number.isFinite(selected.wins) &&
            Number.isFinite(selected.losses)
        ) {
            const picks = selected.wins + selected.losses;
            const winrate = picks > 0 ? Math.round((selected.wins / picks) * 100) : 0;
            details.push(
                `Tournament stats: **${picks} picks**, **${selected.wins} wins**, **${winrate}% winrate**`
            );
        }

        const embed = new EmbedBuilder()
            .setTitle(
                `${selected.emoji ? `${selected.emoji} ` : ""}${selected.name} - ${selected.title ?? ""}`.trim()
            )
            .setURL(`https://u.gg/lol/champions/${selected.smoothName}/build`)
            .setDescription(details.join("\n\n"))
            .setColor(0x0099ff)
            .setThumbnail(selected.iconUrl || null)
            .setImage(championImage)
            .setTimestamp();

        await interaction.reply({ embeds: [embed] });
    },
};
