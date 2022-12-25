if (process.env.NODE_ENV !== "production") {
  require("dotenv").config();
}

const debug = require("debug")("blog:app.js");
const createError = require("http-errors");
const express = require("express");
const path = require("path");
const cookieParser = require("cookie-parser");
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

const _passport = require("./utils/passportHelper");

const {
  scriptSrcUrls,
  styleSrcUrls,
  connectSrcUrls,
  fontSrcUrls,
  imgSrcUrls,
} = require("./utils/helmetHelper");

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

const PORT = process.env.PORT || 3000;

const app = express();

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
// app.use(cookieParser());
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
  })
);

_passport.passportInit(app);

app.use((req, res, next) => {
  res.locals.currentUser = req.user;
  res.locals.toasts = req.toastr.render();
  next();
});

app.use("/auth", authRouter);
app.use("/", indexRouter);

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

app.listen(PORT, () => {
  debug(`Blog is running on port ${PORT}`);
});
