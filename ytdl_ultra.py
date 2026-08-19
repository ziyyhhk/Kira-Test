#!/usr/bin/env python3
import subprocess
import sys
import os
import platform
import shutil
import urllib.request
import re

# ── 1. AUTO-DEPENDENCY INSTALLER ──
def install_dependencies():
    """Installs required Python packages if they are missing, and always
    upgrades yt-dlp itself to the latest pre-release (nightly) when possible.
    YouTube changes how it serves video frequently, and an outdated yt-dlp
    is the #1 cause of 'HTTP Error 403: Forbidden'."""
    print("[*] Checking for yt-dlp updates (preferring nightly/pre-release)...")
    try:
        # Prefer pre-release (nightly) – this is what currently fixes most 403s
        subprocess.check_call(
            [sys.executable, "-m", "pip", "install", "--upgrade", "--pre", "yt-dlp[default]", "--quiet"]
        )
    except subprocess.CalledProcessError:
        try:
            subprocess.check_call(
                [sys.executable, "-m", "pip", "install", "--upgrade", "yt-dlp", "--quiet"]
            )
        except subprocess.CalledProcessError:
            print("[!] Could not upgrade yt-dlp automatically. If downloads fail with a")
            print(" 403 error, run: pip install -U --pre \"yt-dlp[default]\"")

    # mutagen is required by yt-dlp's EmbedThumbnail postprocessor for clean MP3 tagging
    dependencies = ["colorama", "mutagen"]
    for pkg in dependencies:
        try:
            module_name = pkg.replace("-", "_")
            __import__(module_name)
        except ImportError:
            print(f"[*] Installing missing dependency: {pkg}...")
            try:
                subprocess.check_call([sys.executable, "-m", "pip", "install", pkg, "--quiet"])
            except subprocess.CalledProcessError:
                print(f"[!] Failed to install {pkg}. Please install it manually.")
                sys.exit(1)

# Run dependency check before importing
install_dependencies()

import yt_dlp
from colorama import init, Fore, Style

# Initialize colorama for cross-platform color support
init(autoreset=True)

WIDTH = 54

# Hardcoded Deno path from your machine (from "where deno")
DENO_PATH = r"C:\Users\USER\.deno\bin\deno.exe"

# ── 2. SYSTEM UTILITIES ──
def disable_quickedit():
    """Disable Windows QuickEdit so clicking the terminal doesn't pause the download."""
    if os.name != "nt":
        return
    try:
        import ctypes
        import ctypes.wintypes
        kernel32 = ctypes.windll.kernel32
        handle = kernel32.GetStdHandle(-10)  # STD_INPUT_HANDLE
        mode = ctypes.wintypes.DWORD()
        kernel32.GetConsoleMode(handle, ctypes.byref(mode))
        mode.value &= ~0x0040  # ENABLE_QUICK_EDIT_MODE
        mode.value &= ~0x0020  # ENABLE_INSERT_MODE
        kernel32.SetConsoleMode(handle, mode)
    except Exception:
        pass

def clear():
    os.system("cls" if os.name == "nt" else "clear")

def banner():
    print(Fore.MAGENTA + Style.BRIGHT + " ┏" + "━" * WIDTH + "┓")
    print(Fore.MAGENTA + Style.BRIGHT + " ┃" + Fore.CYAN + Style.BRIGHT + "Y T D L U L T R A".center(WIDTH) + Fore.MAGENTA + Style.BRIGHT + "┃")
    print(Fore.MAGENTA + Style.BRIGHT + " ┃" + Fore.WHITE + "YouTube · SoundCloud · Spotify -> MP4 / MP3".center(WIDTH) + Fore.MAGENTA + Style.BRIGHT + "┃")
    print(Fore.MAGENTA + Style.BRIGHT + " ┗" + "━" * WIDTH + "┛")
    print(Fore.LIGHTBLACK_EX + f" yt-dlp {yt_dlp.version.__version__}")

