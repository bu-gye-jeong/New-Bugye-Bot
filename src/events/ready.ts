import {
  ApplicationCommandPermissionData,
  GuildApplicationCommandPermissionData,
} from "discord.js/typings/index.js";
import { client, commands, IEvent } from "..";
import { guildId } from "../../config.json";

export default <IEvent>{
  name: "ready",
  listener: async () => {
    if (!client.application?.owner) await client.application?.fetch();

    client.guilds.cache.forEach(async (guild) => {
      const permissions: ApplicationCommandPermissionData[] = guild.roles.cache
        .filter((role) => role.permissions.has("ADMINISTRATOR"))
        .reduce(
          (acc: ApplicationCommandPermissionData[], v) => {
            return [
              ...acc,
              {
                id: v.id,
                type: "ROLE",
                permission: true,
              },
            ];
          },
          [{ id: guild.ownerId, type: "USER", permission: true }]
        );

      guildId === guild.id &&
        permissions.push({
          id: "843811717786894366",
          type: "ROLE",
          permission: true,
        });

      const fullPermissions: GuildApplicationCommandPermissionData[] =
        commands.reduce((acc: GuildApplicationCommandPermissionData[], v) => {
          return [
            ...acc,
            {
              id: v.id,
              permissions: permissions.slice(0, 10),
            },
          ];
        }, []);

      try {
        await guild.commands.permissions.set({ fullPermissions });
      } catch (e) {
        console.log("unable to set permission in server " + guild.name);
      }
    });
  },
};
