# 🛡️ ShieldPass | Advanced Password Strength Analyzer & Generator

ShieldPass is a modern, high-performance web application designed to evaluate password strength and security in real time. It combines a TypeScript-based Node.js backend with an elegant, responsive glassmorphism frontend.

Using advanced entropy calculation libraries (`zxcvbn`), ShieldPass estimates real-time crack speeds under varying attack scenarios (Online Brute-Force vs. Offline GPU Hash-attacks) and helps users manage their passwords safely with active history checking to prevent reuse.

---

## ✨ Features

- ⚡ **Real-Time Entropy Analysis**: Computes complex password strength and feedback using the standard zxcvbn evaluation library.
- ⏱️ **Crack Time Estimation**: Displays clear estimations for cracking time under:
  - **Online Brute-Force**: 100 attempts/sec (typical web login page protections).
  - **Offline GPU Attack**: 10B attempts/sec (typical leaked hash dictionary-matching speeds).
- 🔑 **Secure Password Generator**: Instantly generate random, strong, and highly secure passwords with copy-to-clipboard functionality.
- 📜 **Password Reuse Scanner**: Track, log, and scan passwords to warn users about previous credential reuse.
- 🎨 **Premium Modern UI**: Built with pure CSS/JS utilizing a glassmorphic aesthetic, dark/light theme switching, and smooth animations.

---

## 📂 Project Architecture

```text
shieldpass/
├── backend/
│   ├── src/
│   │   ├── controllers/      # Route logic handlers (auth, password history)
│   │   ├── middleware/       # Authentication guards (JWT validation)
│   │   ├── models/           # SQLite database setup and query modules
│   │   ├── routes/           # API routes definitions
│   │   ├── types/            # TypeScript type declarations
│   │   └── server.ts         # Application entry point
│   ├── tsconfig.json
│   ├── .env.example
│   └── package.json
├── frontend/
│   ├── index.html            # Main markup page
│   ├── style.css             # Glassmorphism styling and themes
│   └── app.js                # Frontend logic, zxcvbn handling & APIs
└── README.md
```

---

## 🚀 Getting Started

### Prerequisites
- [Node.js](https://nodejs.org/) (v16+ recommended)
- NPM or Yarn package manager

### 1. Backend Setup

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Install the backend dependencies:
   ```bash
   npm install
   ```

3. Create your `.env` file using the template:
   ```bash
   cp .env.example .env
   ```

4. Configure the environment variables in `.env` (Port, JWT Secret, Token Expiry):
   ```ini
   PORT=5000
   JWT_SECRET=your_jwt_secret_key_here
   JWT_EXPIRE=1d
   ```

5. Run the backend in development mode:
   ```bash
   npm run dev
   ```
   The backend API will run on `http://localhost:5000` (or your configured port). It will automatically initialize a local SQLite database (`shieldpass.db` or similar).

### 2. Frontend Setup

1. The frontend consists of pure, optimized HTML, CSS, and JavaScript.
2. Since it relies on fetching APIs from the backend, serve the `frontend/` folder using any static server or simply open the `frontend/index.html` file in your browser.
3. For a quick local development server, you can run:
   ```bash
   npx serve frontend
   ```
   Or use the VS Code Live Server extension.

---

## 🔌 API Endpoints

### Authentication
- `POST /api/auth/register` - Create a new user account.
- `POST /api/auth/login` - Authenticate user and receive JWT.

### Password Analysis & History (Protected)
- `GET /api/passwords/history` - Retrieve previously logged passwords.
- `POST /api/passwords/check` - Log or analyze a password entry.
- `GET /api/health` - Simple API verification check.

---

## 🔒 Security Practices

- **Password Hashing**: Passwords stored in the backend (user authentication) are fully hashed with `bcryptjs`.
- **JWT Authorization**: Requests to fetch password histories require a valid JSON Web Token (`Authorization: Bearer <token>`).
- **Input Neutrality**: The server enforces sanitization and safe SQL queries to prevent injections.
