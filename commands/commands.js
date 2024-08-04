const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("commands")
        .setDescription("Lists all commands available on the bot"),

        async execute (interaction){

            const embed = new EmbedBuilder()
            .setTitle("Command list")
            .setDescription("**General Commands:** \n </about:1265395471430713435> Shows info about the bot \n </commands:1268642842234851430> Shows this list \n</random:1264956087606448190> Returns a random champion for a selected role \n </teambuilder:1265396931417473106> Shuffles players into random teams with given size\n </timestamp:1268988698834374758> Converts a date into a discord timestamp\n\n**Administrative commands** \n </tournament-poll:1268295381700313221> Lets you create polls for a tournament \n </teamoverview:1267157739013013534> Creates an overview for a match of 2 teams \n </setwinner:1268295381700313220> Edits the matchembed to add the winning team")
            .setColor(0xFFEA00) 

            return interaction.reply({embeds: [embed]});
        },

}