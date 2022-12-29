if (process.env.NODE_ENV !== "production") {
  require("dotenv").config();
}

const debug = require("debug")("blog:app.js");
const socketDebug = require("debug")("blog:socket");
const createError = require("http-errors");
const express = require("express");
const path = require("path");
const http = require("http");
const logger = require("morgan");
const sassMiddleware = require("node-sass-middleware");
const session = require("express-session");
const flash = require("connect-flash");
const toastr = require("express-toastr");
const methodOverride = require("method-override");
const helmet = require("helmet");
const mongoose = require("mongoose");
const mongoSanitize = require("express-mongo-sanitize");
const MongoDBStore = require("connect-mongo");
const cookieParser = require("cookie-parser");
const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth").OAuth2Strategy;
const slugify = require("slugify");
const randomstring = require("randomstring");

const User = require("./models/user");
const Notification = require("./models/notification");

const {
  scriptSrcUrls,
  styleSrcUrls,
  connectSrcUrls,
  fontSrcUrls,
  imgSrcUrls,
} = require("./utils/helmetHelper");

const seed = require("./seed");
seed
  .seedSubscribers()
  .then(() => seed.seedBlog())
  .then(() => seed.seedNotifications());

const dbUrl = process.env.DB_URL;
mongoose.set("strictQuery", true);
mongoose.connect(dbUrl, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const db = mongoose.connection;
db.on("error", console.error.bind(console, "connection error:"));
db.once("open", () => {
  debug("Database connected");
});

const authRouter = require("./routes/auth");
const indexRouter = require("./routes/index");
const notificationRouter = require("./routes/notification");

const PORT = process.env.PORT || 3000;

const app = express();
const server = http.createServer(app);
const { Server } = require("socket.io");
const io = new Server(server);
io.sockets.setMaxListeners(40);

// view engine setup
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "pug");

app.use(logger("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(methodOverride("_method"));
app.use(
  mongoSanitize({
    replaceWith: "_",
  })
);
app.use(cookieParser());
app.use(
  sassMiddleware({
    src: path.join(__dirname, "public"),
    dest: path.join(__dirname, "public"),
    indentedSyntax: false, // true = .sass and false = .scss
    sourceMap: true,
    outputStyle: "compressed",
  })
);
app.use(express.static(path.join(__dirname, "public")));
app.use(express.static(path.join(__dirname, "node_modules")));

const sess = {
  name: "simp",
  secret: process.env.SECRET,
  cookie: {
    httpOnly: true,
    expires: Date.now() + 1000 * 60 * 60 * 12 * 1,
    maxAge: 1000 * 60 * 60 * 12 * 1,
    sameSite: "lax",
  },
  store: MongoDBStore.create({
    mongoUrl: process.env.DB_URL,
    touchAfter: 24 * 3600,
    secret: process.env.SECRET,
  }),
  resave: false,
  saveUninitialized: true,
};

if (app.get("env") === "production") {
  app.set("trust proxy", true); // trust first proxy
  sess.cookie.secure = true; // serve secure cookies
}

app.use(
  helmet({
    crossOriginEmbedderPolicy: false,
  })
);

app.use(
  helmet.contentSecurityPolicy({
    directives: {
      defaultSrc: [],
      connectSrc: ["'self'", ...connectSrcUrls()],
      scriptSrc: ["'unsafe-inline'", "'self'", ...scriptSrcUrls()],
      styleSrc: ["'self'", "'unsafe-inline'", ...styleSrcUrls()],
      workerSrc: ["'self'", "blob:"],
      childSrc: ["blob:"],
      objectSrc: [],
      imgSrc: ["'self'", "blob:", "data:", ...imgSrcUrls()],
      fontSrc: ["'self'", ...fontSrcUrls()],
    },
  })
);

app.use(session(sess));
app.use(flash());
app.use(
  toastr({
    closeButton: true,
    progressBar: true,
    showMethod: "slideDown",
    hideMethod: "slideUp",
    positionClass: "toast-bottom-full-width",
    timeOut: "4000",
    extendedTimeOut: "0",
  })
);

app.use(passport.initialize());
app.use(passport.session());

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: `/auth/google/callback`,
      passReqToCallback: true,
    },
    async (req, accessToken, refreshToken, profile, cb) => {
      await User.findOrCreate(
        { googleId: profile.id },
        {
          googleId: profile.id,
          email: profile._json.email,
          image: profile._json.picture,
          firstName: profile.name.givenName,
          lastName: profile.name.familyName,
          userSlug: slugify(
            `${profile.name.givenName} ${
              profile.name.familyName
            } ${randomstring.generate({
              length: 5,
              charset: "numeric",
            })}`
          ),
        },
        (err, user) => {
          return cb(err, user);
        }
      );
    }
  )
);

passport.serializeUser(function (user, cb) {
  cb(null, user);
});

passport.deserializeUser(function (obj, cb) {
  cb(null, obj);
});

const wrap = (middleware) => (socket, next) =>
  middleware(socket.request, {}, next);

io.use(wrap(session(sess)));
io.use(wrap(passport.initialize()));
io.use(wrap(passport.session()));

io.use((socket, next) => {
  if (socket.request.user) {
    next();
  } else {
    next(new Error("unauthorized"));
  }
});

io.filterSocketsByUser = (filterFn) =>
  Object.values(io.sockets.connected).filter(
    (socket) => socket.handshake && filterFn(socket.conn.request.user)
  );

io.emitToUser = (_id, event, ...args) =>
  io
    .filterSocketsByUser((user) => user._id.equals(_id))
    .forEach((socket) => socket.emit(event, ...args));

io.on("connection", (socket) => {
  console.log("User Connected");
  // socket.on("whoami", (cb) => {
  //   cb(socket.request.user ? socket.request.user.username : "");
  // });
  const session = socket.request.session;
  session.socketId = socket.id;
  session.save();
});

app.use(async (req, res, next) => {
  res.locals.currentUser = req.user;
  res.locals.toasts = req.toastr.render();
  res.locals.notifications = await Notification.find({ _userId: req.user });
  next();
});

app.use("/auth", authRouter);
app.use("/", indexRouter);
app.use("/notification", notificationRouter);

// catch 404 and forward to error handler
app.use(function (req, res, next) {
  next(createError(404));
});

// error handler
app.use(function (err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get("env") === "development" ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render("error");
});

async function run() {
  try {
    const changeStream = User.watch();
    changeStream.on("change", async (data) => {
      io.once("connection", async (socket) => {
        switch (data.operationType) {
          case "update":
            if (data.updateDescription.updatedFields.online === true) {
              let user = await User.findById(data.documentKey._id);
              io.to(socket.id).emit("online", user);
              changeStream.close();
              break;
            }
        }
        socket.on("disconnect", () => {
          io.to(socket.id).emit("online", null);
        });
      });
    });
  } catch {
    changeStream.close();
  }
  try {
    const changeStream2 = Notification.watch();
    io.on("connection", (socket) => {
      changeStream2.on("change", async (data) => {
        switch (data.operationType) {
          case "insert":
            if (
              socket.request.session.passport.user._id ==
              data.fullDocument._userId
            ) {
              io.to(socket.id).emit("notification", data.fullDocument.message);
            }
        }
      });
    });
  } catch {
    // changeStream2.close();
  }
}
run().catch(console.error);

server.listen(PORT, () => {
  debug(`Blog is running on port ${PORT}`);
});
