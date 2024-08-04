const { ActionRowBuilder, ModalBuilder, TextInputBuilder, TextInputStyle, EmbedBuilder, SlashCommandBuilder } = require('discord.js');
const { FEEDBACK_CHANNEL } = process.env;

module.exports = {
    data: new SlashCommandBuilder()
    .setName("feedback")
    .setDescription("Lets you give feedback"),

    async execute (interaction){

        const modal = new ModalBuilder({
            customId: 'modal',
            title: 'Submit feedback'
        })
      
        const feedbackText = new TextInputBuilder({
            customId: 'feedback',
            label: 'Your feedback',
            style: TextInputStyle.Paragraph
        })

        const firstActionRow = new ActionRowBuilder().addComponents(feedbackText);
        modal.addComponents(firstActionRow);

        await interaction.showModal(modal);

        const filter = (interaction) => interaction.customId === 'modal';

        interaction
        .awaitModalSubmit({ filter, time: 60_000 })
        .then((modalInteraction) => {
            const feedback = modalInteraction.fields.getTextInputValue('feedback')

            const channel = interaction.guild.channels.cache.get(FEEDBACK_CHANNEL);
            const embed = new EmbedBuilder()
                .setTitle('New Feedback')
                .setDescription(feedback)
                .setAuthor({ name: interaction.user.username, iconURL: interaction.user.displayAvatarURL() })

            channel.send({ embeds: [embed] })
            modalInteraction.reply({content: "Feedback sent!", ephemeral: true});
        })
        .catch((err) => {
            console.log(`Error: ${err}`);
        })
    },
}