const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const data = require("../data/champions.js").champions;
const { GUILD_ID } = process.env;

module.exports = {
    data: new SlashCommandBuilder()
    .setName("random")
    .setDescription("Returns a random champion for a selected role")
    .addStringOption(option =>
        option.setName("role")
            .setDescription("The lane to be played")
            .setRequired(true)
            .addChoices(
                {name: "Top", value: "Top"},
                {name: "Jungle", value: "Jungle"},
                {name: "Mid", value: "Mid"},
                {name: "Adc", value: "Adc"},
                {name: "Support", value: "Support"},
                {name: "All", value: "All"},
            )
    ),

    async execute(interaction){
        const PickedRole = interaction.options.getString("role");
        const reducedChampions = [];
        const CRole = [];
        CRole.push(PickedRole);

    if(CRole.length) {
            for(let role of CRole) {  
                data.reduce((champions, cur, index) => {
                    if(cur.role.includes(role)) {
                        if(!reducedChampions.includes(cur)) {
                         reducedChampions.push(cur);
                    }
                }
            });
        }

        const randomChampion =
        reducedChampions[Math.floor(Math.random() * reducedChampions.length)];
        const percentage = ((1/reducedChampions.length) * 100).toFixed(2)
        const picks = Math.round(randomChampion.wins + randomChampion.losses)

        let winrate = Math.round((randomChampion.wins / picks) * 100)
        if(!winrate){
            winrate = 0
        }

        if(interaction.guildId === GUILD_ID){
            const championImage = "https://ddragon.leagueoflegends.com/cdn/img/champion/splash/"+randomChampion.smoothName+"_0.jpg";
            const embedDescription = `You rolled **${randomChampion.name}** for **${PickedRole}** with a chance of **~${percentage}%**! \n\n **${randomChampion.name}** has been rolled **${picks} time(s)** before (in a tournament) \n and won **${randomChampion.wins} game(s)** of those played. (**Winrate: ${winrate}%**)`
            const embed = new EmbedBuilder()
            .setTitle(`${randomChampion.name} - ${randomChampion.title}`)
            .setURL(`https://u.gg/lol/champions/${randomChampion.smoothName}`)
            .setDescription(`${embedDescription}`)
            .setColor(0x0099FF)
            .setTimestamp()
            .setFooter({text: "Generated: "})
            .setImage(`${championImage}`);

            return interaction.reply({ embeds: [embed] });
    }
         else if(interaction.guildId != GUILD_ID){
            const championImage = "https://ddragon.leagueoflegends.com/cdn/img/champion/splash/"+randomChampion.smoothName+"_0.jpg";
            const embedDescription = `You rolled **${randomChampion.name}** for **${PickedRole}** with a chance of **~${percentage}%**!`
            const embed = new EmbedBuilder()
            .setTitle(`${randomChampion.name} - ${randomChampion.title}`)
            .setURL(`https://u.gg/lol/champions/${randomChampion.smoothName}`)
            .setDescription(`${embedDescription}`)
            .setColor(0x0099FF)
            .setTimestamp()
            .setFooter({text: "Generated: "})
            .setImage(`${championImage}`);

            return interaction.reply({ embeds: [embed] });
    }
    else {
        const randomChampion = data[Math.floor(Math.random() * data.length)];

        const percentage = Math.floor((1/data.length) * 100)
        const picks = Math.round(randomChampion.wins + randomChampion.losses)

        let winrate = Math.round((randomChampion.wins / picks) * 100)
        if(!winrate){
            winrate = 0
        }
    }
        if(interaction.guildId === GUILD_ID){
            const championImage = "https://ddragon.leagueoflegends.com/cdn/img/champion/splash/"+randomChampion.smoothName+"_0.jpg";
            const embedDescription = `You rolled **${randomChampion.name}** for **${PickedRole}** with a chance of **~${percentage}%**! \n\n **${randomChampion.name}** has been rolled **${picks} time(s)** before (in a tournament) \n and won **${randomChampion.wins} game(s)** of those played. (**Winrate: ${winrate}%**)`
            const embed = new EmbedBuilder()
            .setTitle(`${randomChampion.name} - ${randomChampion.title}`)
            .setURL(`https://u.gg/lol/champions/${randomChampion.smoothName}`)
            .setDescription(`${embedDescription}`)
            .setColor(0x0099FF)
            .setTimestamp()
            .setFooter({text: "Generated: "})
            .setImage(`${championImage}`);

            return interaction.reply({ embeds: [embed] });

        };
    }
         else if(interaction.guildId != GUILD_ID){
            const championImage = "https://ddragon.leagueoflegends.com/cdn/img/champion/splash/"+randomChampion.smoothName+"_0.jpg";
            const embedDescription = `You rolled **${randomChampion.name}** for **${PickedRole}** with a chance of **~${percentage}%**!`
            const embed = new EmbedBuilder()
            .setTitle(`${randomChampion.name} - ${randomChampion.title}`)
            .setURL(`https://u.gg/lol/champions/${randomChampion.smoothName}`)
            .setDescription(`${embedDescription}`)
            .setColor(0x0099FF)
            .setTimestamp()
            .setFooter({text: "Generated: "})
            .setImage(`${championImage}`);

            return interaction.reply({ embeds: [embed] });
        };
}}
