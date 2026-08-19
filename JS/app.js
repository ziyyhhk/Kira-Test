/**
 * Kira Tools – Web Frontend
 * Real downloads via public Cobalt API instances (community).
 * Invalid URLs are rejected. Discord is avatar-only (no full API without a bot).
 */

const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => document.querySelectorAll(sel);

const stepUrl = $('#step-url');
const stepInfo = $('#step-info');
const stepProgress = $('#step-progress');
const urlInput = $('#url-input');
const urlLabel = $('#url-label');
const urlHint = $('#url-hint');
const btnFetch = $('#btn-fetch');
const urlError = $('#url-error');
const videoTitle = $('#video-title');
const videoSource = $('#video-source');
const videoChannel = $('#video-channel');
const videoDuration = $('#video-duration');
const qualityList = $('#quality-list');
const formatSection = $('#format-section');
const discordActions = $('#discord-actions');
const discordAvatarWrap = $('#discord-avatar-wrap');
const discordAvatar = $('#discord-avatar');
const discordExtra = $('#discord-extra');
const thumbWrap = $('#thumb-wrap');
const mediaThumb = $('#media-thumb');
const thumbPlaceholder = $('#thumb-placeholder');
const btnDownload = $('#btn-download');
const btnBack = $('#btn-back');
const btnDlAvatar = $('#btn-dl-avatar');
const btnCopyInfo = $('#btn-copy-info');
const progressBar = $('#progress-bar');
const progressText = $('#progress-text');
const progressTitle = $('#progress-title');
const progressNote = $('#progress-note');
const btnAgain = $('#btn-again');
const themeToggle = $('#theme-toggle');
const themeVeil = $('#theme-veil');

let currentPlatform = 'youtube';
let currentInfo = null;
let selectedQuality = null;
let lockedFormat = null;

/* Community Cobalt instances (try in order). Official api.cobalt.tools blocks third-party use. */
const COBALT_APIS = [
  'https://cobaltapi.cjs.nz/',
  'https://api.qwkuns.me/',
  'https://cobalt-api.lamps-dev.dev/',
  'https://apicobalt.mgytr.top/',
  'https://cobaltapi.squair.xyz/',
];

const PLATFORM_LABELS = {
  youtube: { title: 'Paste YouTube URL', hint: 'Video or short link works' },
  soundcloud: { title: 'Paste SoundCloud URL', hint: 'Track link – audio only (MP3)' },
  spotify: { title: 'Paste Spotify URL', hint: 'Track link – audio only (MP3)' },
  tiktok: { title: 'Paste TikTok URL', hint: 'Video link – MP4 only' },
  discord: { title: 'Paste Discord User ID or Profile URL', hint: 'User ID or discord.com/users/... – avatar only' },
};

const MOCK_QUALITIES_MP4 = [
  { label: 'Best Available (Auto)', value: 'max' },
  { label: '1080p', value: '1080' },
  { label: '720p', value: '720' },
  { label: '480p', value: '480' },
  { label: '360p', value: '360' },
];

const MOCK_QUALITIES_MP3 = [
  { label: '320 kbps (Highest)', value: '320' },
  { label: '256 kbps (High)', value: '256' },
  { label: '192 kbps (Standard)', value: '128' },
  { label: '128 kbps (Basic)', value: '128' },
];

const MOCK_TIKTOK = [
  { label: 'Best Available', value: 'max' },
  { label: 'No Watermark', value: 'max' },
  { label: 'With Watermark', value: 'max' },
];

function initTheme() {
  const saved = localStorage.getItem('kira-theme');
  if (saved === 'dark') document.body.classList.add('dark');
  else document.body.classList.remove('dark');
}

themeToggle.addEventListener('click', () => {
  themeVeil.classList.add('theme-veil--in');
  setTimeout(() => {
    document.body.classList.toggle('dark');
    localStorage.setItem('kira-theme', document.body.classList.contains('dark') ? 'dark' : 'light');
    themeVeil.classList.remove('theme-veil--in');
  }, 180);
});

