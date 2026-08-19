# Kira-Test

Testing Repos .. and you can add more

## About

- **YTDL ULTRA** – Python CLI tool for downloading from YouTube, SoundCloud, Spotify (+ web UI).
- Web frontend styled like **The Broken List**, with platform options:
  - YouTube
  - SoundCloud
  - Spotify
  - **TikTok** (NEW)
  - **Discord** (NEW – avatar/PFP download + user info)

**Live site:** https://ziyyhhk.github.io/Kira-Test/

## Structure

```
├── index.html             # GitHub Pages entry
├── ytdl_ultra.py          # Original Python CLI script
├── CSS/style.css
├── JS/app.js
└── HTML/index.html        # (legacy copy)
```

## Python Script (CLI)

```bash
python ytdl_ultra.py
```

**Requirements:** Python 3, FFmpeg, Deno/Node/Bun, packages auto-installed (`yt-dlp`, `colorama`, `mutagen`).

## Web Version

Frontend demo only. Real downloads need the Python script or a backend with yt-dlp.

Discord mode: paste a User ID or profile URL → shows avatar + basic info, with download/copy actions.

## License

For personal / educational use. Respect platform Terms of Service and copyright laws.
