# Public rooms source findings

The public rooms route is `https://recroom.network/rooms` (the trailing slash redirects). The page title is “Rooms in Rec Room” and the visible section is “Rooms Hot List.” The browser-rendered page loads many public `img.recroom.network` image resources, including room-card imagery and profile thumbnails, even though the initial server-rendered view shows skeleton cards. The extracted resource list is preserved at `/home/ubuntu/console_outputs/exec_result_2026-08-20_16-34-07_822.txt` for downstream normalization.
