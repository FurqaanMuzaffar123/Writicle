// =======================
// Imports and Setup
// =======================
import express from "express";
import bodyParser from "body-parser";
import pg from "pg";
import bcrypt from "bcrypt";
import session from "express-session";
import passport from "passport";
import { Strategy } from "passport-local";
import connectPgSimple from "connect-pg-simple";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import dotenv from "dotenv";

// =======================
// App Initialization
// =======================
dotenv.config();
const PgSession = connectPgSimple(session);
const app = express();
const port = 3000;
const saltRounds = 10;
const topics = {
  "Science & Knowledge": [
    "Science",
    "Space & Astronomy",
    "Physics",
    "Chemistry",
    "Biology",
    "Artificial Intelligence",
    "Environment",
    "Psychology",
    "Mathematics",
  ],

  "Technology & Innovation": [
    "Tech News",
    "Programming",
    "Cybersecurity",
    "Gadgets",
    "Startups",
    "Robotics",
    "Gaming",
    "Virtual Reality (VR)",
    "Blockchain & Crypto",
  ],

  "Arts & Creativity": [
    "Art & Design",
    "Photography",
    "Animation",
    "Architecture",
    "Film & Cinema",
    "Music",
    "Writing & Literature",
    "Fashion",
    "Crafts & DIY",
  ],

  "Society & Culture": [
    "World News",
    "History",
    "Politics",
    "Culture & Traditions",
    "Philosophy",
    "Education",
    "Language & Linguistics",
    "Religion & Beliefs",
  ],

  "Lifestyle & Personal Growth": [
    "Health & Fitness",
    "Nutrition",
    "Mental Health",
    "Relationships",
    "Productivity",
    "Motivation",
    "Finance & Investing",
    "Career & Business",
    "Self-Improvement",
  ],

  "Nature & Exploration": [
    "Travel",
    "Geography",
    "Wildlife",
    "Oceans",
    "Space Exploration",
    "Adventure",
    "Hiking & Camping",
  ],

  "Fiction & Entertainment": [
    "Sci-Fi",
    "Fantasy",
    "Horror",
    "Mystery",
    "Anime & Manga",
    "Comics & Superheroes",
    "TV Shows & Movies",
    "Pop Culture",
  ],

  "Miscellaneous Fun Topics": [
    "Memes & Humor",
    "Life Hacks",
    "Food & Recipes",
    "Sports",
    "Cars & Motorbikes",
    "Minimalism",
    "Urban Life",
    "Parenting",
    "Pets",
  ],
};

// =======================
// Database Connection
// =======================
const db = new pg.Client({
  user: "postgres",
  password: "furqaan@13",
  host: "localhost",
  port: 5432,
  database: "articleChat",
});
db.connect();

// =======================
// Middleware Configuration
// =======================

// Session middleware for authentication
app.use(
  session({
    store: new PgSession({
      pool: db,
      tableName: "session",
    }),
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
      maxAge: 1000 * 60 * 60 * 24 * 30, // 30 days
    },
  })
);

// Initialize Passport.js
app.use(passport.initialize());
app.use(passport.session());

// =======================
// Express Middleware
// =======================
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));
app.use(express.json());

// =======================
// Authentication Middleware
// =======================
const ensureAuthenticated = (req, res, next) => {
  if (req.isAuthenticated()) {
    return next();
  }
  res.redirect("/login");
};

// =======================
// Routes
// =======================

// Home route
app.get("/", (req, res) => {
  if (req.isAuthenticated()) {
    res.redirect("/main");
  } else {
    res.render("index.ejs");
  }
});

// Main dashboard route (protected)
app.get("/main", ensureAuthenticated, async (req, res) => {
  res.render("main.ejs", {
    user: req.user,
  }); 
});

// Feed selection page (PROTECTED)
app.get("/choose_feed", ensureAuthenticated, async (req, res) => {
  res.render("choose_feed.ejs");
});

// Registration page
app.get("/register", (req, res) => {
  if (req.isAuthenticated()) {
    return res.redirect("/main");
  }
  res.render("register.ejs");
});

// Login page
app.get("/login", (req, res) => {
  if (req.isAuthenticated()) {
    return res.redirect("/main");
  }
  res.render("login.ejs");
});


// Detail Feed Page (PROTECTED)
app.get("/detail_feed", ensureAuthenticated, (req, res) => {
  const subtopics = JSON.parse(req.query.subtopics);
  const theme = req.query.theme;
  res.render("detail_feed.ejs", {
    user: req.user,
    subtopics: subtopics,
    theme: theme,
  });
});

// Article Creation Page
app.get("/create_article", (req, res) => {
  const isAuthentiacted = req.isAuthenticated();
  if (!isAuthentiacted) {
    res.render("create_article.ejs");
  } else {
    res.render("create_article.ejs", {
      user: req.user,
    });
  }
});

// Google Authentication Page
app.get("/auth/google",
  passport.authenticate("google", { scope: ["profile", "email"] })
);

// Google Authentication Callback
app.get(
  "/auth/google/callback",
  passport.authenticate("google", {
    failureRedirect: "/login",
  }),
  (req, res) => {
    // Successful auth
    history.back()
  }
);


// ========================
// Feed Selection Handler (PROTECTED)
// ========================
app.post("/choose_feed", ensureAuthenticated, async (req, res) => {
  const selectedTopics = req.body.topics;
  const selectedSubtopics = req.body.subtopics;
  const theme = req.body.theme;
  const user_id = req.user.id;
  const active_account_id = req.session.active_account_id;
  console.log("[DEBUG] Selected main topics:", selectedTopics);
  console.log("[DEBUG] Selected subtopics:", selectedSubtopics);
  console.log("[DEBUG] Selected theme:", theme);

  await db.query(
    "UPDATE accounts SET theme = $1, feed_chosen = true, categories = $2, sub_topics = $3 WHERE user_id = $4 AND id = $5",
    [theme, selectedTopics, selectedSubtopics, user_id, active_account_id]
  );

  res.redirect("/main");
});


