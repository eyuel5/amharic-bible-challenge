# Amharic Bible Challenge 📖✨

A bilingual Bible quiz web app for practicing Amharic Bible knowledge with interactive games, session scoring, and theme settings.

**Live Demo:** https://amharicbibleq.netlify.app/

![App Screenshot 1](./screenshot1.png)
![App Screenshot 2](./screenshot2.png)
![App Screenshot 3](./screenshot3.png)

---

## 🌟 What this app offers

- **Five quiz modes** tailored to different Bible learning goals
- **Amharic and English UI support** with language persistence across sessions
- **Question source filters** for Old Testament, New Testament, or the entire Bible
- **Progress tracking** with score, accuracy, and mistake review
- **Responsive modern UI** built with React and Tailwind CSS

## 🎮 Available Game Modes

- **Verse to Book** – Read a verse and choose the correct book of the Bible
- **Verse Recall** – Complete a verse by filling in the missing word
- **Book Order** – Pick the book that comes before or after a given book
- **Verse Speaker** – Identify who spoke or narrated a verse
- **General Trivia** – Answer Bible trivia about people, places, and events

## ⚙️ Built with

- **React 19**
- **Vite**
- **Tailwind CSS**
- **Lucide React**
- **ESLint**

## 📁 Project structure

- `src/App.jsx` — main application layout and mode selection
- `src/components/game/` — game screens and mode components
- `src/data/bible/` — Bible text and metadata
- `src/data/questions/` — trivia question data
- `src/services/` — Bible data helpers and utilities

## 🚀 Run locally

```bash
npm install
npm run dev
```

Then open the local dev server URL shown in the console.

## 📦 Build for production

```bash
npm run build
```

This outputs the static site to `dist/`.

## 📡 Deployment

The app is configured for Netlify via `netlify.toml`. The production build output is served from `dist`.

## 🤝 Contribution

Contributions are welcome. To add new questions or modes:

1. Update the data files under `src/data/questions/` or `src/data/bible/`
2. Add or extend a game mode in `src/components/game/modes/`
3. Run `npm run lint` and verify the app behavior locally

If you find a typo in an Amharic verse, please open an issue or a pull request in `src/data/bible/`.

## 💡 Notes

- The app saves theme and language preferences in `localStorage`.
- Source filters let players focus on specific testaments or a single book.
- Mistakes are tracked and shown after each session to help learning.

---

Made for practicing Amharic Bible knowledge with a fast, engaging quiz experience.
