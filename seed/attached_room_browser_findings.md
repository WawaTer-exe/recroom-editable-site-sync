# Attached room browser findings

## AnEveningStroll

The rendered public page exposes the room title `AnEveningStroll`, creator `Kuriixxa`, description `Set on a chilly evening, explore and become immerse in this recreation of the Victorian London and its architectural gothic buildings! ~New Ink ~`, cheer count `2,393`, room visits `39.0k`, published date `October 01 2023`, capacity `40`, platform `VR`, and tags `art`, `octrrmonthly`, `limitsv2`, `screen`, `walkvr`, `teleportvr`, `junior`, and `pickup`.

The visible cover image is `https://img.recroom.network/ebuazqsp0quugmduwxhzerh38?width=1920`. The page exposes a public room-photo feed, including the lead photo `https://img.recroom.network/2dzetetqjsy7s7vz0b72sg2i6?width=1920` and many thumbnail URLs such as `https://img.recroom.network/2dzetetqjsy7s7vz0b72sg2i6?width=512`. It also exposes public participant accounts including `Default`, `ChubbyOtter`, `rosendom`, and `BakaOnTop`; these can be considered for account expansion only when they are publicly reachable and deduplicated against the existing profile seed.

The direct HTTP fetch returns the Next.js app shell before client rendering, so bulk extraction must use rendered browser captures or the site's public data calls rather than relying only on raw HTML.

## Rendered-page extraction note

A rendered browser pass exposes the complete image inventory. AnEveningStroll showed a cover, one lead 1920px photo, and a large public thumbnail feed with dozens of 512px `img.recroom.network` URLs. The rendered page also exposed creator and participant usernames. Browser-console extraction confirmed the image URLs are present in the live DOM after hydration, while raw `requests` HTML contains only the app shell and no image URLs. The collector therefore needs a rendered-browser or equivalent public-data strategy for broad coverage.
