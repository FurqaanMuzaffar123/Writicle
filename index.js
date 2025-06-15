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
            maxAge: 1000 * 60 * 60 * 24 * 30,
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

app.get("/", (req, res) => {
    if (req.isAuthenticated()) {
        res.redirect("/main");
    } else {
        res.render("index.ejs");
    }
});

app.get("/main",(req,res)=>{
    if (req.isAuthenticated()){
        res.render("main.ejs", {
            username: req.user.username,
        });
    } else {
        res.redirect("/");
    }
})

app.get("/get_started",(req, res)=>{
    res.render("get_started.ejs");
})

app.post("/signin", async (req, res) => {
    const username = req.body.firstName + req.body.lastName;
    const plainPassword = req.body.password;
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
        bcrypt.hash(plainPassword, saltRounds, async function (err, hash) {
            await db.query("INSERT INTO users(username,password) VALUES($1,$2)", [
                username,
                hash,
            ]);
        });
        res.redirect("/");
    }
});

app.post(
    "/login",
    passport.authenticate("local", {
        successRedirect: "/main",
        failureRedirect: "/",
        failureMessage: true, // Enable displaying failure messages
    })
);

passport.use(
  new Strategy(async function verify(username, password, cb) {
    try {
      console.log(`[DEBUG] Attempting login for username: ${username}`);

      const result = await db.query("SELECT * FROM users WHERE username = $1", [
        username,
      ]);

      if (result.rows.length > 0) {
        const user = result.rows[0];
        const storedHashedPassword = user.password;

        console.log(`[DEBUG] User found in database: ${user.username}`);
        console.log(`[DEBUG] Comparing provided password with stored hash...`);

        const isMatch = await bcrypt.compare(password, storedHashedPassword);

        if (isMatch) {
          console.log("[DEBUG] Password match successful. Logging in user.");
          return cb(null, user);
        } else {
          console.warn("[WARNING] Password does not match.");
          return cb(null, false, { message: "Incorrect password." });
        }
      } else {
        console.warn("[WARNING] User not found in database.");
        return cb(null, false, { message: "User not found." });
      }
    } catch (err) {
      console.error("[ERROR] Exception during authentication:", err);
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
    console.log(`Server listening on port ${port} and running on http://localhost:${port}`);
});