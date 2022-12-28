const slugify = require("slugify");
const { faker } = require("@faker-js/faker");
const _ = require("lodash");
const User = require("./models/user");
const Blog = require("./models/blog");
const Subscriber = require("./models/subscriber");


const gatherUserInfo = async function () {
  const users = await User.find();
  let userArray = [];
  for (let i of users) {
    userArray.push(i);
  }
  // console.log(userArray[0].username);
  return userArray;
};

const gatherSubscribers = async function () {
  const subs = await Subscriber.find({});
  const subIds = [];
  for (let i of subs) {
    subIds.push(i);
  }
  // console.log(subIds);
  return subIds;
};

exports.seedSubscribers = async function () {
  await Subscriber.deleteMany({});
  for (const i of new Array(10)) {
    let email = faker.internet.email();
    let user = {
      email,
    };
    await Subscriber.create(user);
  }
  console.log("10 new users created");
};

exports.seedBlog = async function () {
  await Blog.deleteMany({});
  let userArray = await gatherUserInfo();
  let subs = await gatherSubscribers();
  for (const i of new Array(50)) {
    let blogUserInfo = _.shuffle(userArray)[0];
    let subscriberInfo = _.shuffle(subs).slice(0, 5);
    console.log(subscriberInfo);
    let author = blogUserInfo.id;
    let title = faker.lorem.words();
    let body = faker.lorem.paragraph();
    let slug = slugify(title);
    let subscribers = subscriberInfo;
    let newBlog = await Blog.create({
      author,
      title,
      body,
      slug,
      subscribers,
    });
    // blogUserInfo.blogs.push(newBlog);
    await blogUserInfo.save();
  }
  console.log("50 new blogs created");
};