def check_ffmpeg():
    """Checks if FFmpeg is installed, as it's required for merging, audio extraction,
    and thumbnail conversion/embedding."""
    try:
        subprocess.run(
            ["ffmpeg", "-version"],
            stdout=subprocess.DEVNULL,
            stderr=subprocess.DEVNULL,
            check=True,
        )
        return True
    except (FileNotFoundError, subprocess.CalledProcessError):
        print(Fore.YELLOW + Style.BRIGHT + "\n [!] FFmpeg is not installed or not in PATH.")
        print(Fore.YELLOW + " MP3 conversion, MP4 merging, and thumbnail embedding will fail.")
        print(Fore.WHITE + " Windows : winget install ffmpeg")
        print(Fore.WHITE + " Mac : brew install ffmpeg")
        print(Fore.WHITE + " Linux : sudo apt install ffmpeg\n")
        return False

def check_js_runtime():
    """YouTube requires yt-dlp to run a JS 'challenge solver'.
    We hardcode your Deno path because PATH is broken for this Python process."""
    if os.path.isfile(DENO_PATH):
        print(Fore.GREEN + f" [OK] Deno found at hardcoded path: {DENO_PATH}")
        return True
    for runtime in ("deno", "node", "bun"):
        path = shutil.which(runtime)
        if path:
            print(Fore.GREEN + f" [OK] JS runtime found: {runtime} → {path}")
            return True
    print(Fore.YELLOW + Style.BRIGHT + "\n [!] No JavaScript runtime (deno/node/bun) found.")
    print(Fore.YELLOW + " Expected Deno at: " + DENO_PATH)
    print(Fore.YELLOW + " YouTube requires one to unlock most video formats.")
    print(Fore.WHITE + " Deno is what yt-dlp looks for by default.\n")
    system = platform.system()
    if system not in ("Windows", "Darwin", "Linux"):
        print(Fore.YELLOW + " Install manually: https://docs.deno.com/runtime/getting_started/installation/\n")
        return False
    try:
        choice = input(Fore.GREEN + Style.BRIGHT + " Install Deno now? (y/n): " + Style.RESET_ALL).strip().lower()
    except KeyboardInterrupt:
        print()
        return False
    if choice != "y":
        print(Fore.YELLOW + " Skipping - video downloads may keep failing with 403 until this is installed.\n")
        return False
    print(Fore.CYAN + " Installing Deno...")
    try:
        if system == "Windows":
            try:
                subprocess.check_call(
                    "winget install -e --id DenoLand.Deno "
                    "--accept-source-agreements --accept-package-agreements",
                    shell=True,
                )
            except (subprocess.CalledProcessError, FileNotFoundError):
                print(Fore.YELLOW + " winget unavailable here - trying Deno's own installer instead...")
                subprocess.check_call(
                    'powershell -NoProfile -ExecutionPolicy Bypass -Command '
                    '"irm https://deno.land/install.ps1 | iex"',
                    shell=True,
                )
        elif system == "Darwin":
            subprocess.check_call(["brew", "install", "deno"])
        else:
            subprocess.check_call("curl -fsSL https://deno.land/install.sh | sh", shell=True)
        print(Fore.GREEN + Style.BRIGHT + " [OK] Installed. Close and reopen this terminal, then run the")
        print(Fore.GREEN + Style.BRIGHT + " script again so your PATH picks up the new install.\n")
    except (subprocess.CalledProcessError, FileNotFoundError) as e:
        print(Fore.RED + f" [!] Auto-install failed ({e}). Install manually - either works:")
        print(Fore.WHITE + " winget install DenoLand.Deno")
        print(Fore.WHITE + " or in PowerShell: irm https://deno.land/install.ps1 | iex\n")
    return False

# ── 3. PLATFORM INTEGRATIONS ──
def convert_spotify_to_ytsearch(url):
    """Scrapes Spotify for the track name and converts it into a YouTube search query."""
    print(Fore.YELLOW + " Scraping Spotify metadata...")
    req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'})
    try:
        html = urllib.request.urlopen(req).read().decode('utf-8')
        title_match = re.search(r'<title>(.*?)</title>', html, re.IGNORECASE)
        if title_match:
            raw_title = title_match.group(1)
            clean_title = re.sub(r' - song( and lyrics)? by ', ' ', raw_title)
            clean_title = clean_title.replace(' | Spotify', '').strip()
            print(Fore.GREEN + f" [+] Found track: {clean_title}")
            return f"ytsearch1:{clean_title} audio"
        else:
            print(Fore.RED + " [!] Could not find title metadata on the Spotify page.")
            return None
    except Exception as e:
        print(Fore.RED + f" [!] Failed to parse Spotify link: {e}")
        return None

