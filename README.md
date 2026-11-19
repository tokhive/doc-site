# TokHive Docs

Source of [docs.tokhive.ai](https://docs.tokhive.ai), built with [Docusaurus](https://docusaurus.io/).

## Layout

- `docs/`: the documentation, served from the site root. Each folder is a sidebar category, described by its `_category_.json`.
- `blog/`: blog posts; authors and tags are in `authors.yml` and `tags.yml`.
- `src/css/custom.css`: the TokHive theme on top of Docusaurus's Infima styles.
- `static/`: files copied as-is, including `CNAME`, `robots.txt` and `img/social-card.png`.
- `scripts/social-card/`: the HTML source of the link preview image; run `./scripts/social-card/render.sh` to regenerate the PNG.

## Develop

```bash
npm ci
npm start           # dev server with live reload
npm run build       # production build into build/, also writes llms.txt and llms-full.txt
npm run serve       # serve build/ locally
npm run typecheck
```

Give every new page a `description` in its front matter; it is used for search results and link previews.

## Deploy

GitHub Actions builds every pull request (`.github/workflows/test-deploy.yml`) and deploys `main` to GitHub Pages on every push (`.github/workflows/deploy.yml`). The custom domain comes from `static/CNAME`.
