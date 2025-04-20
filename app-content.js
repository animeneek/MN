const API_KEY = 'e3afd4c89e3351edad9e875ff7a01f0c';

// Fetch header.html and inject into the nav placeholder
fetch('header.html')
  .then(res => res.text())
  .then(data => {
    document.getElementById('nav-placeholder').innerHTML = data;

    // Add event listener to search box to handle 'Enter' key
    const searchBox = document.getElementById('searchBox');
    if (searchBox) {
      searchBox.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
          const query = e.target.value.trim();
          if (query) {
            window.location.href = `search.html?q=${encodeURIComponent(query)}`;
          }
        }
      });
    }
  });

const urlParams = new URLSearchParams(window.location.search);
const contentType = urlParams.get('type');
const contentId = urlParams.get('id');

// Fallback image function
function imageUrl(path, size = 'w500', fallback = 'https://github.com/animeneek/MN/blob/main/assets/Black%20and%20White%20Modern%20Coming%20soon%20Poster.png') {
  return path ? `https://image.tmdb.org/t/p/${size}${path}` : fallback;
}

// Fetch content details (movie or TV)
async function fetchContentDetails(type, id) {
  const res = await fetch(`https://api.themoviedb.org/3/${type}/${id}?api_key=${API_KEY}&language=en-US`);
  return await res.json();
}

// Fetch credits (cast and crew)
async function fetchCredits(type, id) {
  const res = await fetch(`https://api.themoviedb.org/3/${type}/${id}/credits?api_key=${API_KEY}`);
  return await res.json();
}

// Fetch recommendations
async function fetchRecommendations(type, id) {
  const res = await fetch(`https://api.themoviedb.org/3/${type}/${id}/recommendations?api_key=${API_KEY}`);
  return await res.json();
}

// Fetch external sources (additional data)
async function fetchExternalSources() {
  const res = await fetch('https://raw.githubusercontent.com/animeneek/MovieNeek/main/MovieNeek.json');
  return await res.json();
}

//mine
function saveToContinueWatching(content) {
  const saved = JSON.parse(localStorage.getItem('continueWatching')) || [];
  const exists = saved.find(item => item.id === content.id && item.media_type === content.media_type);
  if (!exists) {
    saved.unshift({
      id: content.id,
      title: content.title || content.name || 'Untitled',
      poster_path: content.poster_path,
      media_type: content.media_type,
      release_date: content.release_date || content.first_air_date || '',
    });
    if (saved.length > 20) saved.pop();
    localStorage.setItem('continueWatching', JSON.stringify(saved));
  }
}

function renderContinueWatching() {
  const section = document.getElementById('continueWatching');
  if (!section) return;

  const saved = JSON.parse(localStorage.getItem('continueWatching')) || [];
  if (!saved.length) {
    section.innerHTML = '';
    return;
  }

  const cards = saved.map(item => {
    const img = item.poster_path ? IMG_W500 + item.poster_path : FALLBACK_IMG;
    return `
      <div class="rounded overflow-hidden shadow-md bg-[#111] hover:scale-105 transition transform duration-300 cursor-pointer content-card" data-id="${item.id}" data-type="${item.media_type}">
        <div class="w-full aspect-[2/3] bg-black">
          <img src="${img}" alt="${item.title}" class="w-full h-full object-cover" onerror="this.onerror=null;this.src='${FALLBACK_IMG}'">
        </div>
        <div class="p-2 text-sm text-white">
          <h3 class="font-semibold">${item.title}</h3>
          <p class="opacity-60 text-xs">${formatDate(item.release_date)}</p>
        </div>
      </div>`;
  }).join('');

  section.innerHTML = `<h2 class="text-lg text-white font-semibold mb-2">Continue Watching</h2>
    <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">${cards}</div>`;

  document.querySelectorAll('#continueWatching .content-card').forEach(card => {
    card.addEventListener('click', () => {
      const id = card.dataset.id;
      const type = card.dataset.type;
      window.location.href = `info.html?id=${id}&type=${type}`;
    });
  });
}