$$('.nav-link').forEach((btn) => {
  btn.addEventListener('click', () => {
    $$('.nav-link').forEach((b) => b.classList.remove('active'));
    btn.classList.add('active');
    $$('.page').forEach((p) => p.classList.remove('active'));
    $(`#page-${btn.dataset.page}`).classList.add('active');
  });
});

$$('.platform-card').forEach((card) => {
  card.addEventListener('click', () => {
    $$('.platform-card').forEach((c) => c.classList.remove('selected'));
    card.classList.add('selected');
    currentPlatform = card.dataset.platform;
    const meta = PLATFORM_LABELS[currentPlatform];
    urlLabel.textContent = meta.title;
    urlHint.textContent = meta.hint;
    urlInput.value = '';
    urlError.classList.add('hidden');
    showStep(stepUrl);
  });
});

function showStep(step) {
  $$('.step').forEach((s) => s.classList.remove('active'));
  step.classList.add('active');
}

function detectSourceFromUrl(url) {
  const u = url.toLowerCase();
  if (u.includes('youtube.com') || u.includes('youtu.be')) return 'youtube';
  if (u.includes('soundcloud.com')) return 'soundcloud';
  if (u.includes('spotify.com')) return 'spotify';
  if (u.includes('tiktok.com') || u.includes('vm.tiktok.com')) return 'tiktok';
  if (u.includes('discord.com') || /^\d{17,20}$/.test(url.trim())) return 'discord';
  return null;
}

/** Strict validation – reject garbage URLs */
function validateUrl(url, platform) {
  if (!url || url.length < 8) return 'URL is too short or empty.';

  // Must look like a URL (except bare Discord snowflake)
  if (platform !== 'discord' || !/^\d{17,20}$/.test(url.trim())) {
    try {
      const u = new URL(url.startsWith('http') ? url : 'https://' + url);
      if (!['http:', 'https:'].includes(u.protocol)) return 'URL must start with http:// or https://';
    } catch {
      return 'Invalid URL format. Paste a full link.';
    }
  }

  const detected = detectSourceFromUrl(url);
  if (!detected) {
    return 'Not a supported link. Use YouTube, SoundCloud, Spotify, TikTok, or Discord.';
  }
  if (detected !== platform) {
    return `This looks like a ${detected} link. Select the ${detected} platform (or paste again to auto-switch).`;
  }

  if (platform === 'youtube' && !extractYouTubeId(url)) {
    return 'Could not find a YouTube video ID in that URL.';
  }

  return null; // valid
}

function extractYouTubeId(url) {
  try {
    const u = new URL(url.startsWith('http') ? url : 'https://' + url);
    if (u.hostname.includes('youtu.be')) {
      return u.pathname.slice(1).split('/')[0].split('?')[0] || null;
    }
    if (u.searchParams.get('v')) return u.searchParams.get('v');
    const shorts = u.pathname.match(/\/shorts\/([\w-]{11})/);
    if (shorts) return shorts[1];
    const embed = u.pathname.match(/\/embed\/([\w-]{11})/);
    if (embed) return embed[1];
  } catch (_) {}
  const m = url.match(/(?:v=|\/shorts\/|youtu\.be\/)([\w-]{11})/);
  return m ? m[1] : null;
}

function youtubeThumbUrl(id) {
  return `https://img.youtube.com/vi/${id}/hqdefault.jpg`;
}

function setThumbnail(url, square = false) {
  if (!url) {
    thumbWrap.classList.add('hidden');
    return;
  }
  thumbWrap.classList.remove('hidden');
  thumbWrap.classList.toggle('square', square);
  mediaThumb.classList.add('hidden');
  thumbPlaceholder.classList.remove('hidden');
  mediaThumb.onload = () => {
    mediaThumb.classList.remove('hidden');
    thumbPlaceholder.classList.add('hidden');
  };
  mediaThumb.onerror = () => {
    mediaThumb.classList.add('hidden');
    thumbPlaceholder.classList.remove('hidden');
  };
  mediaThumb.src = url;
}

