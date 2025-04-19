const API_KEY = 'e3afd4c89e3351edad9e875ff7a01f0c';

fetch('header.html')
  .then(res => res.text())
  .then(data => {
    document.getElementById('nav-placeholder').innerHTML = data;
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

function imageUrl(path, size = 'w500', fallback = 'https://raw.githubusercontent.com/animeneek/MN/main/assets/Black%20and%20White%20Modern%20Coming%20soon%20Poster.png') {
  return path ? `https://image.tmdb.org/t/p/${size}${path}` : fallback;
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

async function fetchExternalSources() {
  const res = await fetch('https://raw.githubusercontent.com/animeneek/MovieNeek/main/MovieNeek.json');
  return await res.json();
}

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

function renderRecommended(results) {
  const items = results.slice(0, 8).map(item => `
    <a href="content.html?type=${contentType}&id=${item.id}" class="rounded shadow overflow-hidden hover:scale-105 transition block">
      <img src="${imageUrl(item.poster_path, 'w342')}" class="w-full aspect-[2/3] object-cover" alt="${item.title || item.name}" />
      <div class="p-2 text-sm text-center">${item.title || item.name}</div>
    </a>
  `).join('');
  document.getElementById('tab-recommended').innerHTML = `<div class="grid grid-cols-2 md:grid-cols-4 gap-4">${items}</div>`;
}

function renderDefaultMovieSource(id) {
  const container = document.getElementById('tab-sources');
  container.innerHTML = `
    <button onclick="openModal('https://player.embed-api.stream/?id=${id}&type=movie')" class="bg-primary hover:bg-red-600 text-white px-4 py-2 rounded shadow m-2">
      Watch on Source 1
    </button>
  `;
}

function renderAdditionalSourcesMessage() {
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

async function init() {
  if (!contentId || !contentType) return;

  const content = await fetchContentDetails(contentType, contentId);
  renderContentDetails(content);

  const { cast } = await fetchCredits(contentType, contentId);
  renderCast(cast);

  const { results } = await fetchRecommendations(contentType, contentId);
  renderRecommended(results);

  const allSources = await fetchExternalSources();
  const matchedSources = allSources.filter(src => src.TMDBID === parseInt(contentId));

  if (contentType === 'movie') {
    renderDefaultMovieSource(contentId);
  } else {
    renderAdditionalSourcesMessage();
    renderEpisodes(content);
  }
}

document.addEventListener('DOMContentLoaded', init);
