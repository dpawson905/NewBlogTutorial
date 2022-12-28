const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const opts = { timestamps: true };

const BlogSchema = new Schema({
  author: {
    type: Schema.Types.ObjectId,
    ref: "User",
  },
  title: {
    type: String,
    lowercase: false,
    required: false,
    trim: true,
  },
  body: {
    type: String,
    lowercase: false,
    required: false,
    trim: true,
  },
  slug: {
    type: String,
    lowercase: true,
    trim: true,
    unique: true,
  },
  image: {
    type: String,
  },
  subscribers: [
    {
      type: Schema.Types.ObjectId,
      ref: "Subscriber",
    },
  ],
}, opts);

BlogSchema.pre(/^find/, function (next) {
  this.populate("subscribers");
  this.populate("author");
  next();
});

const Blog = mongoose.model("Blog", BlogSchema);

module.exports = Blog;