// =======================
// Registration Handler
// =======================
app.post("/register", async (req, res) => {
  const username = req.body.fullName;
  const plainPassword = req.body.password;
  const email = req.body.email;

  try {
    // Check if username exists
    const result = await db.query(
      `SELECT EXISTS (
        SELECT username FROM users WHERE username = $1
      ) as username_exists;`,
      [username]
    );

    // Check if email exists
    const result2 = await db.query(
      `SELECT EXISTS (
        SELECT email FROM users WHERE email = $1
      ) as email_exists;`,
      [email]
    );

    if (result.rows[0].username_exists) {
      // Username taken
      return res.render("register.ejs", {
        err_message: "Username not available",
      });
    } else if (result2.rows[0].email_exists) {
      // Email taken
      return res.render("register.ejs", {
        email_err: " ",
      });
    } else {
      // Hash password and insert new user
      bcrypt.hash(plainPassword, saltRounds, async (err, hash) => {
        if (err) {
          console.error("[ERROR] Error hashing password:", err);
          return res.render("register.ejs", {
            err_message: "Error during registration. Please try again.",
          });
        }
        try {
          const insertResult = await db.query(
            "INSERT INTO users(username,password,email) VALUES($1,$2,$3) RETURNING *",
            [username, hash, email]
          );
          const newUser = insertResult.rows[0];

          req.login(newUser, (err) => {
            if (err) {
              console.error("[ERROR] Error during login:", err);
              return res.render("register.ejs", {
                err_message: "Error during login. Please try again.",

              });
            }
            console.log("[DEBUG] User signed in successfully.");
            return res.redirect("/choose_feed");
          });
        } catch (dbErr) {
          console.error("[ERROR] Database error during registration:", dbErr);
          return res.render("register.ejs", {
            err_message: "Database error. Please try again.",
          });
        }
      });
    }
  } catch (err) {
    console.error("[ERROR] Error during registration checks:", err);
    return res.render("register.ejs", {
      err_message: "Server error. Please try again.",
    });
  }
});

// =======================
// Login Handler
// =======================
app.post("/login", (req, res, next) => {
  passport.authenticate("local", (err, user, info) => {
    if (err) return next(err);
    if (!user) {
      return res.render("login.ejs", {
        err_message: info?.message || "Login failed.",
      });
    }

    req.logIn(user, async (err) => {
      if (err) return next(err);

      await db.query(
        "SELECT * FROM users WHERE user_id = $1",
        [user.id],
        (dbErr, result) => {
          if (dbErr) {
            console.error("[ERROR] Database error during login:", dbErr);
            return res.render("login.ejs", {
              err_message: "Database error. Please try again.",
            });
          }else {
          console.log("[DEBUG] User logged in successfully.");
          return res.redirect("/main", {
            user:user
          });
        }
        }   
      );
    });
  })(req, res, next);
});
// =======================
// Logout Route
// =======================
app.get("/logout", (req, res) => {
  req.logout((err) => {
    if (err) {
      console.error("[ERROR] Error during logout:", err);
    }
    res.redirect("/");
  });
});

// =======================
// Passport Local Strategy
// =======================
passport.use(
  new Strategy(async function verify(username, password, cb) {
    try {
      console.log(`[DEBUG] Attempting login for username: ${username}`);

      // Find user by username
      const result = await db.query("SELECT * FROM users WHERE username = $1", [
        username,
      ]);

      if (result.rows.length > 0) {
        const user = result.rows[0];
        const storedHashedPassword = user.password;

        console.log(`[DEBUG] User found in database: ${user.username}`);
        console.log(`[DEBUG] Comparing provided password with stored hash...`);

        // Compare password
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

// Serialize user to session
passport.serializeUser((user, cb) => {
  cb(null, user.id); // store only the user id in the session
});

// Deserialize user from session
passport.deserializeUser(async (id, cb) => {
  try {
    const result = await db.query("SELECT * FROM users WHERE id = $1", [id]);
    if (result.rows.length > 0) {
      cb(null, result.rows[0]); // attach full user object back to req.user
    } else {
      cb(new Error("User not found"), null);
    }
  } catch (err) {
    cb(err, null); 
  }
});

//========================
// Google OAuth Strategy
//========================
passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: "/auth/google/callback",
    },
    async function verify(accessToken, refreshToken, profile, cb) {
      try {
        const googleId = profile.id;
        const email = profile.emails?.[0]?.value;
        const username = profile.displayName;
        const avatar = profile.photos?.[0]?.value;

        // 1. Check if already registered via Google
        const existing = await db.query(
          "SELECT * FROM users WHERE google_id = $1",
          [googleId]
        );

        if (existing.rows.length > 0) {
          // Already registered → login
          return cb(null, existing.rows[0]);
        }

        // 2. Register new Google user
        const result = await db.query(
          `INSERT INTO users (username, email, google_id, avatar_url)
           VALUES ($1, $2, $3, $4)
           RETURNING *`,
          [username, email, googleId, avatar]
        );

        return cb(null, result.rows[0]);
      } catch (err) {
        return cb(err);
      }
    }
  )
);


// =======================
// Start Server
// =======================
app.listen(port, () => {
  console.log(
    `Server listening on port ${port} and running on http://localhost:${port}`
  );
});
