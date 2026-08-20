# Archive-only deployment contract

This repository’s **primary deliverable is a read-only public archive of `recroom.network` for GitHub Pages**. The supported deployment path is the workflow at `.github/workflows/deploy-public-archive.yml`, which runs `scripts/build-public-archive.mjs` and publishes only the generated `dist-archive` directory.

The existing `client/`, `server/`, `drizzle/`, and related full-stack files are retained as **legacy source and research material** from the earlier editable implementation. They are not included in the GitHub Pages artifact, are not started by the archive workflow, and must not be treated as the archive’s backend. The legacy full-stack build remains available only under `pnpm run build:fullstack` for recovery or future migration work.

The archive workflow does not install or deploy the backend dependency tree. It fetches publicly retrievable HTML and permitted public assets, writes route snapshots, emits `_archive/routes.json` and `_archive/failures.json`, and publishes a static site. Login-gated, private, deleted, API-only, and live interactive features are intentionally excluded.

For deployment, enable **GitHub Pages → GitHub Actions** in the repository settings and run the `Deploy public recroom.network archive` workflow from `main`. The generated project-site URL uses the repository name as its base path; the workflow sets that path automatically.
