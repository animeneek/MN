const API_KEY = 'e3afd4c89e3351edad9e875ff7a01f0c';
const urlParams = new URLSearchParams(window.location.search);
const contentType = urlParams.get('type');
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

function renderContentDetails(content) {
  const poster = content.poster_path ? `https://image.tmdb.org/t/p/w500${content.poster_path}` : 'https://via.placeholder.com/500x750?text=No+Image';
  document.getElementById('contentDetails').innerHTML = `
    <img src="${poster}" class="rounded shadow max-w-full" alt="${content.title || content.name}">
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
      <img class="w-24 h-24 object-cover rounded-full mx-auto" src="${actor.profile_path ? `https://image.tmdb.org/t/p/w185${actor.profile_path}` : 'https://via.placeholder.com/150x150?text=No+Image'}" alt="${actor.name}" />
      <p class="text-sm mt-2">${actor.name}</p>
      <p class="text-xs text-gray-500">${actor.character}</p>
    </div>
  `).join('');
  document.getElementById('tab-cast').innerHTML = `<div class="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-4">${castHTML}</div>`;
}

function renderRecommended(results) {
  const items = results.slice(0, 8).map(item => `
    <a href="content.html?type=${contentType}&id=${item.id}" class="rounded shadow overflow-hidden hover:scale-105 transition block">
      <img src="${item.poster_path ? `https://image.tmdb.org/t/p/w342${item.poster_path}` : 'https://via.placeholder.com/300x450?text=No+Image'}" class="w-full aspect-[2/3] object-cover" alt="${item.title || item.name}" />
      <div class="p-2 text-sm text-center">${item.title || item.name}</div>
    </a>
  `).join('');
  document.getElementById('tab-recommended').innerHTML = `<div class="grid grid-cols-2 md:grid-cols-4 gap-4">${items}</div>`;
}

function renderSources(id) {
  document.getElementById('tab-sources').innerHTML = `
    <button onclick="openModal('https://player.embed-api.stream/?id=${id}&type=movie')" class="bg-primary hover:bg-red-600 text-white px-4 py-2 rounded shadow">
      Watch on Source 1
    </button>
  `;
}

function renderAdditionalSources() {
  document.getElementById('tab-additional-sources').innerHTML = `
    <div class="text-sm text-gray-400 italic">No Additional Sources Yet</div>
  `;
}

async function renderEpisodes(tvData) {
  const container = document.getElementById('tab-episodes');
  container.innerHTML = '';

  for (const season of tvData.seasons) {
    if (season.season_number === 0) continue;

    const res = await fetch(`https://api.themoviedb.org/3/tv/${tvData.id}/season/${season.season_number}?api_key=${API_KEY}`);
    const seasonData = await res.json();

    const episodeBlocks = seasonData.episodes.map(ep => {
      const img = ep.still_path
        ? `https://image.tmdb.org/t/p/w780${ep.still_path}`
        : (season.poster_path ? `https://image.tmdb.org/t/p/w780${season.poster_path}` : (tvData.poster_path ? `https://image.tmdb.org/t/p/w780${tvData.poster_path}` : 'https://via.placeholder.com/780x439?text=No+Image'));

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

  document.querySelector('[data-tab="cast"]').style.display = 'inline-block';
  document.querySelector('[data-tab="recommended"]').style.display = 'inline-block';

  if (type === 'movie') {
    document.querySelector('[data-tab="sources"]').style.display = 'inline-block';
  } else {
    document.querySelector('[data-tab="sources"]').style.display = 'none';
    document.querySelector('[data-tab="episodes"]').style.display = 'inline-block';
    document.querySelector('[data-tab="additional-sources"]').style.display = 'inline-block';
  }

  document.querySelector('.tab-btn:not([style*="display: none"])')?.click();
}

function openModal(embedUrl) {
  const modal = document.getElementById('videoModal');
  const frame = document.getElementById('videoFrame');
  frame.src = embedUrl;
  modal.classList.remove('hidden');
}

document.getElementById('closeModal')?.addEventListener('click', () => {
  document.getElementById('videoModal').classList.add('hidden');
  document.getElementById('videoFrame').src = '';
});

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
    renderSources(contentId);
  } else {
    renderAdditionalSources();
    renderEpisodes(content);
  }
}

document.addEventListener('DOMContentLoaded', init);
