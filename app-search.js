const API_KEY = 'e3afd4c89e3351edad9e875ff7a01f0c';
const BASE_URL = 'https://api.themoviedb.org/3';
const IMG_W500 = 'https://image.tmdb.org/t/p/w500';
const FALLBACK_IMG = 'https://github.com/animeneek/MN/blob/main/assets/Black%20and%20White%20Modern%20Coming%20soon%20Poster.png?raw=true';

let currentPage = 1;
let isLoading = false;
let hasMoreResults = true;
let currentQuery = '';
let selectedGenres = [];
let selectedType = 'all';
let genreMap = {};

function getQueryParam(param) {
  return new URLSearchParams(window.location.search).get(param);
}

function formatDate(dateStr) {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' });
}

function fetchGenres() {
  fetch(`${BASE_URL}/genre/movie/list?api_key=${API_KEY}`)
    .then(res => res.json())
    .then(data => {
      genreMap = {};
      data.genres.forEach(g => genreMap[g.id] = g.name);
      const genreOptions = document.getElementById('genreOptions');
      genreOptions.innerHTML = data.genres.map(g => `
        <label class="flex items-center space-x-2 text-sm text-white">
          <input type="checkbox" value="${g.id}" class="genre-checkbox" />
          <span>${g.name}</span>
        </label>
      `).join('');
    });
}

function searchMovies(query, page = 1, append = false) {
  if (isLoading || !hasMoreResults) return;
  isLoading = true;

  const results = document.getElementById('results');
  if (!append) results.innerHTML = '<p class="col-span-full text-center text-gray-400">Searching...</p>';

  let url = `${BASE_URL}/search/multi?api_key=${API_KEY}&query=${encodeURIComponent(query)}&page=${page}`;

  fetch(url)
    .then(res => res.json())
    .then(data => {
      const filtered = data.results.filter(item => {
        const typeMatch =
          selectedType === 'all' ||
          (selectedType === 'movie' && item.media_type === 'movie') ||
          (selectedType === 'tv' && item.media_type === 'tv');

        const genreMatch = selectedGenres.length === 0 || (
          item.genre_ids && selectedGenres.every(id => item.genre_ids.includes(parseInt(id)))
        );

        return typeMatch && genreMatch;
      });

      if (!append && !filtered.length) {
        results.innerHTML = '<p class="col-span-full text-center text-gray-500">No results found.</p>';
        return;
      }

      const html = filtered.map(item => {
        const title = item.title || item.name || 'Untitled';
        const img = item.poster_path ? IMG_W500 + item.poster_path : FALLBACK_IMG;
        const date = item.release_date || item.first_air_date || '';
        return `
          <div class="rounded overflow-hidden shadow-md bg-[#111] hover:scale-105 transition transform duration-300 cursor-pointer" data-aos="fade-up">
            <img src="${img}" alt="${title}" class="w-full h-auto" onerror="this.onerror=null;this.src='${FALLBACK_IMG}'">
            <div class="p-2 text-sm text-white">
              <h3 class="font-semibold">${title}</h3>
              <p class="opacity-60 text-xs">${formatDate(date)}</p>
            </div>
          </div>`;
      }).join('');

      if (append) {
        results.insertAdjacentHTML('beforeend', html);
      } else {
        results.innerHTML = html;
      }

      hasMoreResults = data.page < data.total_pages;
      currentPage = data.page + 1;
    })
    .catch(err => {
      console.error(err);
      results.innerHTML = '<p class="text-red-500 col-span-full text-center">Failed to fetch results.</p>';
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
      selectedGenres = Array.from(document.querySelectorAll('.genre-checkbox:checked')).map(cb => cb.value);
      document.getElementById('genreDropdownBtn').textContent = selectedGenres.length
        ? selectedGenres.map(id => genreMap[id]).join(', ')
        : 'Select Genres';
    }
    if (e.target.id === 'typeSelect') {
      selectedType = e.target.value;
    }

    currentPage = 1;
    hasMoreResults = true;
    searchMovies(currentQuery, 1, false);
  });
}

function setupSearchHandler() {
  const searchBox = document.getElementById('searchBox');
  if (searchBox) {
    searchBox.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        const q = searchBox.value.trim();
        if (q) {
          window.location.href = `search.html?q=${encodeURIComponent(q)}`;
        }
      }
    });
  }
}

document.addEventListener('DOMContentLoaded', () => {
  fetchGenres();
  setupDropdowns();
  setupFilters();
  setupSearchHandler();

  fetch('header.html')
    .then(res => res.text())
    .then(html => {
      document.getElementById('nav-placeholder').innerHTML = html;
      setupSearchHandler();
    });

  currentQuery = getQueryParam('q') || '';
  if (currentQuery) {
    document.getElementById('searchBox')?.setAttribute('value', currentQuery);
    searchMovies(currentQuery, 1, false);
  }

  window.addEventListener('scroll', () => {
    if ((window.innerHeight + window.scrollY) >= document.body.offsetHeight - 200) {
      searchMovies(currentQuery, currentPage, true);
    }
  });
});
