import { SlashCommandBuilder } from "@discordjs/builders";
import { ICommand } from "..";

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
            .setName("set")
            .setDescription("문제를 만들거나 수정한다.")
            .addStringOption((option) =>
              option
                .setName("name")
                .setDescription("문제의 이름")
                .setRequired(true)
            )
            .addStringOption((option) =>
              option
                .setName("정답")
                .setDescription("문제의 정답")
                .setRequired(true)
            )
        )
    ),
  execute: (itr) => {
    itr.reply(itr.options.getString("말할거") || "뭐라는거");
  },
};
