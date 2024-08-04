const { SlashCommandBuilder } = require("discord.js");
const dayjs = require("dayjs");
const utc = require('dayjs/plugin/utc');
const timezone = require('dayjs/plugin/timezone');

dayjs.extend(utc);
dayjs.extend(timezone);

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
        .setDescription("Enter the time hh:mm")
        .setRequired(true)
    )
    .addStringOption(option =>
        option.setName("your-timezone")
          .setDescription("Choose YOUR timezone")
          .setRequired(true)
          .addChoices(
            { name: "UTC", value: "UTC" },
            { name: "GMT | London | UTC+0", value: "Europe/London" },
            { name: "CET | Berlin | UTC+1", value: "Europe/Berlin" },
            { name: "CET | Paris | UTC+1", value: "Europe/Paris" },
            { name: "SAST | Johannesburg | UTC+2", value: "Africa/Johannesburg" },
            { name: "MSK | Moscow | UTC+3", value: "Europe/Moscow" },
            { name: "TRT | Istanbul | UTC+3", value: "Europe/Istanbul" },
            { name: "EET | Cairo | UTC+3", value: "Africa/Cairo" },
            { name: "IST | Mumbai | UTC+5:30", value: "Asia/Kolkata" },
            { name: "ICT | Bangkok | UTC+7", value: "Asia/Bangkok" },
            { name: "HKT | Hong Kong UTC+8", value: "Asia/Hong_Kong" },
            { name: "CST* | Beijing | UTC+8", value: "Asia/Shanghai" },
            { name: "KST | Seoul | UTC+9", value: "Asia/Seoul" },
            { name: "JST | Tokyo | UTC+9", value: "Asia/Tokyo" },
            { name: "AEST | Sydney | UTC+10", value: "Australia/Sydney" },
            { name: "PST | Los Angeles | UTC-7", value: "America/Los_Angeles" },
            { name: "MST | Denver | UTC-6", value: "America/Denver" },
            { name: "CST | Chicago | UTC-5", value: "America/Chicago" },
            { name: "CDT | Mexico City | UTC-5", value: "America/Mexico_City" },
            { name: "EST | New York | UTC-4", value: "America/New_York" },
            { name: "BRT | Sao Paulo | UTC-3", value: "America/Sao_Paulo" },
          )
      )
    .addStringOption(option =>
      option.setName("format")
        .setDescription("Choose one of the formats")
        .setRequired(true)
        .addChoices(
          { name: "Relative (R)", value: "R" },
          { name: "Short time (t)", value: "t" },
          { name: "Long time (T)", value: "T" },
          { name: "Short date (d)", value: "d" },
          { name: "Long date (D)", value: "D" },
          { name: "Long date + short time (f)", value: "f" },
          { name: "dayname + long date + short time (F)", value: "F" },
        )
    ),

  async execute(interaction) {
    const dateString = interaction.options.getString('date');
    const timeString = interaction.options.getString('time');
    const format = interaction.options.getString('format');
    const timezone = interaction.options.getString('your-timezone');

    const date = dayjs.tz(`${dateString} ${timeString}`, 'YYYY-MM-DD HH:mm', timezone);
    const timestamp = date.unix();

    const discordTimestamp = `<t:${timestamp}:${format}>`;

    await interaction.reply(discordTimestamp);
  },
};
