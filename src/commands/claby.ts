import { SlashCommandBuilder } from "@discordjs/builders";
import { labyrinth, question } from "@prisma/client";
import { CommandInteraction, MessageEmbed } from "discord.js";
import fs from "fs";
import { prisma, ICommand } from "..";
import _ from "lodash";

async function execute(interaction: CommandInteraction) {
  await interaction.deferReply();
  if (!interaction.guildId)
    return interaction.editReply("이 명령어는 서버 내에서만 사용 가능합니다.");

  const labyrinth =
    (await prisma.labyrinth.findUnique({
      where: {
        serverId: interaction.guildId,
      },
      include: {
        questions: true,
      },
    })) ??
    (await prisma.labyrinth.create({
      data: {
        serverId: interaction.guildId,
      },
      include: {
        questions: true,
      },
    }));

  let result = "헋 님뭐라쓴거";

  result = await actions[interaction.options.getSubcommandGroup(false) ?? ""][
    interaction.options.getSubcommand()
  ](interaction, labyrinth);

  if (result.length > 2000) {
    const filePath = "./temp.txt";

    fs.writeFileSync(filePath, result);
    await interaction.editReply({ files: ["./temp.txt"] });
    fs.unlinkSync(filePath);
  } else {
    result.length != 0 && (await interaction.editReply(result));
  }
}

// async function updatePrisma(
//   labyrinth: labyrinth & {
//     questions: question[];
//   },
//   interaction: CommandInteraction
// ) {
//   if (!interaction.guildId) return;

//   await prisma.labyrinth.update({
//     where: {
//       serverId: interaction.guildId,
//     },
//     data: _.omit(labyrinth, "questions"),
//   });
// }

const actions: {
  [index: string]: {
    [index: string]: (
      interaction: CommandInteraction,
      labyrinth: labyrinth & {
        questions: question[];
      }
    ) => string | Promise<string>;
  };
} = {
  question: {
    add: async (interaction, labyrinth) => {
      const name = interaction.options.getString("name");
      const answer = interaction.options.getString("answer");
      if (!name) return "문제 이름을 적어주세요.";
      if (!answer) return "문제 정답을 적어주세요.";

      const question = labyrinth.questions.find((v) => v.name === name);
      if (!question) {
        await prisma.question.create({
          data: {
            name,
            labyrinthId: labyrinth.id,
            answers: [answer],
          },
        });
        return "성공적으로 문제를 생성했습니다!";
      } else return "문제가 이미 존재합니다!";
    },
    delete: async (interaction, labyrinth) => {
      const name = interaction.options.getString("name");
      if (!name) return "문제 이름을 적어주세요.";

      const question = labyrinth.questions.find((v) => v.name === name);
      if (question) {
        await prisma.question.delete({
          where: { name_labyrinthId: { name, labyrinthId: labyrinth.id } },
        });
        return "성공적으로 문제를 삭제했습니다!";
      } else return "문제가 존재하지 않습니다!";
    },
    list: async (interaction, labyrinth) => {
      const embed = new MessageEmbed().setColor(0xfcba03).addFields({
        name: "현재 문제들",
        value:
          "```" +
          (labyrinth.questions
            .map(
              (v) =>
                " - " +
                (v.name.length > 20 ? v.name.substring(0, 20) + "..." : v.name)
            )
            .join("\n") || "없음") +
          "```",
      });
      interaction.editReply({ embeds: [embed] });
      return "";
    },
  },
};

export default <ICommand>{
  data: new SlashCommandBuilder()
    .setName("claby")
    .setDescription("미궁과 관련된 관리자용 작업을 한다.")
    .setDefaultPermission(false)
    .addSubcommandGroup((subcommandGroup) =>
      subcommandGroup
        .setName("question")
        .setDescription("문제와 관련된 설정을 한다.")
        .addSubcommand((subcommand) =>
          subcommand
            .setName("add")
            .setDescription("문제를 만들거나 수정한다.")
            .addStringOption((option) =>
              option
                .setName("name")
                .setDescription("문제의 이름")
                .setRequired(true)
            )
            .addStringOption((option) =>
              option
                .setName("answer")
                .setDescription("문제의 정답")
                .setRequired(true)
            )
        )
        .addSubcommand((subcommand) =>
          subcommand
            .setName("delete")
            .setDescription("문제를 삭제한다.")
            .addStringOption((option) =>
              option
                .setName("name")
                .setDescription("문제의 이름")
                .setRequired(true)
            )
        )
        .addSubcommand((subcommand) =>
          subcommand.setName("list").setDescription("문제의 목록을 불러온다.")
        )
    ),
  execute,
};
