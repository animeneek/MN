const API_KEY = 'e3afd4c89e3351edad9e875ff7a01f0c';
const BASE_URL = 'https://api.themoviedb.org/3';
const IMG_W500 = 'https://image.tmdb.org/t/p/w500';

// Inject header
fetch('header.html')
  .then(res => res.text())
  .then(data => {
    document.getElementById('nav-placeholder').innerHTML = data;
    setupSearchInput(); // Enable search bar to work here too
  });

function getQueryParam(param) {
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get(param);
}

function formatDate(dateStr) {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' });
}

function searchMovies(query) {
  if (!query) return;
  const results = document.getElementById('results');
  results.innerHTML = '<p class="col-span-full text-center text-gray-400">Searching...</p>';

  fetch(`${BASE_URL}/search/movie?api_key=${API_KEY}&query=${encodeURIComponent(query)}`)
    .then(res => res.json())
    .then(data => {
      if (!data.results.length) {
        results.innerHTML = '<p class="col-span-full text-center text-gray-500">No results found.</p>';
        return;
      }

      results.innerHTML = data.results.map(movie => `
        <div class="rounded overflow-hidden shadow-md bg-[#111] hover:scale-105 transition transform duration-300 cursor-pointer" data-aos="fade-up">
          <img src="${movie.poster_path ? IMG_W500 + movie.poster_path : 'assets/fallback.jpg'}" alt="${movie.title}" class="w-full h-auto">
          <div class="p-2 text-sm text-white">
            <h3 class="font-semibold">${movie.title}</h3>
            <p class="opacity-60 text-xs">${formatDate(movie.release_date || '')}</p>
          </div>
        </div>
      `).join('');
    })
    .catch(() => {
      results.innerHTML = '<p class="text-red-500 col-span-full text-center">Failed to fetch results.</p>';
    });
}

// Reuse search bar for submitting a new query
function setupSearchInput() {
  const input = document.getElementById('searchBox');
  if (input) {
    input.addEventListener('keypress', e => {
      if (e.key === 'Enter') {
        const q = input.value.trim();
        if (q) {
          window.location.href = `search.html?q=${encodeURIComponent(q)}`;
        }
      }
    });
  }
}

// On page load
document.addEventListener('DOMContentLoaded', () => {
  const query = getQueryParam('q');
  if (query) {
    document.getElementById('searchBox')?.setAttribute('value', query);
    searchMovies(query);
  }
});
