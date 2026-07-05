# GroundZero

**GROUND ZERO** is a road issue reporting system — a web application that lets users report road problems (potholes, damage, hazards, etc.), view them on a map, and track updates, backed by a lightweight Node.js/Express API.

## ✨ Features

- **User authentication** — signup/login with hashed passwords (bcrypt) and JWT-based sessions
- **Report road issues** — submit reports with details and (via Multer) file/image uploads
- **Map view** — visualize reported issues on an interactive map
- **Status tracking** — check for updates on submitted reports
- **User profile** — manage account details and settings
- **Static informational pages** — About, Contact, and Help & Support

## 🗂️ Project Structure

```
GroundZero.github.io/
├── index.html              # Landing page
├── home.html                # Home / dashboard
├── login.html                # Login page
├── login_01.html             # Alternate login view
├── profile.html               # User profile page
├── view_map.html               # Map view of reported issues
├── report_update.html          # Report submission / status updates
├── about.html                  # About page
├── contact.html                 # Contact page
├── helpandassupport.html        # Help & support page
├── Settings.html                 # User settings page
├── rendom.html                    # Misc/experimental page
├── best3.html                      # Misc/experimental page
├── server.js                        # Express backend entry point
├── package.json                      # Project metadata & dependencies
└── README.md
```

## 🛠️ Tech Stack

**Frontend:** HTML, CSS, JavaScript (static pages)

**Backend:** Node.js, Express

**Key dependencies:**
| Package | Purpose |
|---|---|
| `express` | Web server & routing |
| `multer` | File/image upload handling |
| `cors` | Cross-origin resource sharing |
| `bcryptjs` | Password hashing |
| `jsonwebtoken` | Auth token generation & verification |
| `nodemon` *(dev)* | Auto-restart server during development |

## 🚀 Getting Started

### Prerequisites
- [Node.js](https://nodejs.org/) (v14+ recommended)
- npm

### Installation

```bash
# Clone the repository
git clone https://github.com/Nitin-Saroj1703/GroundZero.github.io.git
cd GroundZero.github.io

# Install dependencies
npm install
```

### Running the app

```bash
# Start the server
npm start

# Or run in development mode with auto-restart
npm run dev
```

Then open `index.html` (or the relevant page) in your browser, or navigate to the port your Express server is configured to listen on.

## 📖 Usage

1. Open the app and sign up / log in.
2. Submit a road issue report with details (and an optional image).
3. View submitted issues on the map page.
4. Track the status of reports via the update page.
5. Manage your account from the profile/settings pages.

## 🤝 Contributing

Contributions are welcome!

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/your-feature`)
3. Commit your changes (`git commit -m "Add some feature"`)
4. Push to the branch (`git push origin feature/your-feature`)
5. Open a Pull Request

## 📄 License

No license has been specified for this project yet. Consider adding one (e.g., MIT) if you plan to accept external contributions.

## 👤 Author

**Nitin Saroj** — [@Nitin-Saroj1703](https://github.com/Nitin-Saroj1703)
