const { SlashCommandBuilder, EmbedBuilder, Embed } = require("discord.js");
const champions = require("../data/champions.json");
const { GUILD_ID } = process.env;

module.exports = {
    data: new SlashCommandBuilder()
    .setName("teamoverview")
    .setDescription("Creates an overview for a match of 2 teams")
    .addStringOption(option =>
        option
        .setName("title")
        .setDescription("Title of the Embed - Matchname")
        .setRequired(true)
    )
    .addStringOption(option =>
        option
        .setName("player1") 
        .setDescription("Choose the toplaner for team 1")
        .setRequired(true)
    )
    .addStringOption(option =>
        option
        .setName("champion1") 
        .setDescription("Choose champion - Top/Team 1")
        .setRequired(true)
        .setAutocomplete(true)
    )
    .addStringOption(option =>
        option
        .setName("player2") 
        .setDescription("Choose the jungler for team 1")
        .setRequired(true)
    )
    .addStringOption(option =>
        option
        .setName("champion2") 
        .setDescription("Choose champion - Jng/Team 1")
        .setRequired(true)
        .setAutocomplete(true)
    )
    .addStringOption(option =>
        option
        .setName("player3") 
        .setDescription("Choose the midlaner for team 1")
        .setRequired(true)
    )
    .addStringOption(option =>
        option
        .setName("champion3") 
        .setDescription("Choose champion - Mid/Team 1")
        .setRequired(true)
        .setAutocomplete(true)
    )
    .addStringOption(option =>
        option
        .setName("player4") 
        .setDescription("Choose the adcarry for team 1")
        .setRequired(true)
    )
    .addStringOption(option =>
        option
        .setName("champion4") 
        .setDescription("Choose champion - Adc/Team 1")
        .setRequired(true)
        .setAutocomplete(true)
    )
    .addStringOption(option =>
        option
        .setName("player5") 
        .setDescription("Choose the supporter for team 1")
        .setRequired(true)
    )
    .addStringOption(option =>
        option
        .setName("champion5") 
        .setDescription("Choose champion - Sup/Team 1")
        .setRequired(true)
        .setAutocomplete(true)
    )
    .addStringOption(option =>
        option
        .setName("player6") 
        .setDescription("Choose the toplaner for team 2")
        .setRequired(true)
    )
    .addStringOption(option =>
        option
        .setName("champion6") 
        .setDescription("Choose champion - Top/Team 2")
        .setRequired(true)
        .setAutocomplete(true)
    )
    .addStringOption(option =>
        option
        .setName("player7") 
        .setDescription("Choose the jungler for team 2")
        .setRequired(true)
    )
    .addStringOption(option =>
        option
        .setName("champion7") 
        .setDescription("Choose champion - Jng/Team 2")
        .setRequired(true)
        .setAutocomplete(true)
    )
    .addStringOption(option =>
        option
        .setName("player8") 
        .setDescription("Choose the midlaner for team 2")
        .setRequired(true)
    )
    .addStringOption(option =>
        option
        .setName("champion8") 
        .setDescription("Choose champion - Mid/Team 2")
        .setRequired(true)
        .setAutocomplete(true)
    )
    .addStringOption(option =>
        option
        .setName("player9") 
        .setDescription("Choose the adcarry for team 2")
        .setRequired(true)
    )
    .addStringOption(option =>
        option
        .setName("champion9") 
        .setDescription("Choose champion - Adc/Team 2")
        .setRequired(true)
        .setAutocomplete(true)
    )
    .addStringOption(option =>
        option
        .setName("player10") 
        .setDescription("Choose the toplaner for team 2")
        .setRequired(true)
    )
    .addStringOption(option =>
        option
        .setName("champion10") 
        .setDescription("Choose champion - Sup/Team 2")
        .setRequired(true)
        .setAutocomplete(true)
    ),

    async execute (interaction){
        
        const title = interaction.options.getString("title");

        const player1 = interaction.options.getString("player1");
        const player2 = interaction.options.getString("player2");
        const player3 = interaction.options.getString("player3");
        const player4 = interaction.options.getString("player4");
        const player5 = interaction.options.getString("player5");
        const player6 = interaction.options.getString("player6");
        const player7 = interaction.options.getString("player7");
        const player8 = interaction.options.getString("player8");
        const player9 = interaction.options.getString("player9");
        const player10 = interaction.options.getString("player10");

        const champion1Id = interaction.options.getString("champion1");
        const champion1 = champions.find((c) => c.id === champion1Id);
        const champion2Id = interaction.options.getString("champion2");
        const champion2 = champions.find((c) => c.id === champion2Id);
        const champion3Id = interaction.options.getString("champion3");
        const champion3 = champions.find((c) => c.id === champion3Id);
        const champion4Id = interaction.options.getString("champion4");
        const champion4 = champions.find((c) => c.id === champion4Id);
        const champion5Id = interaction.options.getString("champion5");
        const champion5 = champions.find((c) => c.id === champion5Id);
        const champion6Id = interaction.options.getString("champion6");
        const champion6 = champions.find((c) => c.id === champion6Id);
        const champion7Id = interaction.options.getString("champion7");
        const champion7 = champions.find((c) => c.id === champion7Id);
        const champion8Id = interaction.options.getString("champion8");
        const champion8 = champions.find((c) => c.id === champion8Id);
        const champion9Id = interaction.options.getString("champion9");
        const champion9 = champions.find((c) => c.id === champion9Id);
        const champion10Id = interaction.options.getString("champion10");
        const champion10 = champions.find((c) => c.id === champion10Id);

        const embed = new EmbedBuilder()
          .setTitle(`${title}`)
          .setDescription(`The following lineup is to be played: \n ‎ `)
          .setTimestamp()
          .setColor(0xffd700)
          .setFooter({text: "Generated: "})
          .setImage('attachment://team2.jpg')
          .addFields(
            {name: ':blue_square: Blue Side:\n ‎', value: `<:Toplane:1118618877555916891> ${champion1.emoji} - ${player1} \n <:Jungle:1118618872543715420> ${champion2.emoji} - ${player2} \n <:Midlane:1118618874833797310> ${champion3.emoji} - ${player3} \n <:Botlane:1118618867627991151> ${champion4.emoji} - ${player4} \n <:Support:1118618876226314310> ${champion5.emoji} - ${player5} `, inline: true},
            {name: ':red_square: Red Side:\n ‎', value: `<:Toplane:1118618877555916891> ${champion6.emoji} - ${player6} \n <:Jungle:1118618872543715420> ${champion7.emoji} - ${player7} \n <:Midlane:1118618874833797310> ${champion8.emoji} - ${player8} \n <:Botlane:1118618867627991151> ${champion9.emoji} - ${player9} \n <:Support:1118618876226314310> ${champion10.emoji} - ${player10} `, inline: true}
          )

          return interaction.reply({ embeds: [embed], files: ['./commands/img/team2.jpg'] })
    }
  }