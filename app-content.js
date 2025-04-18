const API_KEY = 'e3afd4c89e3351edad9e875ff7a01f0c';
const urlParams = new URLSearchParams(window.location.search);
const contentType = urlParams.get('type');
const contentId = urlParams.get('id');

function openModal(embedUrl) {
  document.getElementById('playerFrame').src = embedUrl;
  document.getElementById('modal').classList.remove('hidden');
}
function closeModal() {
  document.getElementById('modal').classList.add('hidden');
  document.getElementById('playerFrame').src = '';
}

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
async function fetchSeasonEpisodes(tvId, seasonNum) {
  const res = await fetch(`https://api.themoviedb.org/3/tv/${tvId}/season/${seasonNum}?api_key=${API_KEY}`);
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
      <img src="https://image.tmdb.org/t/p/w300${item.poster_path}" class="w-full aspect-[2/3] object-cover" alt="${item.title || item.name}" />
      <div class="p-2 text-sm text-center">${item.title || item.name}</div>
    </a>
  `).join('');
  document.getElementById('tab-recommended').innerHTML = `<div class="grid grid-cols-2 md:grid-cols-4 gap-4">${items}</div>`;
}

function renderSources() {
  document.getElementById('tab-sources').innerHTML = `
    <button class="bg-redmain hover:opacity-90 text-white px-4 py-2 rounded shadow" onclick="openModal('https://player.embed-api.stream/?id=${contentId}&type=movie')">
      Watch on Source 1
    </button>
  `;
}

function renderAdditionalSources() {
  document.getElementById('tab-additional-sources').innerHTML = `
    <p class="text-sm mb-2">No Additional Sources Yet</p>
  `;
}

async function renderEpisodes(content) {
  const container = document.getElementById('tab-episodes');
  container.innerHTML = '';

  for (const season of content.seasons) {
    if (season.season_number === 0) continue;
    const seasonData = await fetchSeasonEpisodes(contentId, season.season_number);
    const seasonBlock = document.createElement('div');
    seasonBlock.innerHTML = `
      <h2 class="text-xl font-semibold mb-3 mt-6">Season ${season.season_number}</h2>
      <div class="grid gap-4 grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
        ${seasonData.episodes.map(ep => `
          <div class="bg-gray-800 rounded overflow-hidden shadow cursor-pointer hover:scale-[1.02] transition" onclick="openModal('https://player.embed-api.stream/?id=${contentId}&s=${season.season_number}&e=${ep.episode_number}')">
            <img src="https://image.tmdb.org/t/p/w500${ep.still_path}" class="w-full h-40 object-cover" alt="${ep.name}">
            <div class="p-2">
              <p class="text-sm font-semibold">Ep ${ep.episode_number}: ${ep.name}</p>
              <p class="text-xs text-gray-400">${ep.overview || 'No synopsis available.'}</p>
            </div>
          </div>
        `).join('')}
      </div>
    `;
    container.appendChild(seasonBlock);
  }
}

function setupTabs(type) {
  const tabs = document.querySelectorAll('.tab-btn');
  const panels = document.querySelectorAll('.tab-panel');

  tabs.forEach(btn => {
    btn.addEventListener('click', () => {
      panels.forEach(panel => panel.classList.add('hidden'));
      tabs.forEach(tab => tab.classList.remove('border-b-2', 'border-redmain'));
      const panel = document.getElementById(`tab-${btn.dataset.tab}`);
      if (panel) {
        panel.classList.remove('hidden');
        btn.classList.add('border-b-2', 'border-redmain');
      }
    });
  });

  // Show only relevant tabs
  document.querySelector('[data-tab="cast"]').style.display = 'inline-block';
  document.querySelector('[data-tab="recommended"]').style.display = 'inline-block';

  if (type === 'tv') {
    document.querySelector('[data-tab="episodes"]').style.display = 'inline-block';
    document.querySelector('[data-tab="additional-sources"]').style.display = 'inline-block';
    document.querySelector('[data-tab="sources"]').style.display = 'none';
  } else {
    document.querySelector('[data-tab="sources"]').style.display = 'inline-block';
    document.querySelector('[data-tab="episodes"]').style.display = 'none';
    document.querySelector('[data-tab="additional-sources"]').style.display = 'none';
  }

  const firstVisibleTab = Array.from(tabs).find(btn => btn.style.display !== 'none');
  firstVisibleTab?.click();
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

  if (contentType === 'movie') {
    renderSources();
  } else {
    renderAdditionalSources();
    await renderEpisodes(content);
  }
}

document.addEventListener('DOMContentLoaded', init);
