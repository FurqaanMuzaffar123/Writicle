# Writicle 📝

Writicle is a dynamic platform for readers and writers to create, explore, and discuss articles. Built with a modern Node.js backend and a classic server-rendered EJS frontend, Writicle makes content creation intuitive using Editor.js.

## 🚀 Features

- **Rich Text Editor**: Effortlessly compose articles with block-style editing via [Editor.js](https://editorjs.io/).
- **Authentication**: Secure local authentication with bcrypt, plus Google OAuth2 integration.
- **Dynamic Views**: Fast, server-side rendered pages using EJS.
- **Database Integrated**: Robust PostgreSQL database for storing user data, sessions, and articles securely.

## 🛠️ Built With

- **Backend**: Node.js, Express.js
- **Database**: PostgreSQL (`pg`), `connect-pg-simple`
- **Frontend**: HTML5, CSS3, EJS (Embedded JavaScript templating)
- **Security**: Passport.js (Local & Google OAuth), bcrypt, dotenv

## 🚦 Getting Started

### Prerequisites

- Node.js installed on your machine
- PostgreSQL instance running

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/FurqaanMuzaffar123/Writicle.git
   ```
2. Navigate to the project directory:
   ```bash
   cd "Article Chat"
   ```
3. Install dependencies:
   ```bash
   npm install
   ```
4. Set up environment variables:
   Create a `.env` file in the root directory and configure your Postgres database connection, Session secret, and Google OAuth credentials.
   ```env
   # Example .env configuration
   PG_USER=your_pg_user
   PG_HOST=your_pg_host
   PG_DATABASE=your_pg_db
   PG_PASSWORD=your_pg_password
   PG_PORT=5432
   SESSION_SECRET=your_secret
   GOOGLE_CLIENT_ID=your_google_id
   GOOGLE_CLIENT_SECRET=your_google_secret
   ```
5. Run the application (Development mode):
   ```bash
   npm run dev
   ```
   Or for production:
   ```bash
   npm start
   ```

## 📜 License

This project is licensed under the [ISC](https://opensource.org/licenses/ISC) License.