# ── 4. VIDEO / AUDIO PROCESSING ──
def get_js_runtimes():
    """Return js_runtimes dict with explicit path so PATH problems never matter."""
    if os.path.isfile(DENO_PATH):
        return {"deno": {"path": DENO_PATH}}
    return {"deno": {}}

def get_video_info(url):
    opts = {
        "quiet": True,
        "no_warnings": True,
        "skip_download": True,
        "noplaylist": True,
        "format": "bestvideo+bestaudio/best",
        "writethumbnail": False,
        "writeinfojson": False,
        # Clients that currently avoid SABR-only 360p trap
        "extractor_args": {
            "youtube": {
                "player_client": ["tv", "tv_downgraded", "web_embedded", "mweb", "android"],
            }
        },
        "js_runtimes": get_js_runtimes(),
    }
    try:
        with yt_dlp.YoutubeDL(opts) as ydl:
            return ydl.extract_info(url, download=False)
    except yt_dlp.utils.DownloadError as e:
        print(Fore.RED + f"\n [!] Could not fetch info: {e}\n")
        return None

def fmt_size(bytes_val):
    if bytes_val is None:
        return "?"
    for unit in ("B", "KB", "MB", "GB"):
        if bytes_val < 1024:
            return f"{bytes_val:.1f} {unit}"
        bytes_val /= 1024
    return f"{bytes_val:.1f} TB"

def tier_color(height):
    if height >= 1080:
        return Fore.GREEN
    if height >= 480:
        return Fore.YELLOW
    return Fore.RED

def collect_mp4_formats(info):
    formats = info.get("formats", [])
    seen_res = {}
    for f in formats:
        ext = f.get("ext", "")
        vcodec = f.get("vcodec", "none")
        acodec = f.get("acodec", "none")
        height = f.get("height") or 0
        if vcodec in ("none", None) or height == 0:
            continue
        if ext not in ("mp4", "webm", "m4v") and "avc" not in str(vcodec) and "vp" not in str(vcodec) and "av01" not in str(vcodec):
            continue
        label = f"{height}p"
        fps = f.get("fps")
        if fps and fps > 30:
            label += f" {int(fps)}fps"
        has_audio = acodec not in ("none", None)
        label += " [audio]" if has_audio else " [video only, audio merged]"
        # Keep the highest quality entry for each resolution
        if height not in seen_res or (f.get("filesize") or 0) > (seen_res[height].get("filesize") or 0):
            seen_res[height] = {
                "format_id": f["format_id"],
                "label": label,
                "height": height,
                "has_audio": has_audio,
                "filesize": f.get("filesize") or f.get("filesize_approx"),
                "color": tier_color(height),
            }
    sorted_res = sorted(seen_res.values(), key=lambda x: x["height"], reverse=True)
    best = {
        "format_id": "bestvideo*+bestaudio/best",
        "label": "Best Available (Auto)",
        "height": 9999,
        "has_audio": True,
        "filesize": None,
        "color": Fore.CYAN + Style.BRIGHT,
    }
    return [best] + sorted_res

def collect_mp3_qualities():
    return [
        {"label": "320 kbps (Highest)", "quality": "0", "color": Fore.GREEN},
        {"label": "256 kbps (High)", "quality": "2", "color": Fore.CYAN},
        {"label": "192 kbps (Standard)", "quality": "4", "color": Fore.YELLOW},
        {"label": "128 kbps (Basic)", "quality": "6", "color": Fore.RED},
    ]

# ── 5. USER INPUT ──
def choose_format_type():
    print(Fore.CYAN + Style.BRIGHT + "\n Format:")
    print(Fore.WHITE + " [1] MP4 - Video + Audio")
    print(Fore.WHITE + " [2] MP3 - Audio Only")
    while True:
        choice = input(Fore.GREEN + "\n > " + Style.RESET_ALL).strip()
        if choice in ("1", "2"):
            return "mp4" if choice == "1" else "mp3"
        print(Fore.RED + " Please enter 1 or 2")

