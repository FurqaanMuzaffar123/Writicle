import express from "express";
import bodyParser from "body-parser";
import pg from "pg";
import bcrypt from "bcrypt";
import session from "express-session";
import passport from "passport";
import { Strategy } from "passport-local";

const app = express();
const port = 3000;
const saltRounds = 10;

app.use(
  session({
    secret: "TOPSECRET",
    resave: false,
    saveUninitialized: true,
    cookie: {
      maxAge: 1000 * 60 * 60 * 24 * 3,
    },
  })
);

app.use(passport.initialize());
app.use(passport.session());

const db = new pg.Client({
    user: "postgres",
    password: "furqaan@13",
    host: "localhost",
    port: 5432,
    database: "articleChat",
});

db.connect();

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

app.get("/", (req,res)=>{
  if (req.isAuthenticated()) {
    res.redirect("/main")
  } else {
    res.render("index.ejs")
  }
});

app.get("/signin", (req, res) => {
  res.render("signin.ejs");
});

app.get("/login", (req, res) => {
  res.render("login.ejs");
});

app.post("/signin", async (req, res) => {
  const username = req.body.floatingInput;
  const plainPassword = req.body.floatingPassword;
  const result = await db.query(
    `SELECT EXISTS (
            SELECT username
            FROM users
            WHERE username = $1
            );`,
    [username]
  );
  if (result.rows[0].exists) {
    res.render("signin.ejs", {
      message: "Username not available",
    });
  } else {
    bcrypt.hash(plainPassword, saltRounds, function (err, hash) {
      db.query("INSERT INTO users(username,password) VALUES($1,$2)", [
        username,
        hash,
      ]);
    });
    res.redirect("/");
  }
});

app.post("/login", passport.authenticate("local",{
  successRedirect:"/main",
  failureRedirect:"/login"
}))

passport.use(
  new Strategy(async function verify(floatingInput, floatingPassword, cb) {
    try {
      const result = await db.query("SELECT * FROM users WHERE username = $1", [
        floatingInput,
      ]);
      if (result.rows.length > 0) {
        const user = result.rows[0];
        const storedHashedPassword = user.password;
        bcrypt.compare(floatingPassword, storedHashedPassword, (err, result) => {
          if (err) {
            return cb(err);
          } else {
            if (result) {
              return cb(null, user);
            } else {
              cb(null, false);
            }
          }
        });
      } else {
        return cb("User not found");
      }
    } catch (err) {
      return cb(err);
    }
  })
);

passport.serializeUser((user, cb) => {
  cb(null, user);
});
passport.deserializeUser((user, cb) => {
  cb(null, user);
});

app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});
