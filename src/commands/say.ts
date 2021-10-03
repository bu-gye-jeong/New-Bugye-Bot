import { SlashCommandBuilder } from "@discordjs/builders";
import { ICommand } from "..";

export default <ICommand>{
  data: new SlashCommandBuilder()
    .setName("say")
    .setDescription("말하게시키기")
    .addStringOption((option) =>
      option.setName("말할거").setDescription("ㅇ").setRequired(true)
    ),
  execute: (itr) => {
    itr.reply(itr.options.getString("말할거") || "뭐라는거");
  },
};
