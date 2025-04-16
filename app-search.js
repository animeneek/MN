const API_KEY = 'e3afd4c89e3351edad9e875ff7a01f0c';
const BASE_URL = 'https://api.themoviedb.org/3';
const IMG_W500 = 'https://image.tmdb.org/t/p/w500';

let currentPage = 1;
let currentQuery = '';
let selectedGenre = '';
let selectedType = 'all';
let isLoading = false;
let hasMore = true;

async function fetchGenres() {
  const urls = [
    fetch(`${BASE_URL}/genre/movie/list?api_key=${API_KEY}`),
    fetch(`${BASE_URL}/genre/tv/list?api_key=${API_KEY}`)
  ];

  const [movieRes, tvRes] = await Promise.all(urls);
  const movieGenres = (await movieRes.json()).genres;
  const tvGenres = (await tvRes.json()).genres;
  const genreMap = {};

  [...movieGenres, ...tvGenres].forEach(genre => {
    genreMap[genre.id] = genre.name;
  });

  const uniqueGenres = Object.entries(genreMap).map(([id, name]) => ({ id, name }));

  const genreSelect = document.getElementById('genreSelect');
  genreSelect.innerHTML += uniqueGenres.map(g => `<option value="${g.id}">${g.name}</option>`).join('');
}

function formatDate(dateStr) {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' });
}

async function searchTMDB(query, page = 1, append = false) {
  if (isLoading || !hasMore) return;
  isLoading = true;

  const typeEndpoint = selectedType === 'all' ? 'multi' : selectedType;
  const res = await fetch(`${BASE_URL}/search/${typeEndpoint}?api_key=${API_KEY}&query=${query}&page=${page}`);
  const data = await res.json();

  const results = data.results.filter(item =>
    (selectedGenre ? item.genre_ids?.includes(parseInt(selectedGenre)) : true) &&
    (item.media_type !== 'person')
  );

  if (!append) {
    document.getElementById('results').innerHTML = '';
  }

  if (results.length === 0 && !append) {
    document.getElementById('results').innerHTML = '<p class="col-span-full text-center text-gray-400">No results found.</p>';
    return;
  }

  document.getElementById('results').insertAdjacentHTML('beforeend',
    results.map(item => `
      <a href="#" class="bg-gray-100 dark:bg-[#222] rounded shadow hover:scale-105 transition transform duration-200 overflow-hidden">
        <div class="aspect-[2/3] overflow-hidden">
          <img src="${item.poster_path ? IMG_W500 + item.poster_path : 'assets/fallback.jpg'}" alt="${item.title || item.name}" class="w-full h-full object-cover" />
        </div>
        <div class="p-2 text-sm text-center font-semibold">
          ${item.title || item.name}
          <p class="text-xs text-gray-400">${formatDate(item.release_date || item.first_air_date)}</p>
        </div>
      </a>
    `).join('')
  );

  currentPage = data.page + 1;
  hasMore = data.page < data.total_pages;
  isLoading = false;
}

function setupEvents() {
  const genreSelect = document.getElementById('genreSelect');
  const typeSelect = document.getElementById('typeSelect');
  const searchBox = document.getElementById('searchBox');

  genreSelect.addEventListener('change', () => {
    selectedGenre = genreSelect.value;
    resetSearch();
  });

  typeSelect.addEventListener('change', () => {
    selectedType = typeSelect.value;
    resetSearch();
  });

  searchBox?.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      currentQuery = searchBox.value.trim();
      resetSearch();
    }
  });

  window.addEventListener('scroll', () => {
    if ((window.innerHeight + window.scrollY) >= document.body.offsetHeight - 100) {
      searchTMDB(currentQuery, currentPage, true);
    }
  });
}

function resetSearch() {
  currentPage = 1;
  hasMore = true;
  searchTMDB(currentQuery, 1, false);
}

document.addEventListener('DOMContentLoaded', () => {
  fetchGenres();
  setupEvents();

  const navPlaceholder = document.getElementById("nav-placeholder");
  if (navPlaceholder) {
    fetch("header.html")
      .then(res => res.text())
      .then(html => {
        navPlaceholder.innerHTML = html;
      });
  }

  const params = new URLSearchParams(window.location.search);
  currentQuery = params.get('q') || '';
  searchTMDB(currentQuery, 1, false);
});
