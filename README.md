# Kira-Test

**Kira Tools** – web frontend + Python CLI downloader.

## Platforms

- YouTube
- SoundCloud
- Spotify
- TikTok
- Discord (avatar / PFP + user info)

Styled like The Broken List (green theme, light/dark mode).

**Live site:** https://ziyyhhk.github.io/Kira-Test/

## How downloads work (web)

GitHub Pages is **static** — it cannot run yt-dlp itself.

When you click **Download** the site now:

1. Tries **your custom Cobalt API** (if you set one in the About page)
2. Tries several **public community Cobalt instances**
3. If all fail → opens [cobalt.tools](https://cobalt.tools/) and copies your URL to clipboard

For the most reliable in-app experience, host your own free Cobalt instance (Railway, VPS, etc.) and paste the API URL in **About → Your Cobalt API**.

## Structure

```
├── index.html             # GitHub Pages entry (Kira Tools UI)
├── ytdl_ultra.py          # Python CLI (most reliable)
├── CSS/style.css
└── JS/app.js
```

## Python CLI (recommended for real downloads)

```bash
python ytdl_ultra.py
```

**Requirements:**
- Python 3
- FFmpeg (in PATH)
- Deno / Node / Bun (for YouTube JS challenges)

Packages auto-install (`yt-dlp`, `colorama`, `mutagen`). The script now detects Deno portably (no hardcoded Windows path).

## Web version notes

- Default theme is **light**. Use the sun/moon button for dark mode.
- Real video/audio files come from Cobalt (or the Python script).
- Discord only downloads the **default** avatar (custom PFPs need a bot token).

## License

For personal / educational use. Respect platform Terms of Service and copyright laws.
