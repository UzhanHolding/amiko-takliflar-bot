const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const userSchema = new Schema(
  {
    botUser: {
      type: Object,
      default: {},
    },
    role: {
      type: String,
      default: "guest",
      enum: ["user", "admin", "guest"],
    },
    comments: [
      {
        type: Schema.Types.ObjectId,
        ref: "Comment",
      },
    ],
    step: {
      type: String,
      default: "start",
    },
  },
  {
    timestamps: true,
    autoIndex: true,
  }
);

const User = mongoose.model("User", userSchema);
module.exports = User;
