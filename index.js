require("dotenv").config();
const db = require("./db");
const { Telegraf } = require("telegraf");
const User = require("./usermodel/user.model");
const Comment = require("./comment_model/comment.model");
const bot = new Telegraf(process.env.BOT_TOKEN);
const channel = process.env.CHANNEL_ID;
bot.start(async (ctx) => {
  ctx.reply(`Assalomu alaykum ${ctx.from.first_name}!\n
Amiko Takliflar botiga xush kelibsiz!\n
Takliflaringizni yuboring va biz takliflaringizni ko'rib chiqamiz va takliflaringizni kanalimizga joylaymiz!\n
Siz va sizning takliflaringiz anonim bo'ladi!\n
Kanalimiz: https://t.me/+EunXVj9KETc3MGRi`);
  const user_id = ctx.from.id;
  const user = await User.findOne({ "botUser.id": user_id });
  if (!user) {
    const user = new User({
      botUser: ctx.from,
      step: "start",
    });
    await user.save();
  } else {
    user.botUser = ctx.from;
    user.step = "start";
    await user.save();
  }
});
bot.use(async (ctx, next) => {
  // if user is not guest next()
  const user_id = ctx.from.id;
  const user = await User.findOne({ "botUser.id": user_id });
  if (!user || user.role === "guest") {
    ctx.reply("Siz hozircha ruxsat berilmagan");
    const user = new User({
      botUser: ctx.from,
    });
    await user.save();
  } else {
    return next();
  }
});
bot.command("buyruq", async (ctx) => {
  const user_id = ctx.from.id;
  const user = await User.findOne({ "botUser.id": user_id });
  if (user.role === "admin") {
    let text = "Buyruqlar berish uchun tanlang:\n\n";
    ctx.reply(text, {
      reply_markup: {
        inline_keyboard: [
          [
            {
              text: "Ruxsat berish",
              callback_data: "ruxsat",
            },
            {
              text: "Admin qilish",
              callback_data: "admin",
            },
          ],
          [
            {
              text: "O'chirish",
              callback_data: "delete",
            },
          ],
        ],
      },
    });
  }
});
bot.on("message", async (ctx) => {
  const user_id = ctx.from.id;
  const user = await User.findOne({ "botUser.id": user_id });
  if (user.step === "start") {
    await Comment.create({
      content: ctx.message,
      from: user._id,
    });
    ctx.copyMessage(channel);
  } else {
    const steps = user.step.split(">")[1];
    let id = ctx.message.text;
    const willUpdateUser = await User.findOne({
      "botUser.id": id * 1,
    });
    if (steps === "ruxsat") {
      willUpdateUser.role = "user";
      await willUpdateUser.save();
      ctx.reply("Ruxsat berildi");
    } else if (steps === "admin") {
      willUpdateUser.role = "admin";
      await willUpdateUser.save();
      ctx.reply("Admin qilindi");
    } else if (steps === "delete") {
      await willUpdateUser.remove();
      ctx.reply("O'chirildi");
    }
    ctx.reply("Buyruq bajarildi. Chiqish uchun iltimos /start ni bosing");
  }
});
bot.on("callback_query", async (ctx) => {
  ctx.answerCbQuery();
  const command = ctx.callbackQuery.data;
  const user_id = ctx.from.id;
  const user = await User.findOne({ "botUser.id": user_id });
  user.step += `>${command}`;
  await user.save();
  const allUsers = await User.find();
  let text = "Foydalanuvchilar ro'yxatidan ID ni yuboring :\n\n";
  allUsers.forEach((user) => {
    text += `${user.botUser.first_name} (<code>${user.botUser.id}</code>) \n`;
  });
  ctx.reply(text, {
    parse_mode: "HTML",
  });
});
bot.launch();
