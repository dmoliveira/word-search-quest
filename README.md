# Word Quest Search

A polished, static word-search game built for GitHub Pages.

## Highlights

- Daily puzzle with a shared seed
- Endless custom mode with thousands of setup combinations
- Configurable grid size, word count, diagonals, reverse words, timer, and hints
- Touch, mouse, and keyboard-friendly board interaction
- Local streaks, wins, best times, and lightweight achievements
- Shareable challenge links without accounts or a backend

## Play locally

This project is intentionally dependency-free for frictionless GitHub Pages hosting.

```bash
python3 -m http.server 4173
```

Then open `http://localhost:4173`.

## Deploy to GitHub Pages

1. Push the repo to GitHub.
2. In **Settings → Pages**, choose **Deploy from a branch**.
3. Select the `main` branch and `/ (root)`.
4. Save.

Because the app is static HTML, CSS, and JavaScript, no build step is required.

## Gameplay

- Find words horizontally, vertically, diagonally, and optionally in reverse.
- Use presets for casual, balanced, sprint, or veteran play.
- Start a drag selection, or click/tap one cell and then another to select a word line.
- Use keyboard arrows to move across the grid and `Enter`/`Space` to start or finish a selection.

## Fun extras

- Daily streak tracking
- Challenge presets
- “Spark” hints to reveal a starting letter
- Achievement badges for first win, speed, daily streaks, and veteran clears
