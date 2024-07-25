const { timeStamp } = require("console");
const { SlashCommandBuilder, EmbedBuilder, time, Guild } = require("discord.js");
const { champions } = require("../data/champions");
const data = require("../data/champions").champions;
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
        const reducedChampions = [];
        const CRole = [];
        const PickedRole = interaction.options.getString("role");
        CRole.push(PickedRole);

        if(interaction.guildId === GUILD_ID){
        //--------------------------------------------------------------------------------------
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
        
        const percentage = Math.round((1/reducedChampions.length) * 100)
        const picks = Math.round(randomChampion.wins + randomChampion.losses)

        let winrate = Math.round((randomChampion.wins / picks) * 100)
        if(!winrate){
            winrate = 0
        }
        
        const embed = new EmbedBuilder()
        .setTitle(`${randomChampion.name} - ${randomChampion.title}`)
        .setURL(`https://u.gg/lol/champions/${randomChampion.name}`)
        .setDescription(`You rolled **${randomChampion.name}** for **${PickedRole}** with a chance of **~${percentage}%**! \n\n **${randomChampion.name}** has been rolled **${picks} time(s)** before (in a tournament) \n and won **${randomChampion.wins} game(s)** of those played. (**Winrate: ${winrate}%**)`)
        .setColor(0x0099FF)
        .setTimestamp()
        .setFooter({text: "Generated: "})
        //.setThumbnail(`${randomChampion.icon}`);
        .setImage(`${randomChampion.splash}`);

        return interaction.reply({ embeds: [embed] });
    }else {
        const randomChampion = data[Math.floor(Math.random() * data.length)];

        const percentage = Math.floor((1/data.length) * 100)
        const picks = Math.round(randomChampion.wins + randomChampion.losses)

        let winrate = Math.round((randomChampion.wins / picks) * 100)
        if(!winrate){
            winrate = 0
        }

        const embed = new EmbedBuilder()
        .setTitle(`${randomChampion.name} - ${randomChampion.title}`)
        .setURL(`https://u.gg/lol/champions/${randomChampion.name}`)
        .setDescription(`You rolled **${randomChampion.name}** for **${PickedRole}** with a chance of **~${percentage}%**! \n\n **${randomChampion.name}** has been rolled **${picks} time(s)** before (in a tournament) \n and won **${randomChampion.wins} game(s)** of those played. (**Winrate: ${winrate}%**)`)
        .setColor(0x0099FF)
        .setTimestamp()
        .setFooter({text: "Generated: "})
        //.setThumbnail(`${randomChampion.icon}`);
        .setImage(`${randomChampion.splash}`);

        return interaction.reply({ embeds: [embed] });
        }
        //--------------------------------------------------------------------------------------
    }
    else if(interaction.guildId != GUILD_ID) {
                //--------------------------------------------------------------------------------------

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
                
                const percentage = Math.round((1/reducedChampions.length) * 100)
                const picks = Math.round(randomChampion.wins + randomChampion.losses)
        
                let winrate = Math.round((randomChampion.wins / picks) * 100)
                if(!winrate){
                    winrate = 0
                }
                
                const embed = new EmbedBuilder()
                .setTitle(`${randomChampion.name} - ${randomChampion.title}`)
                .setURL(`https://u.gg/lol/champions/${randomChampion.name}`)
                .setDescription(`You rolled **${randomChampion.name}** for **${PickedRole}** with a chance of **~${percentage}%**!`)
                .setColor(0x0099FF)
                .setTimestamp()
                .setFooter({text: "Generated: "})
                //.setThumbnail(`${randomChampion.icon}`);
                .setImage(`${randomChampion.splash}`);
        
                return interaction.reply({ embeds: [embed] });
            }else {
                const randomChampion = data[Math.floor(Math.random() * data.length)];
        
                const percentage = Math.floor((1/data.length) * 100)
                const picks = Math.round(randomChampion.wins + randomChampion.losses)
        
                let winrate = Math.round((randomChampion.wins / picks) * 100)
                if(!winrate){
                    winrate = 0
                }
        
                const embed = new EmbedBuilder()
                .setTitle(`${randomChampion.name} - ${randomChampion.title}`)
                .setURL(`https://u.gg/lol/champions/${randomChampion.name}`)
                .setDescription(`You rolled **${randomChampion.name}** for **${PickedRole}** with a chance of **~${percentage}%**!`)
                .setColor(0x0099FF)
                .setTimestamp()
                .setFooter({text: "Generated: "})
                //.setThumbnail(`${randomChampion.icon}`);
                .setImage(`${randomChampion.splash}`);
        
                return interaction.reply({ embeds: [embed] });
                }
                //--------------------------------------------------------------------------------------
    }
    }
}