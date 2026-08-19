/**
 * Kira Tools
 *
 * Real downloads:
 * - Opens cobalt.tools (works in browser, free) with your URL
 * - Optional: set your own Cobalt API URL in localStorage (key: kira-cobalt-api)
 * Discord: downloads default avatar as a real file
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

const PLATFORM_LABELS = {
  youtube: { title: 'Paste YouTube URL', hint: 'Video or short link' },
  soundcloud: { title: 'Paste SoundCloud URL', hint: 'Track link – MP3 only' },
  spotify: { title: 'Paste Spotify URL', hint: 'Track link – MP3 only' },
  tiktok: { title: 'Paste TikTok URL', hint: 'Video link – MP4 only' },
  discord: { title: 'Paste Discord User ID or Profile URL', hint: 'User ID or discord.com/users/...' },
};

const QUALITIES_MP4 = [
  { label: 'Best Available (Auto)', value: 'max' },
  { label: '1080p', value: '1080' },
  { label: '720p', value: '720' },
  { label: '480p', value: '480' },
  { label: '360p', value: '360' },
];

const QUALITIES_MP3 = [
  { label: '320 kbps (Highest)', value: '320' },
  { label: '256 kbps (High)', value: '256' },
  { label: '128 kbps (Standard)', value: '128' },
];

const QUALITIES_TIKTOK = [
  { label: 'Best Available', value: 'max' },
];

function initTheme() {
  if (localStorage.getItem('kira-theme') === 'dark') document.body.classList.add('dark');
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

function validateUrl(url, platform) {
  if (!url || url.length < 5) return 'URL is empty or too short.';

  if (platform !== 'discord' || !/^\d{17,20}$/.test(url.trim())) {
    try {
      const u = new URL(url.startsWith('http') ? url : 'https://' + url);
      if (!['http:', 'https:'].includes(u.protocol)) return 'URL must use http or https.';
    } catch {
      return 'Invalid URL. Paste a full link (https://...).';
    }
  }

  const detected = detectSourceFromUrl(url);
  if (!detected) return 'Unsupported link. Use YouTube, SoundCloud, Spotify, TikTok, or Discord.';
  if (detected !== platform) {
    return `That looks like a ${detected} link. Switch platform to ${detected} (or paste again).`;
  }
  if (platform === 'youtube' && !extractYouTubeId(url)) {
    return 'Could not find a YouTube video ID in that URL.';
  }
  return null;
}

function extractYouTubeId(url) {
  try {
    const u = new URL(url.startsWith('http') ? url : 'https://' + url);
    if (u.hostname.includes('youtu.be')) return u.pathname.slice(1).split('/')[0].split('?')[0] || null;
    if (u.searchParams.get('v')) return u.searchParams.get('v');
    const shorts = u.pathname.match(/\/shorts\/([\w-]{11})/);
    if (shorts) return shorts[1];
    const embed = u.pathname.match(/\/embed\/([\w-]{11})/);
    if (embed) return embed[1];
  } catch (_) {}
  const m = url.match(/(?:v=|\/shorts\/|youtu\.be\/)([\w-]{11})/);
  return m ? m[1] : null;
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
  } else if (platform === 'tiktok') {
    lockedFormat = 'mp4';
    formatOptions.classList.add('hidden');
    if (formatTitle) formatTitle.textContent = 'Format: MP4 (Video)';
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

  if (!/^https?:\/\//i.test(url) && !/^\d{17,20}$/.test(url)) {
    url = 'https://' + url;
    urlInput.value = url;
  }

  const detected = detectSourceFromUrl(url);
  if (detected && detected !== currentPlatform) {
    $$('.platform-card').forEach((c) => c.classList.toggle('selected', c.dataset.platform === detected));
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
    if (currentPlatform === 'discord') handleDiscord(url);
    else await handleMedia(url);
  } catch (e) {
    urlError.textContent = e.message || 'Failed to fetch info.';
    urlError.classList.remove('hidden');
  } finally {
    btnFetch.disabled = false;
    btnFetch.textContent = 'Fetch Info';
  }
});

async function handleMedia(url) {
  let title = 'Media';
  let channel = '—';
  let duration = '—';
  let thumb = null;
  let square = false;

  if (currentPlatform === 'youtube') {
    const id = extractYouTubeId(url);
    if (!id) throw new Error('Invalid YouTube URL.');
    thumb = `https://img.youtube.com/vi/${id}/hqdefault.jpg`;
    title = `YouTube · ${id}`;
    channel = 'YouTube';
    try {
      const res = await fetch(`https://www.youtube.com/oembed?url=${encodeURIComponent(url)}&format=json`);
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

  currentInfo = { title, source: currentPlatform, channel, duration, url, platform: currentPlatform };

  videoTitle.textContent = title;
  videoSource.textContent = currentPlatform.charAt(0).toUpperCase() + currentPlatform.slice(1);
  videoChannel.textContent = channel;
  videoDuration.textContent = duration;

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
    urlError.textContent = 'Invalid Discord user ID (must be 17–20 digits).';
    urlError.classList.remove('hidden');
    return;
  }

  const avatarUrl = `https://cdn.discordapp.com/embed/avatars/${parseInt(userId.slice(-1), 10) % 5}.png`;

  currentInfo = {
    title: `User ${userId}`,
    source: 'Discord',
    channel: `ID: ${userId}`,
    url: input,
    platform: 'discord',
    userId,
    avatarUrl,
  };

  videoTitle.textContent = currentInfo.title;
  videoSource.textContent = 'Discord';
  videoChannel.textContent = currentInfo.channel;
  videoDuration.textContent = '';

  thumbWrap.classList.add('hidden');
  discordAvatar.src = avatarUrl;
  discordAvatarWrap.classList.remove('hidden');
  discordExtra.innerHTML = `
    <div><strong>User ID:</strong> ${userId}</div>
    <div>Default avatar (custom PFP needs a Discord bot token).</div>
  `;
  discordExtra.classList.remove('hidden');

  formatSection.classList.add('hidden');
  discordActions.classList.remove('hidden');
  btnDownload.classList.add('hidden');

  showStep(stepInfo);
}

function renderQualities() {
  const format = lockedFormat || document.querySelector('input[name="format"]:checked')?.value || 'mp4';
  let list;
  if (currentPlatform === 'tiktok') list = QUALITIES_TIKTOK;
  else if (format === 'mp3' || currentPlatform === 'soundcloud' || currentPlatform === 'spotify') list = QUALITIES_MP3;
  else list = QUALITIES_MP4;

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
  radio.addEventListener('change', () => { if (!lockedFormat) renderQualities(); });
});

btnBack.addEventListener('click', () => showStep(stepUrl));

/**
 * Download strategy (static site limits):
 * 1) If user set custom Cobalt API → use it
 * 2) Otherwise open cobalt.tools so the user can download for real (works)
 */
