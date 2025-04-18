const API_KEY = 'YOUR_TMDB_API_KEY';
const urlParams = new URLSearchParams(window.location.search);
const contentType = urlParams.get('type'); // 'movie' or 'tv'
const contentId = urlParams.get('id');

async function fetchContentDetails(type, id) {
  const res = await fetch(`https://api.themoviedb.org/3/${type}/${id}?api_key=${API_KEY}&language=en-US`);
  return await res.json();
}

async function fetchCredits(type, id) {
  const res = await fetch(`https://api.themoviedb.org/3/${type}/${id}/credits?api_key=${API_KEY}`);
  return await res.json();
}

async function fetchRecommendations(type, id) {
  const res = await fetch(`https://api.themoviedb.org/3/${type}/${id}/recommendations?api_key=${API_KEY}`);
  return await res.json();
}

async function fetchEpisodes(tvId) {
  const res = await fetch(`https://api.themoviedb.org/3/tv/${tvId}?api_key=${API_KEY}&language=en-US`);
  return await res.json();
}

function renderContentDetails(content) {
  document.getElementById('contentDetails').innerHTML = `
    <img src="https://image.tmdb.org/t/p/w500${content.poster_path}" class="rounded shadow max-w-full" alt="${content.title || content.name}">
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

function renderCast(cast) {
  const castHTML = cast.slice(0, 12).map(actor => `
    <div class="text-center">
      <img class="w-24 h-24 object-cover rounded-full mx-auto" src="https://image.tmdb.org/t/p/w185${actor.profile_path}" alt="${actor.name}" />
      <p class="text-sm mt-2">${actor.name}</p>
      <p class="text-xs text-gray-500">${actor.character}</p>
    </div>
  `).join('');
  document.getElementById('tab-cast').innerHTML = `<div class="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-4">${castHTML}</div>`;
}

function renderRecommended(results) {
  const items = results.slice(0, 8).map(item => `
    <a href="content.html?type=${contentType}&id=${item.id}" class="rounded shadow overflow-hidden hover:scale-105 transition block">
      <img src="https://image.tmdb.org/t/p/w300${item.poster_path}" class="w-full h-[300px] object-cover" alt="${item.title || item.name}" />
      <div class="p-2 text-sm text-center">${item.title || item.name}</div>
    </a>
  `).join('');
  document.getElementById('tab-recommended').innerHTML = `<div class="grid grid-cols-2 md:grid-cols-4 gap-4">${items}</div>`;
}

function renderSources() {
  document.getElementById('tab-sources').innerHTML = `
    <div class="flex flex-wrap gap-3">
      <a href="#" class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded shadow">Watch on Source 1</a>
      <a href="#" class="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded shadow">Watch on Source 2</a>
    </div>
  `;
}

function renderAdditionalSources() {
  document.getElementById('tab-additional-sources').innerHTML = `
    <div class="flex flex-wrap gap-3">
      <a href="#" class="bg-yellow-600 hover:bg-yellow-700 text-white px-4 py-2 rounded shadow">Alternate Source 1</a>
      <a href="#" class="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded shadow">Alternate Source 2</a>
    </div>
  `;
}

function renderEpisodes(tvData) {
  const container = document.getElementById('tab-episodes');
  container.innerHTML = '';

  tvData.seasons.forEach(season => {
    if (!season.poster_path) return;

    const seasonBlock = document.createElement('div');
    seasonBlock.innerHTML = `
      <h2 class="text-xl font-semibold mb-3 mt-6">Season ${season.season_number}</h2>
      <div class="relative rounded overflow-hidden shadow mb-4">
        <img src="https://image.tmdb.org/t/p/w780${season.poster_path}" class="w-full h-[250px] object-cover">
        <div class="absolute inset-0 bg-black bg-opacity-60 p-4 flex flex-col justify-end text-white">
          <p class="text-lg font-bold">#${season.episode_count} Episodes</p>
          <p class="text-sm mt-1">${season.overview || 'No synopsis available.'}</p>
        </div>
      </div>
    `;
    container.appendChild(seasonBlock);
  });
}

function setupTabs(type) {
  const tabs = document.querySelectorAll('.tab-btn');
  const panels = document.querySelectorAll('.tab-panel');

  tabs.forEach(btn => {
    btn.addEventListener('click', () => {
      panels.forEach(panel => panel.classList.add('hidden'));
      tabs.forEach(tab => tab.classList.remove('border-b-2', 'border-blue-500'));

      document.getElementById(`tab-${btn.dataset.tab}`).classList.remove('hidden');
      btn.classList.add('border-b-2', 'border-blue-500');
    });
  });

  // Show relevant tabs
  document.querySelector('[data-tab="sources"]').style.display = 'inline-block';
  document.querySelector('[data-tab="cast"]').style.display = 'inline-block';
  document.querySelector('[data-tab="recommended"]').style.display = 'inline-block';

  if (type === 'tv') {
    document.querySelector('[data-tab="episodes"]').style.display = 'inline-block';
    document.querySelector('[data-tab="additional-sources"]').style.display = 'inline-block';
  }

  // Default to first visible tab
  document.querySelector('.tab-btn:not([style*="display: none"])')?.click();
}

async function init() {
  if (!contentId || !contentType) return;

  const content = await fetchContentDetails(contentType, contentId);
  renderContentDetails(content);
  setupTabs(contentType);

  const { cast } = await fetchCredits(contentType, contentId);
  renderCast(cast);

  const { results } = await fetchRecommendations(contentType, contentId);
  renderRecommended(results);

  renderSources();

  if (contentType === 'tv') {
    renderAdditionalSources();
    renderEpisodes(content);
  }
}

document.addEventListener('DOMContentLoaded', () => {
  init();
});
