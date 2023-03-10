const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const findOrCreate = require("mongoose-findorcreate");

const opts = { timestamps: true };

const UserSchema = new Schema(
  {
    googleId: {
      type: String,
      required:true,
      unique: true
    },
    email: {
      type: String,
      unique: true,
      lowercase: true,
      required: true,
      trim: true,
    },
    firstName: {
      type: String,
      lowercase: false,
      required: false,
      trim: true,
    },
    lastName: {
      type: String,
      lowercase: false,
      required: false,
      trim: true,
    },
    userSlug: {
      type: String,
      lowercase: true,
      trim: true,
      unique: true,
    },
    image: {
      type: String
    },
    online: {
      type: Boolean,
      default: false
    },
  }
);

UserSchema.plugin(findOrCreate);

const User = mongoose.model("User", UserSchema);

module.exports = User;