// Get embed URL for the streaming source
function getEmbedLink(platform, videoId) {
  switch (platform) {
    case 'streamtape':
      return `https://streamtape.com/e/${videoId}`;
    case 'streamwish':
      return `https://streamwish.com/e/${videoId}`;
    case 'mp4upload':
      return `https://mp4upload.com/embed-${videoId}.html`;
    case 'other':
      return `https://other-streaming-site.com/${videoId}`;
    default:
      return '';
  }
}

// Render content details (movie or TV page)
function renderContentDetails(content) {
  const poster = imageUrl(content.poster_path);
  document.getElementById('contentDetails').innerHTML = `
    <img src="${poster}" class="rounded shadow max-w-full object-cover" alt="${content.title || content.name}">
    <div class="md:col-span-2">
      <h1 class="text-3xl font-bold mb-1">${content.title || content.name}</h1>
      <p class="text-sm italic text-gray-400 mb-4">${content.tagline || ''}</p>
      <p class="text-sm mb-4">${content.overview || 'No description available.'}</p>
      <p><strong>Genres:</strong> ${content.genres.map(g => g.name).join(', ')}</p>
      <p><strong>Status:</strong> ${content.status}</p>
      ${contentType === 'tv' ? `<p><strong>Seasons:</strong> ${content.number_of_seasons}</p>` : ''}
    </div>
  `;
}

// Render cast (list of actors)
function renderCast(cast) {
  const castHTML = cast.slice(0, 12).map(actor => `
    <a href="person.html?id=${actor.id}" class="text-center block hover:scale-105 transition">
      <img class="w-24 h-24 object-cover rounded-full mx-auto" src="${imageUrl(actor.profile_path, 'w185')}" alt="${actor.name}" />
      <p class="text-sm mt-2">${actor.name}</p>
      <p class="text-xs text-gray-500">${actor.character}</p>
    </a>
  `).join('');
  document.getElementById('tab-cast').innerHTML = `<div class="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-4">${castHTML}</div>`;
}

// Render recommended content (movies or TV shows)
function renderRecommended(results) {
  const items = results.slice(0, 8).map(item => `
    <a href="info.html?type=${contentType}&id=${item.id}" class="rounded shadow overflow-hidden hover:scale-105 transition block">
      <img src="${imageUrl(item.poster_path, 'w342')}" class="w-full aspect-[2/3] object-cover" alt="${item.title || item.name}" />
      <div class="p-2 text-sm text-center">${item.title || item.name}</div>
    </a>
  `).join('');
  document.getElementById('tab-recommended').innerHTML = `<div class="grid grid-cols-2 md:grid-cols-4 gap-4">${items}</div>`;
}

// Render source buttons for content
function renderSourceButtons(sources, containerId) {
  const container = document.getElementById(containerId);
  if (!sources.length) return;

  sources.forEach(src => {
    src.SRC.forEach((platform, i) => {
      const embedUrl = getEmbedLink(platform, src.VIDEOID[i]);
      const buttonLabel = src.Source[i] || `Source ${i + 1}`;
      const button = `
        <button onclick="openModal('${embedUrl}')" class="bg-primary hover:bg-red-600 text-white px-4 py-2 rounded shadow m-2">
          ${buttonLabel}
        </button>
      `;
      container.insertAdjacentHTML('beforeend', button);
    });
  });
}

// Render default movie source (for movie content)
function renderDefaultMovieSource(id) {
  const container = document.getElementById('tab-sources');
  container.innerHTML = `
    <button onclick="openModal('https://player.embed-api.stream/?id=${id}&type=movie')" class="bg-primary hover:bg-red-600 text-white px-4 py-2 rounded shadow m-2">
      Watch on Source 1
    </button>
  `;
}

// Render additional sources message (if no sources are available)
function renderAdditionalSourcesMessage() {
  document.getElementById('tab-additional-sources').innerHTML = `
    <div class="text-sm text-gray-400 italic">No Additional Sources Yet</div>
  `;
}

