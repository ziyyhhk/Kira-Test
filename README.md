# Kira-Test

Testing Repos .. and you can add more

## About

This repository contains:

- **YTDL ULTRA** – a powerful Python CLI tool for downloading from YouTube, SoundCloud, and Spotify (as audio/video).
- A **web frontend** recreation of the tool (UI only – full downloads still require the Python script or a backend).

## Structure

```
├── ytdl_ultra.py          # Original Python CLI script
├── HTML/
│   └── index.html         # Web UI
├── CSS/
│   └── style.css          # Styles
└── JS/
    └── app.js             # Frontend logic
```

## Python Script (CLI)

Run the original tool:

```bash
python ytdl_ultra.py
```

**Requirements:**
- Python 3
- FFmpeg
- Deno / Node / Bun (for YouTube JS challenges)
- Packages auto-installed by the script: `yt-dlp`, `colorama`, `mutagen`

## Web Version

Open `HTML/index.html` in a browser (or serve the folder).

The web UI recreates the look & flow of the CLI (banner, URL input, format/quality selection, progress simulation).

> **Note:** Actual downloading is not possible purely client-side (yt-dlp requires a Python backend). This is a frontend recreation for demo / future expansion.

## License

For personal / educational use. Respect platform Terms of Service and copyright laws.
