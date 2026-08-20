# recroom.network public archive

This directory defines a read-only public archive workflow for GitHub Pages. The workflow crawls publicly retrievable pages from `recroom.network`, saves their HTML into route directories, downloads permitted references from the Rec Room public CDN hosts, and publishes the resulting `dist-archive` directory.

The archive is intentionally independent of the Manus backend. It does not provide login, comments, account management, database writes, media uploads, admin controls, or scheduled synchronization. Those features belong to the full-stack application and are not available on GitHub Pages.

## Publish with GitHub Pages

Push the repository to GitHub and keep the workflow file at `.github/workflows/deploy-public-archive.yml`. In the repository settings, open **Pages**, choose **GitHub Actions** as the source, and run the `Deploy public recroom.network archive` workflow from the `main` branch. The workflow uses Node.js only; it does not install the backend dependency tree.

For a project site, the expected URL is `https://OWNER.github.io/REPOSITORY/`. The workflow sets `ARCHIVE_BASE_PATH` automatically from the repository name. A custom domain or a user/organization Pages repository can use an empty base path if configured accordingly.

## Local preview

Run `ARCHIVE_BASE_PATH=/recroom-editable-site-sync node scripts/build-public-archive.mjs` and serve `dist-archive` with any static HTTP server. The generated `_archive/routes.json` records captured routes, `_archive/failures.json` records unavailable resources, and `_archive/README.txt` summarizes the crawl.

## Coverage policy

The archive includes publicly retrievable pages discovered from the route manifest and from same-site links found in those pages. It excludes login-gated, private, deleted, API-only, and live interactive content. A page may be listed in the failure report when its server response is unavailable, it is dynamically generated without a retrievable HTML response, or a referenced public asset is missing or times out. The archive report is the authoritative record of what was captured for a particular build.
