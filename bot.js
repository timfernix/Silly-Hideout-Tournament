require("dotenv").config();
const fs = require("node:fs");
const path = require("node:path");
const {TOKEN} = process.env;
const {GatewayIntentBits,Client,Events,Collection,AttachmentBuilder,EmbedBuilder, ActivityType} = require("discord.js");
const champions = require("./data/champions.json");

const client = new Client({
    intents: [
      GatewayIntentBits.Guilds,
      GatewayIntentBits.GuildMembers,
      GatewayIntentBits.GuildEmojisAndStickers,
      GatewayIntentBits.GuildMessages,
      GatewayIntentBits.MessageContent,
    ],
  });

  client.commands = new Collection();

const commandsPath = path.join(__dirname, "commands");
const commandFiles = fs
  .readdirSync(commandsPath)
  .filter((file) => file.endsWith(".js"));

for (const file of commandFiles) {
  const filePath = path.join(commandsPath, file);
  const command = require(filePath);
  if ("data" in command && "execute" in command) {
    client.commands.set(command.data.name, command);
  } else {
    console.log(
      `[WARNING] The command at ${filePath} is missing a required "data" of "execute" property.`
    );
  }
}

client.on(Events.InteractionCreate, async (interaction) => {
    if (!interaction.isChatInputCommand()) return;
  
    const command = client.commands.get(interaction.commandName);
  
    if (!command) {
      console.error(`No command matching ${interaction.commandName} was found`);
      return;
    }
  
    try {
      await command.execute(interaction);
    } catch (error) {
      console.log(error);
      await interaction.reply({
        content: "There was an error while executing this command",
        ephemeral: true,
      });
    }
  
    console.log(interaction);
  });

client.once(Events.ClientReady, (c) => {
    console.log(`Ready! Logged in as ${c.user.tag}`);

    client.user.setActivity({
      name: "with your fates",
      type: ActivityType.Playing,
    })
});

//AUTOCOMPLETE FOR TEAMOVERVIEW
client.on(Events.InteractionCreate, async (interaction) => {
  if(!interaction.isAutocomplete()) return;
  if(interaction.commandName !=="teamoverview") return;

  const focussedOption = interaction.options.getFocused(true);

 if(focussedOption.name.startsWith("champion")){
    const filteredChoices = champions.filter((champion) =>
      champion.name.toLowerCase().startsWith(focussedOption.value.toLowerCase())
      );
  
      const results = filteredChoices.map((choice) => {
        return {
          name: `${choice.name}`,
          value: choice.id,
          }
      });
  
      interaction.respond(results.slice(0, 25)).catch(() => {});
  }

});

client.login(TOKEN);