// Render episodes for TV shows
async function renderEpisodes(tvData) {
  const container = document.getElementById('tab-episodes');
  container.innerHTML = '';

  for (const season of tvData.seasons) {
    if (season.season_number === 0) continue;

    const res = await fetch(`https://api.themoviedb.org/3/tv/${tvData.id}/season/${season.season_number}?api_key=${API_KEY}`);
    const seasonData = await res.json();

    const episodeBlocks = seasonData.episodes.map(ep => {
      const img = imageUrl(ep.still_path || season.poster_path || tvData.poster_path, 'w780');
      return `
        <div onclick="openModal('https://player.embed-api.stream/?id=${tvData.id}&s=${season.season_number}&e=${ep.episode_number}')" class="relative rounded overflow-hidden shadow cursor-pointer">
          <img src="${img}" class="w-full h-40 object-cover" />
          <div class="absolute inset-0 bg-black bg-opacity-60 p-3 flex flex-col justify-end text-white">
            <h3 class="font-semibold text-sm">Episode ${ep.episode_number}: ${ep.name}</h3>
            <p class="text-xs mt-1">${ep.overview || 'No synopsis available.'}</p>
          </div>
        </div>
      `;
    }).join('');

    container.innerHTML += `
      <h2 class="text-xl font-semibold mb-3 mt-6">Season ${season.season_number}</h2>
      <div class="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">${episodeBlocks}</div>
    `;
  }
}

// Setup tabs for displaying different sections (e.g., cast, episodes, sources)
function setupTabs(type) {
  const tabs = document.querySelectorAll('.tab-btn');
  const panels = document.querySelectorAll('.tab-panel');

  tabs.forEach(btn => {
    btn.addEventListener('click', () => {
      panels.forEach(panel => panel.classList.add('hidden'));
      tabs.forEach(tab => tab.classList.remove('border-b-2', 'border-primary'));
      document.getElementById(`tab-${btn.dataset.tab}`).classList.remove('hidden');
      btn.classList.add('border-b-2', 'border-primary');
    });
  });

  if (type === 'movie') {
    document.querySelector('[data-tab="sources"]').style.display = 'inline-block';
    document.querySelector('[data-tab="episodes"]').style.display = 'none';
    document.querySelector('[data-tab="additional-sources"]').style.display = 'none';
    document.querySelector('[data-tab="sources"]').classList.add('border-b-2', 'border-primary');
    document.getElementById('tab-sources').classList.remove('hidden');
  } else {
    document.querySelector('[data-tab="sources"]').style.display = 'none';
    document.querySelector('[data-tab="episodes"]').style.display = 'inline-block';
    document.querySelector('[data-tab="additional-sources"]').style.display = 'inline-block';
    document.querySelector('[data-tab="episodes"]').classList.add('border-b-2', 'border-primary');
    document.getElementById('tab-episodes').classList.remove('hidden');
  }

  document.querySelector('[data-tab="cast"]').style.display = 'inline-block';
  document.querySelector('[data-tab="recommended"]').style.display = 'inline-block';
}

// Open modal to display external content (e.g., streaming)
function openModal(url) {
  const videoFrame = document.getElementById('videoFrame');
  videoFrame.src = url;
  document.getElementById('videoModal').classList.remove('hidden');
}

// Close modal
document.getElementById('closeModal').addEventListener('click', () => {
  document.getElementById('videoFrame').src = '';
  document.getElementById('videoModal').classList.add('hidden');
});

// Initialize content page
async function init() {
  if (!contentId || !contentType) return;

  const content = await fetchContentDetails(contentType, contentId);
  renderContentDetails(content);
  setupTabs(contentType);

  const { cast } = await fetchCredits(contentType, contentId);
  renderCast(cast);

  const { results } = await fetchRecommendations(contentType, contentId);
  renderRecommended(results);

  const allSources = await fetchExternalSources();
  const matchedSources = allSources.filter(src => src.TMDBID === parseInt(contentId));

  if (contentType === 'movie') {
    renderDefaultMovieSource(contentId);
    renderSourceButtons(matchedSources, 'tab-sources');
  } else {
    renderAdditionalSourcesMessage();
    renderSourceButtons(matchedSources, 'tab-additional-sources');
    renderEpisodes(content);
  }
}

  renderContinueWatching();

document.addEventListener('DOMContentLoaded', init);
