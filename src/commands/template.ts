import { SlashCommandBuilder } from "@discordjs/builders";
import { CommandInteraction } from "discord.js/typings/index.js";
import { ICommand, prisma } from "..";
import fs from "fs";

export default <ICommand>{
  data: new SlashCommandBuilder()
    .setName("btemplate")
    .setDescription("채널 이름 템플릿을 생성/삭제/변경/설정한다.")
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
    interaction.reply("처리 중...").then(() =>
      listener(interaction).then((res) => {
        if (res.length > 2000) {
          const filePath = "./temp.txt";

          fs.writeFileSync(filePath, res);
          interaction.editReply({ files: ["./temp.txt"] });
          fs.unlinkSync(filePath);
        } else {
          interaction.editReply(res);
        }
      })
    );
  },
};

async function listener(interaction: CommandInteraction): Promise<string> {
  if (!interaction.guildId) return "이 명령어는 서버 내에서만 사용 가능합니다.";

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
    return "무언가 문제가 발생한 것 같습니다... 봇 제작자에게 문의하세요.";

  let result = "헋 님뭐라쓴거";

  switch (interaction.options.getSubcommand()) {
    case "create":
      const name = interaction.options.getString("template_name");
      if (!name) return "템플릿 이름을 적어주세요.";
      if (template[name]) {
        result = `템플릿 \`${name}\`가 이미 존재합니다!`;
      } else {
        template[name] = {};
        result = `성공적으로 템플릿 \`${name}\`을 생성했습니다!`;
      }
      break;
    case "list":
      result = "헉샌즈";
      break;
  }

  await prisma.server.update({
    where: {
      id: interaction.guildId,
    },
    data: {
      templateData: template,
    },
  });

  return result;
}
