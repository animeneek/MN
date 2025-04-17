const API_KEY = 'e3afd4c89e3351edad9e875ff7a01f0c';
const BASE_URL = 'https://api.themoviedb.org/3';
const IMG_W500 = 'https://image.tmdb.org/t/p/w500';

const searchBox = document.getElementById('searchBox');
const genreFilter = document.getElementById('genreFilter');
const typeFilter = document.getElementById('typeFilter');
const resultsContainer = document.getElementById('results');
const navPlaceholder = document.getElementById('nav-placeholder');

let allGenres = {};

async function loadGenres() {
  const movieGenres = await fetch(`${BASE_URL}/genre/movie/list?api_key=${API_KEY}`).then(r => r.json());
  const tvGenres = await fetch(`${BASE_URL}/genre/tv/list?api_key=${API_KEY}`).then(r => r.json());

  [...movieGenres.genres, ...tvGenres.genres].forEach(genre => {
    allGenres[genre.id] = genre.name;
  });

  const uniqueGenres = Object.entries(allGenres).map(([id, name]) =>
    `<option value="${id}">${name}</option>`
  );
  genreFilter.innerHTML += uniqueGenres.join('');
}

function formatDate(dateStr) {
  const date = new Date(dateStr);
  return isNaN(date) ? '' : date.toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' });
}

async function searchTMDB(query, type = 'all', genreId = '') {
  resultsContainer.innerHTML = '<p class="col-span-full text-center text-gray-400">Loading...</p>';

  let endpoints = [];
  if (type === 'all' || type === 'movie') {
    endpoints.push(`${BASE_URL}/search/movie?api_key=${API_KEY}&query=${encodeURIComponent(query)}`);
  }
  if (type === 'all' || type === 'tv') {
    endpoints.push(`${BASE_URL}/search/tv?api_key=${API_KEY}&query=${encodeURIComponent(query)}`);
  }

  const responses = await Promise.all(endpoints.map(url => fetch(url).then(r => r.json())));
  const allResults = responses.flatMap(res => res.results || []);

  const filtered = allResults.filter(item =>
    !genreId || item.genre_ids.includes(Number(genreId))
  );

  if (!filtered.length) {
    resultsContainer.innerHTML = '<p class="col-span-full text-center text-gray-400">No results found.</p>';
    return;
  }

  const html = filtered.map(item => {
    const title = item.title || item.name;
    const date = item.release_date || item.first_air_date;
    const image = item.poster_path ? IMG_W500 + item.poster_path : 'assets/fallback.jpg';
    return `
      <div class="bg-[#111] rounded shadow overflow-hidden hover:scale-105 transition duration-300">
        <img src="${image}" alt="${title}" class="w-full aspect-[2/3] object-cover">
        <div class="p-2 text-sm text-white">
          <h3 class="font-semibold truncate">${title}</h3>
          <p class="opacity-60 text-xs">${formatDate(date)}</p>
        </div>
      </div>
    `;
  }).join('');

  resultsContainer.innerHTML = html;
}

function setupHandlers() {
  // Listen for Enter key on search
  document.addEventListener('keypress', e => {
    if (e.key === 'Enter') {
      const query = (document.getElementById('searchBox')?.value || '').trim();
      const type = typeFilter.value;
      const genre = genreFilter.value;
      searchTMDB(query, type, genre);
    }
  });

  // Filter changes
  genreFilter.addEventListener('change', () => {
    const query = new URLSearchParams(window.location.search).get('q') || '';
    searchTMDB(query, typeFilter.value, genreFilter.value);
  });

  typeFilter.addEventListener('change', () => {
    const query = new URLSearchParams(window.location.search).get('q') || '';
    searchTMDB(query, typeFilter.value, genreFilter.value);
  });
}

document.addEventListener('DOMContentLoaded', async () => {
  await loadGenres();
  setupHandlers();

  const query = new URLSearchParams(window.location.search).get('q') || '';
  searchTMDB(query, typeFilter.value, genreFilter.value);

  if (navPlaceholder) {
    fetch('header.html')
      .then(res => res.text())
      .then(html => {
        navPlaceholder.innerHTML = html;
      });
  }
});