def choose_quality(options):
    print(Fore.CYAN + Style.BRIGHT + "\n Quality:\n")
    for i, opt in enumerate(options, 1):
        size_str = f" ~{fmt_size(opt.get('filesize'))}" if opt.get("filesize") else ""
        color = opt.get("color", Fore.WHITE)
        print(f" {color}[{i}] {opt['label']}{size_str}")
    while True:
        raw = input(Fore.GREEN + "\n > " + Style.RESET_ALL).strip()
        if raw.isdigit() and 1 <= int(raw) <= len(options):
            return options[int(raw) - 1]
        print(Fore.RED + f" Please enter a number from 1 to {len(options)}")

def choose_output_dir():
    default = os.path.join(os.path.expanduser("~"), "Downloads")
    raw = input(Fore.CYAN + f"\n Save to [{default}]: " + Style.RESET_ALL).strip()
    folder = raw if raw else default
    os.makedirs(folder, exist_ok=True)
    return folder

# ── 6. DOWNLOADING ──
def progress_hook(d):
    if d["status"] == "downloading":
        downloaded = d.get("downloaded_bytes", 0)
        total = d.get("total_bytes") or d.get("total_bytes_estimate", 0)
        speed = d.get("speed") or 0
        eta = d.get("eta") or 0
        pct = (downloaded / total * 100) if total else 0
        filled = int(30 * pct / 100)
        bar_color = Fore.RED if pct < 33 else Fore.YELLOW if pct < 66 else Fore.GREEN
        bar = "█" * filled + "░" * (30 - filled)
        speed_str = f"{fmt_size(speed)}/s" if speed else "--"
        eta_str = f"{int(eta)}s" if eta else "--"
        sys.stdout.write(
            f"\r [{bar_color}{bar}{Style.RESET_ALL}] {pct:5.1f}% "
            f"{Fore.CYAN}{speed_str}{Style.RESET_ALL} ETA {eta_str} "
        )
        sys.stdout.flush()
    elif d["status"] == "finished":
        print(Fore.CYAN + "\n Done downloading. Merging... please wait.")

def _common_ydl_opts(out_dir):
    """Shared options that fight the current 403 / SABR / filename issues."""
    return {
        # Sanitize filenames so apostrophes / special chars don't break post-processing
        "outtmpl": os.path.join(out_dir, "%(title).200B [%(id)s].%(ext)s"),
        "restrictfilenames": False,
        "windowsfilenames": True,  # critical on Windows
        "progress_hooks": [progress_hook],
        "quiet": True,
        "no_warnings": False,
        "noplaylist": True,
        "writethumbnail": False,  # disabled – was breaking on webp + apostrophe
        # Force JS runtime with explicit path + clients that avoid SABR 360p trap
        "js_runtimes": get_js_runtimes(),
        "extractor_args": {
            "youtube": {
                "player_client": ["tv", "tv_downgraded", "web_embedded", "mweb", "android"],
            }
        },
        "http_headers": {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
        },
    }

def download_mp4(url, fmt, out_dir):
    fmt_id = fmt["format_id"]
    if not fmt.get("has_audio", True) and "+" not in fmt_id and "best" not in fmt_id:
        fmt_id = f"{fmt_id}+bestaudio[ext=m4a]/bestaudio"
    opts = _common_ydl_opts(out_dir)
    opts.update({
        "format": fmt_id,
        "merge_output_format": "mp4",
        "postprocessors": [],
    })
    with yt_dlp.YoutubeDL(opts) as ydl:
        ydl.download([url])

def download_mp3(url, quality, out_dir):
    opts = _common_ydl_opts(out_dir)
    opts.update({
        "format": "bestaudio/best",
        "postprocessors": [
            {"key": "FFmpegExtractAudio", "preferredcodec": "mp3", "preferredquality": quality["quality"]},
        ],
    })
    with yt_dlp.YoutubeDL(opts) as ydl:
        ydl.download([url])