function applyFormatRules(platform) {
  const formatOptions = document.querySelector('.format-options');
  const formatTitle = formatSection.querySelector('.panel-title');

  if (platform === 'soundcloud' || platform === 'spotify') {
    lockedFormat = 'mp3';
    formatOptions.classList.add('hidden');
    if (formatTitle) formatTitle.textContent = 'Format: MP3 (Audio Only)';
    $$('input[name="format"]').forEach((r) => { r.checked = r.value === 'mp3'; });
  } else if (platform === 'tiktok') {
    lockedFormat = 'mp4';
    formatOptions.classList.add('hidden');
    if (formatTitle) formatTitle.textContent = 'Format: MP4 (Video)';
    $$('input[name="format"]').forEach((r) => { r.checked = r.value === 'mp4'; });
  } else {
    lockedFormat = null;
    formatOptions.classList.remove('hidden');
    if (formatTitle) formatTitle.textContent = 'Format';
    $$('input[name="format"]').forEach((r) => { r.checked = r.value === 'mp4'; });
  }
}

btnFetch.addEventListener('click', async () => {
  let url = urlInput.value.trim();
  urlError.classList.add('hidden');

  if (!url) {
    urlError.textContent = 'Please enter a URL or ID.';
    urlError.classList.remove('hidden');
    return;
  }

  // Normalize: add https if missing
  if (!/^https?:\/\//i.test(url) && !/^\d{17,20}$/.test(url)) {
    url = 'https://' + url;
    urlInput.value = url;
  }

  // Auto-switch platform if URL clearly matches another
  const detected = detectSourceFromUrl(url);
  if (detected && detected !== currentPlatform) {
    $$('.platform-card').forEach((c) => {
      c.classList.toggle('selected', c.dataset.platform === detected);
    });
    currentPlatform = detected;
    const meta = PLATFORM_LABELS[currentPlatform];
    urlLabel.textContent = meta.title;
    urlHint.textContent = meta.hint;
  }

  const err = validateUrl(url, currentPlatform);
  if (err) {
    urlError.textContent = err;
    urlError.classList.remove('hidden');
    return;
  }

  btnFetch.disabled = true;
  btnFetch.textContent = 'Fetching...';

  try {
    if (currentPlatform === 'discord') {
      handleDiscord(url);
    } else {
      await handleMedia(url);
    }
  } catch (e) {
    urlError.textContent = e.message || 'Failed to fetch info.';
    urlError.classList.remove('hidden');
  } finally {
    btnFetch.disabled = false;
    btnFetch.textContent = 'Fetch Info';
  }
});

async function handleMedia(url) {
  let title = 'Unknown';
  let channel = '—';
  let duration = '—';
  let thumb = null;
  let square = false;

  if (currentPlatform === 'youtube') {
    const id = extractYouTubeId(url);
    if (!id) throw new Error('Invalid YouTube URL – no video ID found.');
    thumb = youtubeThumbUrl(id);
    title = `YouTube · ${id}`;
    channel = 'YouTube';
    try {
      const res = await fetch(
        `https://www.youtube.com/oembed?url=${encodeURIComponent(url)}&format=json`
      );
      if (res.ok) {
        const data = await res.json();
        if (data.title) title = data.title;
        if (data.author_name) channel = data.author_name;
        if (data.thumbnail_url) thumb = data.thumbnail_url;
      }
    } catch (_) {}
  } else if (currentPlatform === 'soundcloud') {
    title = 'SoundCloud track';
    channel = 'SoundCloud';
    duration = 'Audio';
    square = true;
  } else if (currentPlatform === 'spotify') {
    title = 'Spotify track';
    channel = 'Spotify';
    duration = 'Audio';
    square = true;
  } else if (currentPlatform === 'tiktok') {
    title = 'TikTok video';
    channel = 'TikTok';
    duration = 'Video';
  }

  currentInfo = {
    title,
    source: currentPlatform.charAt(0).toUpperCase() + currentPlatform.slice(1),
    channel,
    duration,
    url,
    platform: currentPlatform,
  };

  videoTitle.textContent = currentInfo.title;
  videoSource.textContent = currentInfo.source;
  videoChannel.textContent = currentInfo.channel;
  videoDuration.textContent = currentInfo.duration;

  if (thumb) setThumbnail(thumb, square);
  else {
    thumbWrap.classList.remove('hidden');
    thumbWrap.classList.toggle('square', square);
    mediaThumb.classList.add('hidden');
    thumbPlaceholder.classList.remove('hidden');
  }

  discordAvatarWrap.classList.add('hidden');
  discordExtra.classList.add('hidden');
  formatSection.classList.remove('hidden');
  discordActions.classList.add('hidden');
  btnDownload.classList.remove('hidden');

  applyFormatRules(currentPlatform);
  renderQualities();
  showStep(stepInfo);
}

