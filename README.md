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

GitHub Pages is **static** — it cannot run yt-dlp.

When you click **Download**:

1. If you set a **custom Cobalt API** in About → it tries that first
2. Otherwise it opens **[cobalt.tools](https://cobalt.tools)** with your URL already filled in (auto-starts the download)

This is the only reliable way without hosting your own backend.

## Structure

```
├── index.html             # GitHub Pages entry (Kira Tools UI)
├── ytdl_ultra.py          # Python CLI (most reliable offline)
├── CSS/style.css
└── JS/app.js
```

## Python CLI (best for real downloads)

```bash
python ytdl_ultra.py
```

**Requirements:** Python 3, FFmpeg, Deno/Node/Bun.  
Packages auto-install (`yt-dlp`, `colorama`, `mutagen`).

## Tips

- Default theme is **light**. Use the sun/moon button for dark mode.
- For fully in-app downloads, host your own Cobalt instance (free on Railway) and paste the API URL in **About**.

## License

For personal / educational use. Respect platform Terms of Service and copyright laws.
