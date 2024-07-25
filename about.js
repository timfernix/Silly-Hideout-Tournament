const {EmbedBuilder, SlashCommandBuilder} = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('about')
    .setDescription('Shows info about the bot'),

    async execute(interaction){
      const embed = new EmbedBuilder()
      .setTitle('About this bot')
      .setDescription(`**Author:** <:timfernix:1265389408585257115><@589773984447463434>\n **Language:** *<:nodejs:1265389410795388938> NodeJS / <:discordjs:1265389413626806393> discord.js* \n\n Originally created for the [Silly Hideout Discord Server](https://discord.gg/zPqcY2TDUm), i tried creating some neat features which are available for everyone with this Bot. \n\nFeel free to visit my GitHub: [GitHub: timfernix](https://github.com/timfernix)`)
      .setColor(0xFFEA00)
         
      return interaction.reply({embeds: [embed]});
    },
};