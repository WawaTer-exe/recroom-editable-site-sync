# Reference layout notes — recroom.network

The reference is a dense, image-led community portal rather than a dark editorial landing page. The top bar is charcoal with a large orange-and-white Rec Room logo at left, compact links for Shop and Creator Hub, and utility controls on the right for search, Login, Download, and settings.

Immediately below is a muted red announcement strip with a short Studio 87 message and Discord link. A horizontal showcase rail follows, using large image tiles with captions such as View Creator Hub, Download For Free, and a featured creator/news item. Below the rail are compact pill-like navigation links for News, Events, and Rooms.

The primary content area is a two-column community feed. A narrow left rail contains a Featured Rooms panel with stacked room cards, image thumbnails, room names, and creator handles. The wider right column is titled “Take A Look At What’s Happening Right Now In Rec Room” and displays social/photo cards with a small profile header, room link, large photo, share/tag controls, and cheer count. The page uses dark gray surfaces, thin gray borders, orange/red accent colors, high-density spacing, and image-first cards.

The reproduction should therefore prioritize: a compact logo header, announcement banner, horizontal hero rail, secondary pill navigation, left featured-room rail, and right photo/activity feed. Existing editable profiles, rooms, blog content, and admin controls should be mapped into these reference modules rather than presented as a generic hero plus statistic cards.

## Photo-source inventory

The recovered profile snapshot contains 625 HTML files across 167 profiles and maps 84 unique public photo URLs to their exposing profiles. The live recroom.network homepage HTML exposes 28 unique public image assets, and all 84 known public image-page URLs responded successfully when checked against the live site. The image-page responses did not expose additional server-rendered photo URLs, so the editable feed imports the 84 profile-mapped recovered photos and preserves the 84 live page URLs in the catalog at `/home/ubuntu/live_reference_catalog.json` for future enrichment.

## Live image-page discovery method

A bounded live discovery pass checked the public `robots.txt`, `sitemap.xml`, and `www.recroom.network/sitemap.xml` endpoints for `/image/{id}` URLs. `robots.txt` returned successfully but contained no image-page IDs; both sitemap URLs returned 404 responses and no image IDs. Therefore, the live discovery pass found **0 new image-page IDs beyond the 84 snapshot-derived public image pages**. This negative result is recorded separately in `/home/ubuntu/live_image_discovery.json` rather than being conflated with the recovered-photo count.

A second live discovery pass checked the public `/rooms`, `/news`, `/events`, `/creator`, `/download`, and `/shop` pages. All six pages were requested and produced **0 new `/image/{id}` URLs** beyond the 84 snapshot-derived IDs. Public live discovery is therefore exhausted across the checked index, linked content, robots, and sitemap sources; the remaining photo scope is limited to the 84 recovered public photos plus the 28 live homepage image assets.
