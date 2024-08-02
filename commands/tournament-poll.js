const {EmbedBuilder, SlashCommandBuilder, PollLayoutType, PermissionFlagsBits } = require("discord.js");
const { GUILD_ID } = process.env;
const dayjs = require("dayjs");
var advancedFormat = require("dayjs/plugin/advancedFormat");
dayjs.extend(advancedFormat);

module.exports = {
    data: new SlashCommandBuilder()
        .setName("tournament-poll")
        .setDescription("Lets you create polls for a tournament")
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
        .addStringOption(option =>
            option
                .setName("title")
                .setDescription("Title of the tournament")
                .setRequired(true)
        )
        .addIntegerOption(option =>
            option
            .setName("duration")
            .setDescription("Duration of the poll in hours - 1 week = 168h")
            .setRequired(true)
        )
        .addStringOption(option =>
            option
                .setName("dates")
                .setDescription("Suggested dates, YYYY-MM-DD,YYYY-MM-DD,...")
                .setRequired(true)
        )
        .addStringOption(option =>
            option
                .setName("times")
                .setDescription("Suggested starting times, HH:MM,HH:MM,...")
                .setRequired(true)
        ),


        async execute(interaction){
            const title = interaction.options.getString("title");
            const duration = interaction.options.getInteger("duration");
            const dates = interaction.options.getString("dates");
            const times = interaction.options.getString("times");
            const alldates = [];
            const alltimes = [];
            const seperator = ",";
    
            for(const element of dates.split(seperator)) {
                alldates.push(element)
              }
            for(const element of times.split(seperator)) {
                alltimes.push(element)
              }

            function formatDates(dates) {
                return dates.map(dateString => {
                    const parsedDate = dayjs(dateString, "DD.MM.YYYY");
                    return parsedDate.isValid() ? parsedDate.format('Do MMMM YYYY') : 'Error while parsing date';
                });
            }

            if (alldates.length < 2 || alltimes.length < 2) {
                const ERembed = new EmbedBuilder()
                  .setDescription('Not enough elements! You need at least 2 dates and/or times to choose from.');
                interaction.reply({ embeds: [ERembed], ephemeral: true });
                return;
              }

            const formattedDates = formatDates(alldates);
            const pollOptionsDate = formattedDates.map(date => ({ text: date }));
            const pollOptionsTime = alltimes.map(time => ({ text: time }));

            //internal
            if(interaction.guildId === GUILD_ID) {
            const embed = new EmbedBuilder()
                .setTitle(title)
                .setDescription(`${interaction.user} is organizing a new **Silly Hideout tournament**! Don't miss out and make sure to vote in the polls below to participate and help setting date and time for the tournament!`)
                .setThumbnail('attachment://server_icon.jpg')

            await interaction.reply({ embeds: [embed], files: ['./commands/img/server_icon.jpg'] })
        } //external
            else if(interaction.guildId !== GUILD_ID) {
            const embed = new EmbedBuilder()
                .setTitle(title)
                .setDescription(`${interaction.user} is organizing a new tournament! Don't miss out and make sure to vote in the polls below to participate and help setting date and time for the tournament!`)
                .setThumbnail('attachment://tournament.png')

            await interaction.reply({ embeds: [embed], files: ['./commands/img/tournament.png'] })
        }

            await interaction.channel.send({
                poll: {
                    question: { text: "Would you want to take part in the tournament?"},
                    answers: [
                        {text: "Yes, i want to participate", emoji: "✔️"},
                        //{text: "Unsure, i cant tell yet", emoji: "🟰"},
                        {text: "No, i dont have time/dont want to", emoji: "✖️"},
                    ],
                    allowMultiselect: false,
                    duration: duration,
                    layoutType: PollLayoutType.Default,
                }
            })
            await interaction.channel.send({
                poll: {
                    question: { text: "Which of the suggested dates would you have time to play?"},
                    answers: pollOptionsDate,
                    allowMultiselect: true,
                    duration: duration,
                    layoutType: PollLayoutType.Default,
                }
            })
            await interaction.channel.send({
                poll: {
                    question: { text: "When should the tournament start?"},
                    answers: pollOptionsTime,
                    allowMultiselect: true,
                    duration: duration,
                    layoutType: PollLayoutType.Default,
                }
            })
            }

}