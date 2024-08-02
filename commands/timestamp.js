const { SlashCommandBuilder} = require("discord.js");
const dayjs = require("dayjs")

module.exports = {
    data: new SlashCommandBuilder()
    .setName("timestamp")
    .setDescription("Converts a date to a timestamp")
    .addStringOption(option =>
        option.setName("date")
            .setDescription("Enter the date yyyy-mm-dd")
            .setRequired(true)   
    )
    .addStringOption(option =>
        option.setName("time")
            .setDescription("Enter the date hh:mm")
            .setRequired(true)   
    )
    .addStringOption(option =>
        option.setName("format")
            .setDescription("Choose one of the formats")
            .setRequired(true)
            .addChoices(
                {name: "Relative (R)", value: "R"},
                {name: "Short time (t)", value: "t"},
                {name: "Long time (T)", value: "T"},
                {name: "Short date (d)", value: "d"},
                {name: "Long date (D)", value: "D"},
                {name: "Long date + short time (f)", value: "f"},
                {name: "dayname + long date + short time (F)", value: "F"},
            ),
        ),

    async execute(interaction){
        const dateString = interaction.options.getString('date');
        const timeString = interaction.options.getString('time');
        const format = interaction.options.getString('format')

        const date = dayjs(`${dateString} ${timeString}`, 'YYYY-MM-DD HH:mm:ss');
        const unixTime = date.unix();

        const timestamp = `<t:${unixTime}:${format}>`;
        interaction.reply({content: `${timestamp}`, ephemeral: false})
    }
}