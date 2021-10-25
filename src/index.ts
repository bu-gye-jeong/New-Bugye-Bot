import { PrismaClient } from ".prisma/client";
import { SlashCommandBuilder } from "@discordjs/builders";
import { REST } from "@discordjs/rest";
import { Routes } from "discord-api-types/v9";
import {
  ApplicationCommand,
  Client,
  Collection,
  CommandInteraction,
  Intents,
  Interaction,
} from "discord.js";
import fs from "fs";
import path from "path";
import { clientId, guildId } from "../config.json";

export interface ICommand {
  data: SlashCommandBuilder;
  execute(interaction: CommandInteraction): any;
}
export interface IEvent {
  name: string;
  listener(interaction: Interaction): any;
}

const token = process.env.DISCORD_TOKEN!;
const dev = process.env.NODE_ENV === "dev";

const rest = new REST({ version: "9" }).setToken(token);

export const client = new Client({ intents: [Intents.FLAGS.GUILDS] });
export const prisma = new PrismaClient();

export let commands: ApplicationCommand[];
const commandDatas = new Collection<string, ICommand>();
const commandFiles = fs
  .readdirSync(path.join(__dirname, "/commands"))
  .filter((file) => file.endsWith(dev ? "ts" : "js"));
const eventFiles = fs
  .readdirSync(path.join(__dirname, "/events"))
  .filter((file) => file.endsWith(dev ? "ts" : "js"));

for (const file of commandFiles) {
  const command: ICommand = require(`./commands/${file}`).default;
  commandDatas.set(command.data.toJSON().name, command);
}
for (const file of eventFiles) {
  const event: IEvent = require(`./events/${file}`).default;
  client.on(event.name, event.listener);
}

client.once("ready", () => {
  console.log("Ready!");
});

client.on("interactionCreate", async (interaction) => {
  if (!interaction.isCommand()) return;
  const command = commandDatas.get(interaction.commandName);

  if (!command) return;

  try {
    await command.execute(interaction);
  } catch (error) {
    console.error(error);
    await interaction.reply({
      content: "명령어를 실행하는 동안 에러가 발생했습니다!",
      ephemeral: true,
    });
  }
});

(async () => {
  try {
    console.log("Started refreshing application (/) commands.");

    commands = (await rest.put(
      dev
        ? Routes.applicationGuildCommands(clientId, guildId)
        : Routes.applicationCommands(clientId),
      {
        body: commandDatas.toJSON().map((command) => command.data.toJSON()),
      }
    )) as ApplicationCommand[];

    console.log("Successfully reloaded application (/) commands.");
  } catch (error) {
    console.error(error);
  }

  client.login(token);
})();
