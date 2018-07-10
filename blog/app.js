const createError = require("http-errors");
const express = require("express");
const ExpressOIDC = require("@okta/oidc-middleware").ExpressOIDC;
const logger = require("morgan");
const path = require("path");
const okta = require("@okta/okta-sdk-nodejs");
const session = require("express-session");


const blogRouter = require("./routes/blog");
const usersRouter = require("./routes/users");

const app = express();
const client = new okta.Client({
  orgUrl: "https://{dev-646983.oktapreview}.com",
  token: "{002m7WZets1I_TECf4vyg0rXTeMofhZKFkrQzEmfgV}"
});

app.set("views", path.join(__dirname, "views"));
app.set("view engine", "pug");

// Middleware
app.use(logger("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, "public")));
// Routes
app.use("/", blogRouter);
app.use("/users", usersRouter);

const oidc = new ExpressOIDC({
  issuer: "https://{dev-646983.oktapreview}.com/oauth2/default",
  client_id: "{0oafp81l2gZE7xFWV0h7}",
  client_secret: "{3Pz47xk1rkzMSL-4DD1K4jqfGZX5haJhsRX8mitq}",
  redirect_uri: "http://localhost:3000/users/callback",
  scope: "openid profile",
  routes: {
    login: {
      path: "/users/login"
    },
    callback: {
      path: "/users/callback",
      defaultRedirect: "/dashboard"
    }
  }
});

app.use(session({
  secret: "{aLongRandomString}",
  resave: true,
  saveUninitialized: false
}));
oidc.on('ready', () => {
  app.listen(3000, () => console.log('app started'));
});

app.use(oidc.router);


app.use((req, res, next) => {
  if (!req.userinfo) {
    return next();
  }

  client.getUser(req.userinfo.sub)
    .then(user => {
      req.user = user;
      res.locals.user = user;
      next();
    });
});



// Error handlers
app.use(function (req, res, next) {
  next(createError(404));
});

app.use(function (err, req, res, next) {
  res.locals.message = err.message;
  res.locals.error = req.app.get("env") === "development" ? err : {};

  res.status(err.status || 500);
  res.render("error");
});


module.exports = app;