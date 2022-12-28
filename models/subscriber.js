const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const findOrCreate = require("mongoose-findorcreate");

const opts = { timestamps: true };

const SubscriberSchema = new Schema(
  {
    email: {
      type: String,
      unique: true,
      lowercase: true,
      required: true,
      trim: true,
    },
  }, opts
);

const Subscriber = mongoose.model("Subscriber", SubscriberSchema);

module.exports = Subscriber;
