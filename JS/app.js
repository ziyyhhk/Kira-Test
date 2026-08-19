/**
 * YTDL ULTRA – Web Frontend
 * This is a UI recreation of the Python CLI tool.
 * Real downloads require the Python script or a backend with yt-dlp.
 */

const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => document.querySelectorAll(sel);

// Elements
const stepUrl = $('#step-url');
const stepInfo = $('#step-info');
const stepProgress = $('#step-progress');
const urlInput = $('#url-input');
const btnFetch = $('#btn-fetch');
const urlError = $('#url-error');
const videoTitle = $('#video-title');
const videoSource = $('#video-source');
const videoChannel = $('#video-channel');
const videoDuration = $('#video-duration');
const qualityList = $('#quality-list');
const btnDownload = $('#btn-download');
const btnBack = $('#btn-back');
const progressBar = $('#progress-bar');
const progressText = $('#progress-text');
const progressTitle = $('#progress-title');
const progressNote = $('#progress-note');
const btnAgain = $('#btn-again');

let currentInfo = null;
let selectedQuality = null;

// Mock data for demo (since we can't call yt-dlp from browser)
const MOCK_QUALITIES_MP4 = [
  { label: 'Best Available (Auto)', size: null, tier: 'high' },
  { label: '1080p [audio]', size: '~45 MB', tier: 'high' },
  { label: '720p [audio]', size: '~28 MB', tier: 'mid' },
  { label: '480p [audio]', size: '~15 MB', tier: 'mid' },
  { label: '360p [audio]', size: '~8 MB', tier: 'low' },
];

const MOCK_QUALITIES_MP3 = [
  { label: '320 kbps (Highest)', size: null, tier: 'high' },
  { label: '256 kbps (High)', size: null, tier: 'high' },
  { label: '192 kbps (Standard)', size: null, tier: 'mid' },
  { label: '128 kbps (Basic)', size: null, tier: 'low' },
];

function showStep(step) {
  $$('.step').forEach(s => s.classList.remove('active'));
  step.classList.add('active');
}

function detectSource(url) {
  const u = url.toLowerCase();
  if (u.includes('youtube.com') || u.includes('youtu.be')) return 'YouTube';
  if (u.includes('soundcloud.com')) return 'SoundCloud';
  if (u.includes('spotify.com')) return 'Spotify';
  return null;
}

function isMusicSource(source) {
  return source === 'SoundCloud' || source === 'Spotify';
}

btnFetch.addEventListener('click', () => {
  const url = urlInput.value.trim();
  urlError.classList.add('hidden');

  if (!url) {
    urlError.textContent = 'Please enter a URL.';
    urlError.classList.remove('hidden');
    return;
  }

  const source = detectSource(url);
  if (!source) {
    urlError.textContent = 'Not a recognized URL. Please provide a YouTube, SoundCloud, or Spotify link.';
    urlError.classList.remove('hidden');
    return;
  }

  // Simulate fetch
  btnFetch.disabled = true;
  btnFetch.textContent = 'Fetching...';

  setTimeout(() => {
    // Mock info (in real app this would come from a backend)
    currentInfo = {
      title: source === 'Spotify'
        ? 'Sample Track – Artist Name'
        : 'Sample Video Title – Demo Mode',
      source,
      channel: source === 'YouTube' ? 'Demo Channel' : source === 'SoundCloud' ? 'Demo Artist' : 'Spotify Artist',
      duration: source === 'YouTube' ? '3m 42s' : '3m 15s',
      url,
    };

    videoTitle.textContent = currentInfo.title;
    videoSource.textContent = currentInfo.source;
    videoChannel.textContent = currentInfo.channel;
    videoDuration.textContent = currentInfo.duration;

    // Auto-select MP3 for music sources
    if (isMusicSource(source)) {
      $$('input[name="format"]').forEach(r => {
        r.checked = r.value === 'mp3';
      });
    }

    renderQualities();
    showStep(stepInfo);
    btnFetch.disabled = false;
    btnFetch.textContent = 'Fetch Info';
  }, 900);
});

function renderQualities() {
  const format = document.querySelector('input[name="format"]:checked').value;
  const list = format === 'mp4' ? MOCK_QUALITIES_MP4 : MOCK_QUALITIES_MP3;

  qualityList.innerHTML = '';
  list.forEach((q, i) => {
    const div = document.createElement('div');
    div.className = `quality-item ${q.tier}`;
    if (i === 0) {
      div.classList.add('selected');
      selectedQuality = q;
    }
    div.innerHTML = `
      <input type="radio" name="quality" value="${i}" ${i === 0 ? 'checked' : ''}>
      <span class="quality-label">${q.label}</span>
      ${q.size ? `<span class="quality-size">${q.size}</span>` : ''}
    `;
    div.addEventListener('click', () => {
      $$('.quality-item').forEach(el => el.classList.remove('selected'));
      div.classList.add('selected');
      div.querySelector('input').checked = true;
      selectedQuality = q;
    });
    qualityList.appendChild(div);
  });
}

// Re-render qualities when format changes
$$('input[name="format"]').forEach(radio => {
  radio.addEventListener('change', renderQualities);
});

btnBack.addEventListener('click', () => {
  showStep(stepUrl);
});

btnDownload.addEventListener('click', () => {
  if (!currentInfo || !selectedQuality) return;

  showStep(stepProgress);
  progressTitle.textContent = `Downloading ${document.querySelector('input[name="format"]:checked').value.toUpperCase()}...`;
  progressBar.style.width = '0%';
  progressText.textContent = '0%';
  progressNote.textContent = '';
  btnAgain.classList.add('hidden');

  // Simulated progress
  let pct = 0;
  const interval = setInterval(() => {
    pct += Math.random() * 12 + 4;
    if (pct >= 100) {
      pct = 100;
      clearInterval(interval);
      progressBar.style.width = '100%';
      progressText.textContent = '100%';
      progressTitle.textContent = 'Done!';
      progressNote.innerHTML = `
        <strong>Demo mode</strong> – no real file was downloaded.<br>
        To actually download, run the Python script:<br>
        <code>python ytdl_ultra.py</code><br><br>
        Or deploy this UI with a backend that uses yt-dlp.
      `;
      btnAgain.classList.remove('hidden');
    } else {
      progressBar.style.width = pct + '%';
      progressText.textContent = Math.floor(pct) + '%';
    }
  }, 280);
});

btnAgain.addEventListener('click', () => {
  urlInput.value = '';
  currentInfo = null;
  selectedQuality = null;
  showStep(stepUrl);
});

// Allow Enter key on URL input
urlInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') btnFetch.click();
});
