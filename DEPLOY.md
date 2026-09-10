# Deploy Math Trail to GitHub Pages

1. Copy everything in this folder (`index.html`, `game.js`, `.nojekyll`, and these docs) over the files on the `main` branch of the GitHub repo that serves the site.
2. Commit and push to `main`.
3. Wait ~30–60 seconds for GitHub Pages to rebuild, then open the Play URL.

No build step. Opening `index.html` locally or serving this folder with any static file server also works.

Example local serve:

```bash
cd math-trail-clean
python3 -m http.server 8080
```

Then open http://localhost:8080/
