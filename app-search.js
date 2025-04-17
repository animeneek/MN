const TMDB_API_KEY = 'e3afd4c89e3351edad9e875ff7a01f0c';
const TMDB_BASE_URL = 'https://api.themoviedb.org/3';
const IMAGE_BASE_URL = 'https://image.tmdb.org/t/p/w500';

let currentQuery = '';
let selectedType = 'all'; // all | movie | tv
let selectedGenre = '';
let movieGenres = [];
let tvGenres = [];

const resultsContainer = document.getElementById('searchResults');
const genreDropdown = document.getElementById('genreDropdown');
const typeDropdown = document.getElementById('typeDropdown');
const genreFilter = document.getElementById('genreFilter');
const typeFilter = document.getElementById('typeFilter');
const searchInput = document.getElementById('searchBox');

// Get genres
async function fetchGenres() {
  const [movieGenreRes, tvGenreRes] = await Promise.all([
    fetch(`${TMDB_BASE_URL}/genre/movie/list?api_key=${TMDB_API_KEY}`).then(res => res.json()),
    fetch(`${TMDB_BASE_URL}/genre/tv/list?api_key=${TMDB_API_KEY}`).then(res => res.json())
  ]);

  movieGenres = movieGenreRes.genres;
  tvGenres = tvGenreRes.genres;

  const allGenres = [...movieGenres, ...tvGenres];
  const uniqueGenres = Array.from(new Map(allGenres.map(item => [item.id, item])).values());

  genreDropdown.innerHTML = `<option value="">All Genres</option>` + uniqueGenres.map(genre =>
    `<option value="${genre.id}">${genre.name}</option>`
  ).join('');
}

// Search
async function searchTMDB(query) {
  resultsContainer.innerHTML = '<p class="col-span-full text-center text-gray-500">Loading...</p>';

  let results = [];

  if (selectedType === 'movie' || selectedType === 'all') {
    const movieRes = await fetch(`${TMDB_BASE_URL}/search/movie?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(query)}`);
    const movieData = await movieRes.json();
    const filteredMovies = selectedGenre
      ? movieData.results.filter(item => item.genre_ids.includes(Number(selectedGenre)))
      : movieData.results;
    results.push(...filteredMovies.map(item => ({ ...item, media_type: 'movie' })));
  }

  if (selectedType === 'tv' || selectedType === 'all') {
    const tvRes = await fetch(`${TMDB_BASE_URL}/search/tv?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(query)}`);
    const tvData = await tvRes.json();
    const filteredTV = selectedGenre
      ? tvData.results.filter(item => item.genre_ids.includes(Number(selectedGenre)))
      : tvData.results;
    results.push(...filteredTV.map(item => ({ ...item, media_type: 'tv' })));
  }

  if (!results.length) {
    resultsContainer.innerHTML = '<p class="col-span-full text-center text-gray-400">No results found.</p>';
    return;
  }

  displayResults(results);
}

function displayResults(results) {
  resultsContainer.innerHTML = results.map(item => {
    const title = item.title || item.name || 'Untitled';
    const img = item.poster_path ? `${IMAGE_BASE_URL}${item.poster_path}` : 'assets/fallback.jpg';
    return `
      <a href="details.html?type=${item.media_type}&id=${item.id}" class="bg-white dark:bg-[#1e1e1e] rounded shadow hover:scale-105 transition transform duration-200 overflow-hidden" data-aos="fade-up">
        <div class="w-full aspect-[2/3] overflow-hidden">
          <img src="${img}" alt="${title}" class="w-full h-full object-cover" />
        </div>
        <div class="p-2 text-sm text-center font-semibold">${title}</div>
      </a>
    `;
  }).join('');
}

function updateURLQuery(query) {
  const url = new URL(window.location.href);
  url.searchParams.set('q', query);
  history.pushState({}, '', url);
}

// Event listeners
searchInput.addEventListener('keypress', e => {
  if (e.key === 'Enter') {
    const query = searchInput.value.trim();
    if (query || query === '') {
      currentQuery = query;
      updateURLQuery(currentQuery);
      searchTMDB(currentQuery);
    }
  }
});

typeFilter.addEventListener('change', () => {
  selectedType = typeFilter.value;
  if (currentQuery !== '') {
    searchTMDB(currentQuery);
  }
});

genreFilter.addEventListener('change', () => {
  selectedGenre = genreFilter.value;
  if (currentQuery !== '') {
    searchTMDB(currentQuery);
  }
});

// Load from URL param
window.addEventListener('DOMContentLoaded', () => {
  fetchGenres();
  const params = new URLSearchParams(window.location.search);
  currentQuery = params.get('q') || '';
  searchInput.value = currentQuery;
  if (currentQuery) {
    searchTMDB(currentQuery);
  }
});
