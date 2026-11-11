# AFTR — clothing for the after-hours

Concept site for a unisex clothing brand. Built so far: blocks 01–04 of the home page.

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
`her-things.css` / `her-things.js`. These are the six pieces the girl wears in the film, laid out in the asymmetric Figma grid. Desktop positions are the Figma 1440 px values in `cqw`, so the grid scales as one piece; phones get a two-column flow. Each photo is 20% wider than its frame and drifts right to left as the frame scrolls through the viewport, like the photos on cyphr.studio. The photos in `assets/her/` are low-res placeholders cut from the moodboard.
