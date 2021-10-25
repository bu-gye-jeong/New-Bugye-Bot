import { Embed, SlashCommandBuilder } from "@discordjs/builders";
import { client, ICommand, prisma } from "..";
import fs from "fs";
import { CommandInteraction, MessageEmbed } from "discord.js";
import { Prisma } from ".prisma/client";

export default <ICommand>{
  data: new SlashCommandBuilder()
    .setName("btemplate")
    .setDescription("채널 이름 템플릿을 생성/삭제/변경/설정한다.")
    .setDefaultPermission(false)
    .addSubcommand((subcommand) =>
      subcommand
        .setName("apply")
        .setDescription("템플릿을 적용한다.")
        .addStringOption((option) =>
          option
            .setName("template_name")
            .setDescription("적용할 템플릿의 이름")
            .setRequired(true)
        )
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("create")
        .setDescription("새로운 템플릿을 만든다.")
        .addStringOption((option) =>
          option
            .setName("template_name")
            .setDescription("만들 템플릿의 이름")
            .setRequired(true)
        )
    )
    .addSubcommand((subcommand) =>
      subcommand.setName("list").setDescription("템플릿 목록을 불러온다.")
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("delete")
        .setDescription("템플릿을 삭제한다.")
        .addStringOption((option) =>
          option
            .setName("template_name")
            .setDescription("삭제할 템플릿의 이름")
            .setRequired(true)
        )
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("save")
        .setDescription("현재 채널들을 저장한다.")
        .addStringOption((option) =>
          option
            .setName("template_name")
            .setDescription("저장할 템플릿의 이름")
            .setRequired(true)
        )
    )
    .addSubcommandGroup((subcommandGroup) =>
      subcommandGroup
        .setName("channel")
        .setDescription("템플릿의 채널에 관련된 설정을 한다.")
        .addSubcommand((subcommand) =>
          subcommand
            .setName("add")
            .setDescription("템플릿에 채널을 등록한다.")
            .addStringOption((option) =>
              option
                .setName("template_name")
                .setDescription("등록할 템플릿의 이름")
                .setRequired(true)
            )
            .addChannelOption((option) =>
              option
                .setName("channel")
                .setDescription("등록할 채널")
                .setRequired(true)
            )
            .addStringOption((option) =>
              option
                .setName("channel_name")
                .setDescription("채널의 바꿀 이름")
                .setRequired(true)
            )
        )
        .addSubcommand((subcommand) =>
          subcommand
            .setName("list")
            .setDescription("템플릿에 등록된 채널들의 목록을 보여준다.")
            .addStringOption((option) =>
              option
                .setName("template_name")
                .setDescription("볼 템플릿의 이름")
                .setRequired(true)
            )
        )
        .addSubcommand((subcommand) =>
          subcommand
            .setName("delete")
            .setDescription("템플릿에서 채널을 삭제한다.")
            .addStringOption((option) =>
              option
                .setName("template_name")
                .setDescription("삭제할 템플릿의 이름")
                .setRequired(true)
            )
            .addChannelOption((option) =>
              option
                .setName("channel")
                .setDescription("삭제할 채널")
                .setRequired(true)
            )
        )
    ),
  execute: async (interaction) => {
    await interaction.deferReply();
    if (!interaction.guildId)
      return interaction.editReply(
        "이 명령어는 서버 내에서만 사용 가능합니다."
      );

    const server =
      (await prisma.server.findFirst({
        where: {
          id: interaction.guildId,
        },
      })) ??
      (await prisma.server.create({
        data: {
          id: interaction.guildId,
          templateData: {},
        },
      }));
    const template = server.templateData;

    if (!template || typeof template !== "object" || Array.isArray(template))
      return interaction.editReply(
        "무언가 문제가 발생한 것 같습니다... 봇 제작자에게 문의하세요."
      );

    let result: string = "헋 님뭐라쓴거";

    result = actions[interaction.options.getSubcommand()](
      interaction,
      template as Template
    );

    await prisma.server.update({
      where: {
        id: interaction.guildId,
      },
      data: {
        templateData: template,
      },
    });

    if (result.length > 2000) {
      const filePath = "./temp.txt";

      fs.writeFileSync(filePath, result);
      await interaction.editReply({ files: ["./temp.txt"] });
      fs.unlinkSync(filePath);
    } else {
      result.length != 0 && (await interaction.editReply(result));
    }
  },
};

interface Template extends Prisma.JsonObject {
  [index: string]: {
    id: string;
    name: string;
  }[];
}

const actions: {
  [index: string]: (
    interaction: CommandInteraction,
    template: Template
  ) => string;
} = {
  create: (interaction, template) => {
    const name = interaction.options.getString("template_name");
    if (!name) return "템플릿 이름을 적어주세요.";
    if (template[name]) {
      return `템플릿 \`${name}\`가 이미 존재합니다!`;
    } else {
      template[name] = [];
      return `성공적으로 템플릿 \`${name}\`을 생성했습니다!`;
    }
  },
  list: (interaction, template) => {
    const embed = new MessageEmbed().setColor(0xfcba03).addFields({
      name: "현재 템플릿들",
      value:
        "```" +
        (Object.keys(template)
          .map((v) => " - " + (v.length > 20 ? v.substring(0, 20) + "..." : v))
          .join("\n") || "없음") +
        "```",
    });
    interaction.editReply({ embeds: [embed] });
    return "";
  },
  delete: (interaction, template) => {
    const name = interaction.options.getString("template_name");
    if (!name) return "템플릿 이름을 적어주세요.";
    if (template[name]) {
      delete template[name];
      return `성공적으로 템플릿 \`${name}\`을 제거했습니다!`;
    } else {
      return `템플릿 \`${name}\`가 존재하지 않습니다!`;
    }
  },
  save: (interaction, template) => {
    const name = interaction.options.getString("template_name");
    if (!name) return "템플릿 이름을 적어주세요.";
    if (template[name]) {
      return `템플릿 \`${name}\`가 이미 존재합니다!`;
    } else {
      template[name] = interaction
        .guild!.channels.cache.toJSON()
        .map((v) => ({ id: v.id, name: v.name }));
      return `성공적으로 현재 채널들을 템플릿 \`${name}\`에 저장했습니다!`;
    }
  },
};
