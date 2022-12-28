const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const opts = { timestamps: true };

const NotificationSchema = new Schema(
  {
    _userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    message: {
      type: String
    }
  }
);

const Notification = mongoose.model("Notification", NotificationSchema);

module.exports = Notification;