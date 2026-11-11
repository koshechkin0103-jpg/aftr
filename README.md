# AFTR — clothing for the after-hours

Concept site for a unisex clothing brand. The whole home page is built: blocks 01–07.

- **01 Hero.** A full-screen video plays frame by frame as you scroll. The AFTR® logo exits forward in 3D (it grows, sinks and blurs).
- **02 Manifesto.** The same video folds into a window in the centre. The heading, the margin notes and the statement *Cut slow / Worn hard / Made to last* appear in sequence. The statement types in word by word.

Everything is driven by scroll position. Scrolling back replays the animation in reverse.

## Stack
Static HTML, CSS and JS, with no build step. The video scrub uses a WebCodecs frame bank (mp4box.js) when the browser supports it, and falls back to scrubbing the `<video>` element.

## Fonts
Anton, Geist, Geist Mono and Pinyon Script from Google Fonts. All four are SIL OFL, so they are free for commercial use.

## Run locally
```
python -m http.server 5180
```

## Video
`assets/hero-1080.mp4` (desktop) and `assets/hero-720.mp4` (phones) are a placeholder clip. They are encoded with a keyframe every 4 frames so seeking stays smooth while scrolling:
```
ffmpeg -i source.mp4 -an -c:v libx264 -crf 23 -g 4 -keyint_min 4 -bf 0 -movflags +faststart assets/hero-1080.mp4
ffmpeg -i source.mp4 -an -vf scale=1280:-2 -c:v libx264 -crf 24 -g 4 -keyint_min 4 -bf 0 -movflags +faststart assets/hero-720.mp4
```
To replace the video, re-encode the new clip with the same commands and swap the files.

## Block 03 — Shop the Look
`shop-look.js` / `shop-look.css` define the `<look-runway>` element. On desktop the looks stand on a 3D ring; on phones they walk along a diagonal line. Looks change every 5 s, by dragging, with the arrows or with the keys. The front model opens a "View look" popup with numbered pins. The "In this look" panel has size pickers (a bottom sheet on phones), "Add full look to bag" and a local styling bag (localStorage).

The models and product photos are placeholders from the reference. To swap them, edit `LOOKS` and `PRODUCTS` at the top of `shop-look.js`. Bottoms have no product photo yet, so their thumbnails are a crop of the model's legs.

## Block 04 — Her Things
`her-things.css` / `her-things.js`. These are the six pieces the girl wears in the film, laid out in the asymmetric Figma grid. Desktop positions are the Figma 1440 px values in `cqw`, so the grid scales as one piece; phones get a two-column flow. Each photo is 20% wider than its frame and drifts sideways as the frame scrolls through the viewport, like the photos on cyphr.studio. Photos in the left half of the screen move right; the right half, including Clear Tote, moves left. The direction is set by `data-drift="right|left"` in the HTML. The photos in `assets/her/` are low-res placeholders cut from the moodboard.

## Block 05 — Collections ("Three Chapters")
`chapters.css` / `chapters.js`. The block is pinned for two screens of scroll. It reuses the split reveal from meermohsin.me ("Awards & Recognizations"): the closed block is drawn twice, and each copy is clipped to one half of the screen. As you scroll, the halves slide apart, the dark wash clears to a red glow, CHAPTERS fades to half-transparent red, and three chapter cards rise up behind the split. On phones the cards stack on top of one another. The card photos are placeholders: the hero poster and the Her Things photos of the tote and the jeans.

**Desktop 3D scene** (`chapters-3d.js`, Three.js 0.160, loaded on demand). This is our own scene, not a copy of the reference: a dark wet platform with soft red edge lines running into the distance, dust drifting in the light, and red light pooling under the three cards. It is deliberately light: no arches and no post-processing, minified Three.js, and an automatic resolution drop if a GPU struggles. The three chapter cards stand in the scene at different depths. They are the real DOM cards, placed with CSS3DRenderer, so their text stays crisp and their links work. On desktop the block is pinned for about seven screens of scroll. The split opens with the cards already standing in place, slightly blurred (depth of field: a card sharpens to zero blur as the camera arrives). The camera flies down the tunnel and stops at Blue Hour (right, near), then Static (left, middle), then Soft Riot (far), then pulls back, and the block closes again. The scene follows the mouse a little and renders only while the block is on screen. The camera path is `KEYS` / `CARDS` in `chapters-3d.js`. It runs only at 768 px and wider, with WebGL and without reduced motion; phones and fallbacks keep the flat red glow.

## Deploying
GitHub Pages lets browsers cache files for 10 minutes. Every CSS/JS link in `index.html` carries a `?v=` stamp so a page never mixes old and new files. **Bump it on every push:**
```
V=$(date +%Y%m%d%H%M); sed -i -E "s#\.(css|js)\?v=[0-9]+#.\1?v=$V#g" index.html
```

## Blocks 06–07 — Next drop + Footer
`end.css` / `end.js`.
- **06 Next drop.** The newsletter block from Figma ("[ Drop 02 ]" and the "12.12" in red). The form checks the email and shows an error or a joined state, but **nothing is sent yet**: no mailing service is connected.
- **07 Footer.** Tagline, Shop / Help / Follow links, and a legal row with a live local clock and "Back to top". A giant AFTR® wordmark bleeds off the bottom edge and rises into place as the footer scrolls in. The fixed nav steps aside over the footer, which has its own links.
