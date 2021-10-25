import { SlashCommandBuilder } from "@discordjs/builders";
import { ICommand } from "..";

export default <ICommand>{
  data: new SlashCommandBuilder()
    .setName("laby")
    .setDescription("미궁과 관련된 작업을 한다.")
    .addSubcommand((subcommand) =>
      subcommand.setName("answer").setDescription("미궁에 답을 제출한다.")
    ),
  execute: (itr) => {
    itr.reply(itr.options.getString("말할거") || "뭐라는거");
  },
};
