const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");

module.exports = {
    data: new SlashCommandBuilder()
    .setName("teambuilder")
    .setDescription("Shuffles players into random teams")
    .addIntegerOption(option =>
        option
        .setName("teamsize") 
        .setDescription("size of the teams")
        .setRequired(true)
        .setMinValue(2)
        .setMaxValue(20)
    )
    .addStringOption(option =>
        option
        .setName("playernames")
        .setDescription("List playernames seperated by commas without spaces")
        .setRequired(true)
        //.setMaxLength()
    ),

    async execute (interaction){
        const players = interaction.options.getString("playernames");
        const amount = interaction.options.getInteger("teamsize");
        const playernames = [];
        const seperator = ",";

        for(const element of players.split(seperator)) {
            playernames.push(element)
          }

          //edit playernames
          function randomizeArray(array){
            for (let i = array.length - 1; i > 0; i--) {
              const j = Math.floor(Math.random() * (i + 1));
              [array[i], array[j]] = [array[j], array[i]];
          }
          return array;
          }

          //splitting players
          function splitIntoTeams(playerArray, teamSize){
            const mixedUpPlayers = randomizeArray(playerArray.slice());
            const teams = [];

            while(mixedUpPlayers.length){
              teams.push(mixedUpPlayers.splice(0, teamSize));
            }
            return teams;
          }

          //settings for teams
          const teamSize = amount; //usually 5
          const teams = splitIntoTeams(playernames, teamSize)

          //generate embedDescription
          let embedDescription = "";
          teams.forEach((team, index) => {
            embedDescription += `**Team ${index + 1}:** ${team.join(", ")}\n`;
          });

          //create embed
          const embed = new EmbedBuilder()
          .setTitle("Team line-up")
          .setDescription(`${embedDescription}`)
          .setTimestamp()
          .setFooter({text: "Generated: "})
          .setImage("https://i.ibb.co/yVyw12b/LOL-CMS-217-Article-01-9xkwa793w86kqwa9lu0y.jpg")

        return interaction.reply({ embeds: [embed] });
    }

}