/**
 * Kira Tools – Web Frontend
 * Platforms: YouTube, SoundCloud, Spotify, TikTok, Discord.
 * Demo only for downloads – YouTube can still show real thumbnails via video ID.
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
let lockedFormat = null; // 'mp3' | 'mp4' | null (user chooses)

const PLATFORM_LABELS = {
  youtube: { title: 'Paste YouTube URL', hint: 'Video or short link works' },
  soundcloud: { title: 'Paste SoundCloud URL', hint: 'Track link – audio only (MP3)' },
  spotify: { title: 'Paste Spotify URL', hint: 'Track link – audio only (MP3)' },
  tiktok: { title: 'Paste TikTok URL', hint: 'Video link – MP4 only' },
  discord: { title: 'Paste Discord User ID or Profile URL', hint: 'User ID or discord.com/users/... – avatar + info only' },
};

const MOCK_QUALITIES_MP4 = [
  { label: 'Best Available (Auto)', size: null },
  { label: '1080p', size: '~45 MB' },
  { label: '720p', size: '~28 MB' },
  { label: '480p', size: '~15 MB' },
  { label: '360p', size: '~8 MB' },
];

const MOCK_QUALITIES_MP3 = [
  { label: '320 kbps (Highest)', size: null },
  { label: '256 kbps (High)', size: null },
  { label: '192 kbps (Standard)', size: null },
  { label: '128 kbps (Basic)', size: null },
];

const MOCK_TIKTOK = [
  { label: 'Best Available', size: null },
  { label: 'No Watermark', size: null },
  { label: 'With Watermark', size: null },
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

/** Extract YouTube video ID from common URL formats */
function extractYouTubeId(url) {
  try {
    const u = new URL(url);
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

/** Show/hide format picker based on platform */
function applyFormatRules(platform) {
  const formatOptions = document.querySelector('.format-options');
  const formatTitle = formatSection.querySelector('.panel-title');

  if (platform === 'soundcloud' || platform === 'spotify') {
    // Audio only – force MP3, hide format cards
    lockedFormat = 'mp3';
    formatOptions.classList.add('hidden');
    if (formatTitle) formatTitle.textContent = 'Format: MP3 (Audio Only)';
    $$('input[name="format"]').forEach((r) => {
      r.checked = r.value === 'mp3';
    });
  } else if (platform === 'tiktok') {
    lockedFormat = 'mp4';
    formatOptions.classList.add('hidden');
    if (formatTitle) formatTitle.textContent = 'Format: MP4 (Video)';
    $$('input[name="format"]').forEach((r) => {
      r.checked = r.value === 'mp4';
    });
  } else {
    // YouTube – user can pick
    lockedFormat = null;
    formatOptions.classList.remove('hidden');
    if (formatTitle) formatTitle.textContent = 'Format';
    $$('input[name="format"]').forEach((r) => {
      r.checked = r.value === 'mp4';
    });
  }
}

btnFetch.addEventListener('click', async () => {
  const url = urlInput.value.trim();
  urlError.classList.add('hidden');

  if (!url) {
    urlError.textContent = 'Please enter a URL or ID.';
    urlError.classList.remove('hidden');
    return;
  }

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

  // Validate platform matches URL when possible
  if (detected && detected !== currentPlatform) {
    // already switched above
  } else if (!detected && currentPlatform !== 'discord') {
    // allow anyway for demo
  }

  btnFetch.disabled = true;
  btnFetch.textContent = 'Fetching...';

  try {
    if (currentPlatform === 'discord') {
      handleDiscord(url);
    } else {
      await handleMedia(url);
    }
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
    if (id) {
      thumb = youtubeThumbUrl(id);
      title = `YouTube video (${id})`;
      channel = 'YouTube';
      // Try oEmbed for real title (may fail on CORS in some browsers)
      try {
        const oembed = `https://www.youtube.com/oembed?url=${encodeURIComponent(url)}&format=json`;
        const res = await fetch(oembed);
        if (res.ok) {
          const data = await res.json();
          if (data.title) title = data.title;
          if (data.author_name) channel = data.author_name;
          if (data.thumbnail_url) thumb = data.thumbnail_url;
        }
      } catch (_) {
        // CORS or network – keep ID-based title + official thumb
      }
    } else {
      title = 'YouTube link (could not parse video ID)';
      channel = 'YouTube';
    }
  } else if (currentPlatform === 'soundcloud') {
    title = 'SoundCloud track';
    channel = 'SoundCloud';
    duration = 'Audio';
    square = true;
    // No public CORS-free cover API – show placeholder icon area
    thumb = null;
  } else if (currentPlatform === 'spotify') {
    title = 'Spotify track';
    channel = 'Spotify';
    duration = 'Audio';
    square = true;
    thumb = null;
  } else if (currentPlatform === 'tiktok') {
    title = 'TikTok video';
    channel = 'TikTok';
    duration = 'Video';
    thumb = null;
  }

  // Show the URL host/path briefly so user knows their link was read
  let shortUrl = url;
  try {
    const u = new URL(url);
    shortUrl = u.hostname + u.pathname.slice(0, 40);
  } catch (_) {}

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

  if (thumb) {
    setThumbnail(thumb, square);
  } else {
    // Music platforms: show a simple colored placeholder via data URI or hide
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

  currentInfo = {
    title: `User ${userId}`,
    source: 'Discord',
    channel: `ID: ${userId}`,
    duration: '',
    url: input,
    platform: 'discord',
    userId,
    username: 'Unknown',
    discriminator: '0000',
    avatarUrl: `https://cdn.discordapp.com/embed/avatars/${parseInt(userId.slice(-1), 10) % 5}.png`,
    createdAt: '—',
    bot: false,
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
    <div><strong>Avatar:</strong> default (demo – no live API)</div>
    <p class="hint" style="margin-top:0.5rem">Full username/avatar needs a backend or Discord bot token.</p>
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

  if (currentPlatform === 'tiktok') {
    list = MOCK_TIKTOK;
  } else if (format === 'mp3' || currentPlatform === 'soundcloud' || currentPlatform === 'spotify') {
    list = MOCK_QUALITIES_MP3;
  } else {
    list = MOCK_QUALITIES_MP4;
  }

  qualityList.innerHTML = '';
  list.forEach((q, i) => {
    const div = document.createElement('div');
    div.className = 'quality-item' + (i === 0 ? ' selected' : '');
    if (i === 0) selectedQuality = q;
    div.innerHTML = `
      <input type="radio" name="quality" value="${i}" ${i === 0 ? 'checked' : ''}>
      <span class="quality-label">${q.label}</span>
      ${q.size ? `<span class="quality-size">${q.size}</span>` : ''}
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

btnDownload.addEventListener('click', () => {
  if (!currentInfo || !selectedQuality) return;

  showStep(stepProgress);
  const fmt = (lockedFormat || document.querySelector('input[name="format"]:checked')?.value || 'file').toUpperCase();
  progressTitle.textContent = `Downloading ${fmt}...`;
  progressBar.style.width = '0%';
  progressText.textContent = '0%';
  progressNote.textContent = '';
  btnAgain.classList.add('hidden');

  let pct = 0;
  const interval = setInterval(() => {
    pct += Math.random() * 14 + 5;
    if (pct >= 100) {
      pct = 100;
      clearInterval(interval);
      progressBar.style.width = '100%';
      progressText.textContent = '100%';
      progressTitle.textContent = 'Done!';
      progressNote.innerHTML = `
        <strong>Demo mode</strong> – no real file was downloaded.<br>
        This is a frontend UI only. For real downloads run:<br>
        <code>python ytdl_ultra.py</code>
      `;
      btnAgain.classList.remove('hidden');
    } else {
      progressBar.style.width = pct + '%';
      progressText.textContent = Math.floor(pct) + '%';
    }
  }, 260);
});

btnDlAvatar.addEventListener('click', () => {
  if (!currentInfo?.avatarUrl) return;
  window.open(currentInfo.avatarUrl, '_blank');
});

btnCopyInfo.addEventListener('click', () => {
  if (!currentInfo) return;
  const text = `Discord User Info\nUser ID: ${currentInfo.userId}\nAvatar: ${currentInfo.avatarUrl}`;
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
