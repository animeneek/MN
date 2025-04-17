const API_KEY = 'e3afd4c89e3351edad9e875ff7a01f0c';
const BASE_URL = 'https://api.themoviedb.org/3';
const IMG_W500 = 'https://image.tmdb.org/t/p/w500';

let currentPage = 1;
let isLoading = false;
let hasMoreResults = true;
let currentQuery = '';
let selectedGenres = [];
let selectedType = 'all';

function getQueryParam(param) {
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get(param);
}

function formatDate(dateStr) {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' });
}

function fetchGenres() {
  fetch(`${BASE_URL}/genre/movie/list?api_key=${API_KEY}`)
    .then(res => res.json())
    .then(data => {
      const genreOptions = document.getElementById('genreOptions');
      genreOptions.innerHTML = data.genres.map(genre => `
        <label class="flex items-center space-x-2 text-sm text-white">
          <input type="checkbox" value="${genre.id}" class="genre-checkbox" />
          <span>${genre.name}</span>
        </label>
      `).join('');
    });
}

function searchContent(query, genres = [], type = 'all', page = 1, append = false) {
  if (isLoading || !hasMoreResults) return;
  isLoading = true;

  const results = document.getElementById('results');
  if (!append) results.innerHTML = '<p class="col-span-full text-center text-gray-400">Loading...</p>';

  let endpoint = `${BASE_URL}/search/multi?api_key=${API_KEY}&query=${encodeURIComponent(query)}&page=${page}`;
  
  fetch(endpoint)
    .then(res => res.json())
    .then(data => {
      const validResults = data.results.filter(item =>
        (type === 'all' || item.media_type === type) &&
        (genres.length === 0 || item.genre_ids?.some(id => genres.includes(id)))
      );

      if (!validResults.length && !append) {
        results.innerHTML = '<p class="col-span-full text-center text-gray-500">No results found.</p>';
        return;
      }

      const cardsHTML = validResults.map(item => `
        <div class="rounded overflow-hidden shadow-md bg-[#111] hover:scale-105 transition transform duration-300 cursor-pointer" data-aos="fade-up">
          <img src="${item.poster_path ? IMG_W500 + item.poster_path : 'assets/fallback.jpg'}" alt="${item.title || item.name}" class="w-full h-auto">
          <div class="p-2 text-sm text-white">
            <h3 class="font-semibold">${item.title || item.name}</h3>
            <p class="opacity-60 text-xs">${formatDate(item.release_date || item.first_air_date)}</p>
          </div>
        </div>
      `).join('');

      if (append) {
        results.insertAdjacentHTML('beforeend', cardsHTML);
      } else {
        results.innerHTML = cardsHTML;
      }

      hasMoreResults = data.page < data.total_pages;
      currentPage++;
    })
    .catch(() => {
      results.innerHTML = '<p class="text-red-500 col-span-full text-center">Failed to load results.</p>';
    })
    .finally(() => {
      isLoading = false;
    });
}

function setupDropdowns() {
  const genreBtn = document.getElementById('genreDropdownBtn');
  const genreDropdown = document.getElementById('genreDropdown');

  genreBtn.addEventListener('click', () => genreDropdown.classList.toggle('hidden'));

  document.addEventListener('click', (e) => {
    if (!genreDropdown.contains(e.target) && e.target !== genreBtn) genreDropdown.classList.add('hidden');
  });
}

function setupFilters() {
  document.addEventListener('change', (e) => {
    if (e.target.classList.contains('genre-checkbox')) {
      selectedGenres = Array.from(document.querySelectorAll('.genre-checkbox:checked')).map(cb => parseInt(cb.value));
      document.getElementById('genreDropdownBtn').textContent = selectedGenres.length ? `${selectedGenres.length} selected` : 'Select Genres';
    }

    if (e.target.id === 'typeFilter') {
      selectedType = e.target.value;
    }

    currentPage = 1;
    hasMoreResults = true;
    searchContent(currentQuery, selectedGenres, selectedType, 1, false);
  });
}

function setupSearchHandler() {
  const input = document.getElementById('searchBox');
  if (input) {
    input.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        const query = input.value.trim();
        if (query) {
          window.location.href = `search.html?q=${encodeURIComponent(query)}`;
        }
      }
    });
  }
}

document.addEventListener('DOMContentLoaded', () => {
  const query = getQueryParam('q');
  currentQuery = query || '';
  fetch('header.html').then(res => res.text()).then(html => {
    document.getElementById('nav-placeholder').innerHTML = html;
    setupSearchHandler();
  });

  fetchGenres();
  setupDropdowns();
  setupFilters();
  searchContent(currentQuery, selectedGenres, selectedType, 1, false);

  window.addEventListener('scroll', () => {
    if ((window.innerHeight + window.scrollY) >= document.body.offsetHeight - 200) {
      searchContent(currentQuery, selectedGenres, selectedType, currentPage, true);
    }
  });
});