# ── 7. MAIN LOOP ──
def main():
    disable_quickedit()
    clear()
    banner()
    check_ffmpeg()
    check_js_runtime()

    while True:
        print()
        try:
            url = input(Fore.CYAN + Style.BRIGHT + " URL (YouTube / SoundCloud / Spotify) or 'q' to quit: " + Style.RESET_ALL).strip()
        except KeyboardInterrupt:
            print(Fore.GREEN + "\n\n Goodbye!\n")
            break

        if url.lower() in ("q", "quit", "exit"):
            print(Fore.GREEN + "\n Goodbye!\n")
            break

        if not url:
            continue

        is_spotify = "spotify.com" in url.lower()
        is_soundcloud = "soundcloud.com" in url.lower()
        is_youtube = "youtube.com" in url.lower() or "youtu.be" in url.lower()

        if is_youtube:
            source_name = "YouTube"
        elif is_soundcloud:
            source_name = "SoundCloud"
        elif is_spotify:
            source_name = "Spotify"
        else:
            print(Fore.RED + " [!] Not a recognized URL. Please provide a YouTube, SoundCloud, or Spotify link.")
            continue

        # If it's a Spotify link, convert it to a YouTube search query
        if is_spotify:
            search_query = convert_spotify_to_ytsearch(url)
            if not search_query:
                continue
            url = search_query

        print(Fore.YELLOW + "\n Fetching info...")
        info = get_video_info(url)
        if info is None:
            continue

        # If the result is a playlist (which happens when we use ytsearch for Spotify)
        if info.get("_type") == "playlist" or "entries" in info:
            if not info.get("entries"):
                print(Fore.RED + " [!] No matching track found.")
                continue
            info = info["entries"][0]  # Grab the first (best) match

        title = info.get("title", "Unknown")
        duration = info.get("duration", 0)
        uploader = info.get("uploader", "Unknown")
        mins, secs = divmod(int(duration or 0), 60)

        print(Fore.WHITE + Style.BRIGHT + f"\n Title : {title}")
        print(Fore.WHITE + f" Source : {source_name}")
        print(Fore.WHITE + f" Channel : {uploader}")
        print(Fore.WHITE + f" Duration : {mins}m {secs:02d}s")

        # Auto-lock to MP3 if the user inputs SoundCloud or Spotify
        if is_soundcloud or is_spotify:
            print(Fore.CYAN + "\n [*] Music source detected. Auto-selecting MP3 format.")
            fmt_type = "mp3"
        else:
            fmt_type = choose_format_type()

        try:
            out_dir = choose_output_dir()
        except KeyboardInterrupt:
            print(Fore.YELLOW + "\n\n Cancelled by user.\n")
            continue

        try:
            if fmt_type == "mp4":
                formats = collect_mp4_formats(info)
                if not formats:
                    print(Fore.RED + " [!] No downloadable video formats found.")
                    continue
                chosen = choose_quality(formats)
                print(Fore.YELLOW + f"\n Downloading MP4 [{chosen['label']}]...\n")
                download_mp4(url, chosen, out_dir)
            else:
                qualities = collect_mp3_qualities()
                chosen = choose_quality(qualities)
                print(Fore.YELLOW + f"\n Downloading MP3 [{chosen['label']}]...\n")
                download_mp3(url, chosen, out_dir)

            print(Fore.GREEN + Style.BRIGHT + f"\n Saved to: {out_dir}\n")

        except yt_dlp.utils.DownloadError as e:
            print(Fore.RED + Style.BRIGHT + f"\n [!] Download failed: {e}\n")
            if "403" in str(e):
                print(Fore.YELLOW + " Still getting 403 even with Deno?")
                print(Fore.YELLOW + " 1. Close this terminal completely and open a new one")
                print(Fore.YELLOW + " 2. Force nightly: pip install -U --pre \"yt-dlp[default]\"")
                print(Fore.YELLOW + " 3. Make sure the Deno path in the script matches 'where deno'")
                print(Fore.YELLOW + " 4. Try again – YouTube blocks change daily.\n")
        except KeyboardInterrupt:
            print(Fore.YELLOW + "\n\n Cancelled by user.\n")

        print(Fore.MAGENTA + " " + "─" * WIDTH)

        try:
            again = input(" Download another? (y/n): ").strip().lower()
        except KeyboardInterrupt:
            print(Fore.GREEN + "\n\n Goodbye!\n")
            break

        if again != "y":
            print(Fore.GREEN + "\n Goodbye!\n")
            break

        clear()
        banner()

if __name__ == "__main__":
    main()