function handleDiscord(input) {
  let userId = input.trim();
  const match = input.match(/discord\.com\/users\/(\d+)/i) || input.match(/(\d{17,20})/);
  if (match) userId = match[1];
  if (!/^\d{17,20}$/.test(userId)) {
    urlError.textContent = 'Invalid Discord user ID.';
    urlError.classList.remove('hidden');
    return;
  }

  currentInfo = {
    title: `User ${userId}`,
    source: 'Discord',
    channel: `ID: ${userId}`,
    duration: '',
    url: input,
    platform: 'discord',
    userId,
    avatarUrl: `https://cdn.discordapp.com/embed/avatars/${parseInt(userId.slice(-1), 10) % 5}.png`,
  };

  videoTitle.textContent = currentInfo.title;
  videoSource.textContent = 'Discord';
  videoChannel.textContent = currentInfo.channel;
  videoDuration.textContent = '';

  thumbWrap.classList.add('hidden');
  discordAvatar.src = currentInfo.avatarUrl;
  discordAvatarWrap.classList.remove('hidden');
  discordExtra.innerHTML = `
    <div><strong>User ID:</strong> ${currentInfo.userId}</div>
    <div>Default avatar shown (live profile needs a Discord bot).</div>
  `;
  discordExtra.classList.remove('hidden');

  formatSection.classList.add('hidden');
  discordActions.classList.remove('hidden');
  btnDownload.classList.add('hidden');

  showStep(stepInfo);
}

function renderQualities() {
  let list;
  const format = lockedFormat || document.querySelector('input[name="format"]:checked')?.value || 'mp4';

  if (currentPlatform === 'tiktok') list = MOCK_TIKTOK;
  else if (format === 'mp3' || currentPlatform === 'soundcloud' || currentPlatform === 'spotify') list = MOCK_QUALITIES_MP3;
  else list = MOCK_QUALITIES_MP4;

  qualityList.innerHTML = '';
  list.forEach((q, i) => {
    const div = document.createElement('div');
    div.className = 'quality-item' + (i === 0 ? ' selected' : '');
    if (i === 0) selectedQuality = q;
    div.innerHTML = `
      <input type="radio" name="quality" value="${i}" ${i === 0 ? 'checked' : ''}>
      <span class="quality-label">${q.label}</span>
    `;
    div.addEventListener('click', () => {
      $$('.quality-item').forEach((el) => el.classList.remove('selected'));
      div.classList.add('selected');
      div.querySelector('input').checked = true;
      selectedQuality = q;
    });
    qualityList.appendChild(div);
  });
}

$$('input[name="format"]').forEach((radio) => {
  radio.addEventListener('change', () => {
    if (!lockedFormat) renderQualities();
  });
});

btnBack.addEventListener('click', () => showStep(stepUrl));