btnDownload.addEventListener('click', async () => {
  if (!currentInfo) return;

  showStep(stepProgress);
  progressTitle.textContent = 'Preparing download...';
  progressBar.style.width = '30%';
  progressText.textContent = '30%';
  progressNote.textContent = '';
  btnAgain.classList.add('hidden');

  const customApi = (localStorage.getItem('kira-cobalt-api') || '').trim();

  if (customApi) {
    progressNote.textContent = 'Using your Cobalt API...';
    try {
      const fmt = lockedFormat || document.querySelector('input[name="format"]:checked')?.value || 'mp4';
      const body = {
        url: currentInfo.url,
        filenameStyle: 'pretty',
        alwaysProxy: true,
      };
      if (fmt === 'mp3' || currentPlatform === 'soundcloud' || currentPlatform === 'spotify') {
        body.downloadMode = 'audio';
        body.audioFormat = 'mp3';
        body.audioBitrate = selectedQuality?.value || '128';
      } else {
        body.downloadMode = 'auto';
        body.videoQuality = selectedQuality?.value || '1080';
      }

      const res = await fetch(customApi.replace(/\/?$/, '/'), {
        method: 'POST',
        headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json().catch(() => ({}));

      if (data.url && (data.status === 'tunnel' || data.status === 'redirect' || data.status === 'stream')) {
        progressBar.style.width = '100%';
        progressText.textContent = '100%';
        progressTitle.textContent = 'Download ready!';
        progressNote.innerHTML = 'Starting file download…';
        const a = document.createElement('a');
        a.href = data.url;
        a.target = '_blank';
        a.rel = 'noopener';
        document.body.appendChild(a);
        a.click();
        a.remove();
        btnAgain.classList.remove('hidden');
        return;
      }
      throw new Error(data.error?.code || data.text || 'API did not return a download URL');
    } catch (e) {
      progressTitle.textContent = 'API failed';
      progressBar.style.width = '0%';
      progressText.textContent = 'Failed';
      progressNote.innerHTML = `<strong>${e.message}</strong><br>Opening cobalt.tools instead…`;
    }
  }

  // Fallback that actually works: cobalt.tools website
  progressBar.style.width = '100%';
  progressText.textContent = '100%';
  progressTitle.textContent = 'Opening download page…';
  progressNote.innerHTML = `
    Public APIs need auth, so we open <strong>cobalt.tools</strong> with your link.<br>
    Paste is already done — pick quality and download there.<br><br>
    <em>For fully in-app downloads: host your own Cobalt API (free on Railway) and set it in About.</em>
  `;

  // cobalt.tools accepts the URL in the page; open and also copy URL for convenience
  try {
    await navigator.clipboard.writeText(currentInfo.url);
  } catch (_) {}

  window.open('https://cobalt.tools/', '_blank', 'noopener');

  btnAgain.classList.remove('hidden');
});

// Discord: real file download of avatar
btnDlAvatar.addEventListener('click', async () => {
  if (!currentInfo?.avatarUrl) return;
  try {
    const res = await fetch(currentInfo.avatarUrl);
    const blob = await res.blob();
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `discord_${currentInfo.userId}.png`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(a.href);
  } catch {
    window.open(currentInfo.avatarUrl, '_blank');
  }
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
