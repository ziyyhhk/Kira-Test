/**
 * Kira Tools – Web Frontend
 * Platforms: YouTube, SoundCloud, Spotify, TikTok, Discord.
 * Demo only – real downloads need the Python script / backend.
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

const PLATFORM_LABELS = {
  youtube: { title: 'Paste YouTube URL', hint: 'Video or short link works' },
  soundcloud: { title: 'Paste SoundCloud URL', hint: 'Track or playlist link' },
  spotify: { title: 'Paste Spotify URL', hint: 'Track link – will search YouTube' },
  tiktok: { title: 'Paste TikTok URL', hint: 'Video link from TikTok' },
  discord: { title: 'Paste Discord User ID or Profile URL', hint: 'User ID or discord.com/users/... – avatar + info only' },
};

/* Demo thumbnails (picsum / placeholder – replace with real API later) */
const DEMO_THUMBS = {
  youtube: 'https://picsum.photos/seed/kira-yt/480/270',
  soundcloud: 'https://picsum.photos/seed/kira-sc/300/300',
  spotify: 'https://picsum.photos/seed/kira-sp/300/300',
  tiktok: 'https://picsum.photos/seed/kira-tt/270/480',
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
  if (saved === 'dark') {
    document.body.classList.add('dark');
  } else {
    document.body.classList.remove('dark');
  }
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
    const page = btn.dataset.page;
    $$('.page').forEach((p) => p.classList.remove('active'));
    $(`#page-${page}`).classList.add('active');
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

function isMusicPlatform(p) {
  return p === 'soundcloud' || p === 'spotify';
}

function setThumbnail(platform, customUrl) {
  const url = customUrl || DEMO_THUMBS[platform];
  if (!url) {
    thumbWrap.classList.add('hidden');
    return;
  }
  thumbWrap.classList.remove('hidden');
  thumbWrap.classList.toggle('square', platform === 'spotify' || platform === 'soundcloud');
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

btnFetch.addEventListener('click', () => {
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

  btnFetch.disabled = true;
  btnFetch.textContent = 'Fetching...';

  setTimeout(() => {
    if (currentPlatform === 'discord') {
      handleDiscord(url);
    } else {
      handleMedia(url);
    }
    btnFetch.disabled = false;
    btnFetch.textContent = 'Fetch Info';
  }, 800);
});

function handleMedia(url) {
  const titles = {
    youtube: 'Sample Video Title – Demo Mode',
    soundcloud: 'Sample Track – SoundCloud Demo',
    spotify: 'Sample Track – Artist Name',
    tiktok: 'Sample TikTok Video – @user',
  };

  currentInfo = {
    title: titles[currentPlatform] || 'Sample Media',
    source: currentPlatform.charAt(0).toUpperCase() + currentPlatform.slice(1),
    channel: currentPlatform === 'youtube' ? 'Demo Channel' : currentPlatform === 'tiktok' ? '@demouser' : 'Demo Artist',
    duration: currentPlatform === 'tiktok' ? '0m 18s' : '3m 42s',
    url,
    platform: currentPlatform,
  };

  videoTitle.textContent = currentInfo.title;
  videoSource.textContent = currentInfo.source;
  videoChannel.textContent = currentInfo.channel;
  videoDuration.textContent = currentInfo.duration;

  // Show media thumbnail (YouTube 16:9, Spotify/SC square, TikTok portrait-ish)
  setThumbnail(currentPlatform);

  discordAvatarWrap.classList.add('hidden');
  discordExtra.classList.add('hidden');
  formatSection.classList.remove('hidden');
  discordActions.classList.add('hidden');
  btnDownload.classList.remove('hidden');

  if (isMusicPlatform(currentPlatform)) {
    $$('input[name="format"]').forEach((r) => {
      r.checked = r.value === 'mp3';
    });
  } else if (currentPlatform === 'tiktok') {
    $$('input[name="format"]').forEach((r) => {
      r.checked = r.value === 'mp4';
    });
  }

  renderQualities();
  showStep(stepInfo);
}

function handleDiscord(input) {
  let userId = input.trim();
  const match = input.match(/discord\.com\/users\/(\d+)/i) || input.match(/(\d{17,20})/);
  if (match) userId = match[1];

  currentInfo = {
    title: 'DemoUser#0001',
    source: 'Discord',
    channel: `ID: ${userId}`,
    duration: '',
    url: input,
    platform: 'discord',
    userId,
    username: 'DemoUser',
    discriminator: '0001',
    avatarUrl: `https://cdn.discordapp.com/embed/avatars/${parseInt(userId.slice(-1), 10) % 5}.png`,
    createdAt: '2020-03-15',
    bot: false,
  };

  videoTitle.textContent = currentInfo.title;
  videoSource.textContent = 'Discord';
  videoChannel.textContent = currentInfo.channel;
  videoDuration.textContent = '';

  // Hide media thumb, show Discord avatar
  thumbWrap.classList.add('hidden');
  discordAvatar.src = currentInfo.avatarUrl;
  discordAvatarWrap.classList.remove('hidden');
  discordExtra.innerHTML = `
    <div><strong>Username:</strong> ${currentInfo.username}</div>
    <div><strong>User ID:</strong> ${currentInfo.userId}</div>
    <div><strong>Created:</strong> ${currentInfo.createdAt}</div>
    <div><strong>Bot:</strong> ${currentInfo.bot ? 'Yes' : 'No'}</div>
  `;
  discordExtra.classList.remove('hidden');

  formatSection.classList.add('hidden');
  discordActions.classList.remove('hidden');
  btnDownload.classList.add('hidden');

  showStep(stepInfo);
}

function renderQualities() {
  let list;
  if (currentPlatform === 'tiktok') {
    list = MOCK_TIKTOK;
  } else {
    const format = document.querySelector('input[name="format"]:checked')?.value || 'mp4';
    list = format === 'mp4' ? MOCK_QUALITIES_MP4 : MOCK_QUALITIES_MP3;
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
  radio.addEventListener('change', renderQualities);
});

btnBack.addEventListener('click', () => showStep(stepUrl));

btnDownload.addEventListener('click', () => {
  if (!currentInfo || !selectedQuality) return;

  showStep(stepProgress);
  const fmt = document.querySelector('input[name="format"]:checked')?.value?.toUpperCase() || 'FILE';
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
        Run the Python script for actual downloads:<br>
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
  const text = `Discord User Info
Username: ${currentInfo.username}#${currentInfo.discriminator}
User ID: ${currentInfo.userId}
Avatar: ${currentInfo.avatarUrl}
Created: ${currentInfo.createdAt}
Bot: ${currentInfo.bot}`;
  navigator.clipboard.writeText(text).then(() => {
    btnCopyInfo.textContent = 'Copied!';
    setTimeout(() => (btnCopyInfo.textContent = 'Copy User Info'), 1500);
  });
});

btnAgain.addEventListener('click', () => {
  urlInput.value = '';
  currentInfo = null;
  selectedQuality = null;
  showStep(stepUrl);
});

urlInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') btnFetch.click();
});

initTheme();