/** Call Cobalt API – try multiple instances */
async function cobaltDownload(url, opts) {
  const body = {
    url,
    filenameStyle: 'pretty',
    disableMetadata: false,
    alwaysProxy: true,
    ...opts,
  };

  const headers = {
    Accept: 'application/json',
    'Content-Type': 'application/json',
  };

  let lastError = 'All download servers failed.';

  for (const api of COBALT_APIS) {
    try {
      const res = await fetch(api, {
        method: 'POST',
        headers,
        body: JSON.stringify(body),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        lastError = data.error?.code || data.text || `Server error ${res.status}`;
        continue;
      }

      // Cobalt v10+ responses
      if (data.status === 'tunnel' || data.status === 'redirect') {
        if (data.url) return data.url;
      }
      if (data.status === 'picker' && data.picker?.length) {
        return data.picker[0].url || data.picker[0].thumb;
      }
      if (data.url) return data.url;

      // Older API shapes
      if (data.status === 'stream' && data.url) return data.url;
      if (data.status === 'success' && data.url) return data.url;

      if (data.status === 'error') {
        lastError = data.error?.code || data.text || 'Download failed';
        // Don't retry on bad URL
        if (String(lastError).includes('invalid') || String(lastError).includes('unsupported')) {
          throw new Error(lastError);
        }
        continue;
      }

      lastError = data.text || data.status || 'Unexpected response';
    } catch (e) {
      if (e.message && (e.message.includes('invalid') || e.message.includes('unsupported'))) {
        throw e;
      }
      lastError = e.message || 'Network error';
    }
  }

  throw new Error(lastError);
}

btnDownload.addEventListener('click', async () => {
  if (!currentInfo || !selectedQuality) return;

  showStep(stepProgress);
  const fmt = (lockedFormat || document.querySelector('input[name="format"]:checked')?.value || 'mp4').toLowerCase();
  progressTitle.textContent = 'Starting download...';
  progressBar.style.width = '15%';
  progressText.textContent = '15%';
  progressNote.textContent = 'Contacting download servers...';
  btnAgain.classList.add('hidden');

  const opts = {};
  if (fmt === 'mp3' || currentPlatform === 'soundcloud' || currentPlatform === 'spotify') {
    opts.downloadMode = 'audio';
    opts.audioFormat = 'mp3';
    opts.audioBitrate = selectedQuality.value || '128';
  } else {
    opts.downloadMode = 'auto';
    opts.videoQuality = selectedQuality.value || '1080';
    opts.youtubeVideoCodec = 'h264';
  }

  // Fake progress while waiting
  let pct = 15;
  const tick = setInterval(() => {
    if (pct < 70) {
      pct += 3;
      progressBar.style.width = pct + '%';
      progressText.textContent = pct + '%';
    }
  }, 400);

  try {
    const downloadUrl = await cobaltDownload(currentInfo.url, opts);
    clearInterval(tick);
    progressBar.style.width = '100%';
    progressText.textContent = '100%';
    progressTitle.textContent = 'Download ready!';
    progressNote.innerHTML = 'Your file should start downloading. If not, <a href="' + downloadUrl + '" target="_blank" rel="noopener">click here</a>.';

    // Trigger download
    const a = document.createElement('a');
    a.href = downloadUrl;
    a.target = '_blank';
    a.rel = 'noopener';
    a.download = '';
    document.body.appendChild(a);
    a.click();
    a.remove();

    btnAgain.classList.remove('hidden');
  } catch (e) {
    clearInterval(tick);
    progressBar.style.width = '0%';
    progressText.textContent = 'Failed';
    progressTitle.textContent = 'Download failed';
    progressNote.innerHTML = `
      <strong>${e.message || 'Something went wrong'}</strong><br><br>
      Public download servers can be rate-limited or blocked by YouTube.<br>
      Try again later, or run the Python script locally:<br>
      <code>python ytdl_ultra.py</code>
    `;
    btnAgain.classList.remove('hidden');
  }
});

btnDlAvatar.addEventListener('click', () => {
  if (!currentInfo?.avatarUrl) return;
  window.open(currentInfo.avatarUrl, '_blank');
});

btnCopyInfo.addEventListener('click', () => {
  if (!currentInfo) return;
  const text = `Discord User ID: ${currentInfo.userId}\nAvatar: ${currentInfo.avatarUrl}`;
  navigator.clipboard.writeText(text).then(() => {
    btnCopyInfo.textContent = 'Copied!';
    setTimeout(() => (btnCopyInfo.textContent = 'Copy User Info'), 1500);
  });
});

btnAgain.addEventListener('click', () => {
  urlInput.value = '';
  currentInfo = null;
  selectedQuality = null;
  lockedFormat = null;
  showStep(stepUrl);
});

urlInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') btnFetch.click();
});

initTheme();
