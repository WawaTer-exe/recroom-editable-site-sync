# Automatic room-sync research

## Referenced GitHub archive

The supplied URLs `https://github.com/WawaTer-exe/RecSite` and `https://github.com/WawaTer-exe/RecSite/blob/main/recroom-editable-site-expanded.zip` both returned GitHub's public **404 Page not found** response in the current browser session. The repository and ZIP could not be inspected, downloaded, or compared against the current project. A working public repository URL, raw asset URL, or uploaded archive would be required for a direct comparison.

## Current synchronization implication

The current project already contains a deterministic bulk room importer and a public room fixture. A recurring sync should reuse its normalization and duplicate-safe upsert behavior rather than create a separate data model. Raw HTTP requests to recroom.network room pages may return only a hydrated app shell; complete descriptions, images, and metrics can require rendered-page access or a documented public data endpoint. The sync therefore needs explicit partial-data policy and observability for skipped or incomplete records.

## Admin UI verification

The authenticated admin page rendered successfully after the sync changes. The homepage-controls panel remains intact, and the full-page capture includes the new **Automatic Room Sync** panel with the 30-minute cron expression, current status/last-run metrics, error display, and a **Run sync now** action. The live recurring job is intentionally disabled until the production site is deployed and the callback is registered.
