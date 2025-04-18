const API_KEY = 'e3afd4c89e3351edad9e875ff7a01f0c';
const BASE_URL = 'https://api.themoviedb.org/3';
const IMG_W500 = 'https://image.tmdb.org/t/p/w500';
const FALLBACK_IMG = 'https://github.com/animeneek/MN/blob/main/assets/Black%20and%20White%20Modern%20Coming%20soon%20Poster.png?raw=true';

let currentPage = 1;
let currentQuery = '';
let selectedGenres = [];
let selectedType = 'all';
let selectedYear = '';
let genreMap = {};
let isLoading = false;

function getQueryParam(param) {
  return new URLSearchParams(window.location.search).get(param);
}

function formatDate(dateStr) {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' });
}

async function fetchGenres() {
  const movieRes = await fetch(`${BASE_URL}/genre/movie/list?api_key=${API_KEY}`).then(res => res.json());
  const tvRes = await fetch(`${BASE_URL}/genre/tv/list?api_key=${API_KEY}`).then(res => res.json());

  const combined = [...movieRes.genres, ...tvRes.genres];
  const uniqueGenres = Array.from(new Map(combined.map(g => [g.id, g])).values());

  genreMap = {};
  uniqueGenres.forEach(g => genreMap[g.id] = g.name);

  const genreOptions = document.getElementById('genreOptions');
  genreOptions.innerHTML = uniqueGenres.map(g => `
    <label class="flex items-center space-x-2 text-sm text-white">
      <input type="checkbox" value="${g.id}" class="genre-checkbox" />
      <span>${g.name}</span>
    </label>
  `).join('');
}

async function fetchAllContent(page = 1) {
  const movieURL = `${BASE_URL}/discover/movie?api_key=${API_KEY}&page=${page}`;
  const tvURL = `${BASE_URL}/discover/tv?api_key=${API_KEY}&page=${page}`;
  const [movieRes, tvRes] = await Promise.all([
    fetch(movieURL).then(res => res.json()),
    fetch(tvURL).then(res => res.json())
  ]);
  return [...movieRes.results.map(r => ({ ...r, media_type: 'movie' })), ...tvRes.results.map(r => ({ ...r, media_type: 'tv' }))];
}

async function searchMovies(query, page = 1, append = false) {
  if (isLoading) return;
  isLoading = true;

  const results = document.getElementById('results');
  if (!append) results.innerHTML = '<p class="col-span-full text-center text-gray-400">Searching...</p>';

  let data = [];

  if (query) {
    let endpoint = selectedType === 'movie' ? 'movie' : selectedType === 'tv' ? 'tv' : 'multi';
    const url = `${BASE_URL}/search/${endpoint}?api_key=${API_KEY}&query=${encodeURIComponent(query)}&page=${page}`;
    const res = await fetch(url);
    const json = await res.json();
    data = json.results || [];
  } else {
    data = await fetchAllContent(page);
  }

  const filtered = data.filter(item => {
    const mediaType = item.media_type || selectedType;
    if (mediaType !== 'movie' && mediaType !== 'tv') return false;

    const typeMatch =
      selectedType === 'all' ||
      (selectedType === 'movie' && mediaType === 'movie') ||
      (selectedType === 'tv' && mediaType === 'tv');

    const genreMatch =
      selectedGenres.length === 0 ||
      (item.genre_ids && selectedGenres.every(id => item.genre_ids.includes(parseInt(id))));

    const year = (item.release_date || item.first_air_date || '').split('-')[0];
    const yearMatch = selectedYear === '' || year === selectedYear;

    return typeMatch && genreMatch && yearMatch;
  });

  if (!append && filtered.length === 0) {
    results.innerHTML = '<p class="col-span-full text-center text-gray-500">No results found.</p>';
    isLoading = false;
    return;
  }

  const html = filtered.map(item => {
    const title = item.title || item.name || 'Untitled';
    const img = item.poster_path ? IMG_W500 + item.poster_path : FALLBACK_IMG;
    const date = item.release_date || item.first_air_date || '';
    return `
      <div class="rounded overflow-hidden shadow-md bg-[#111] hover:scale-105 transition transform duration-300 cursor-pointer" data-aos="fade-up">
        <div class="w-full aspect-[2/3] bg-black">
          <img src="${img}" alt="${title}" class="w-full h-full object-cover" onerror="this.onerror=null;this.src='${FALLBACK_IMG}'">
        </div>
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

  currentPage++;
  isLoading = false;
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

    if (e.target.id === 'yearSelect') {
      selectedYear = e.target.value;
    }

    currentPage = 1;
    searchMovies(currentQuery, 1, false);
  });
}

function attachSearchInputHandler() {
  const input = document.querySelector('#searchBox');
  if (!input) return;

  input.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      const q = input.value.trim();
      // Always redirect, even if empty
      window.location.href = `search.html?q=${encodeURIComponent(q)}`;
    }
  });
}

function populateYearDropdown() {
  const yearSelect = document.getElementById('yearSelect');
  if (!yearSelect) return;

  const currentYear = new Date().getFullYear();
  for (let y = currentYear; y >= 1900; y--) {
    const option = document.createElement('option');
    option.value = y;
    option.textContent = y;
    yearSelect.appendChild(option);
  }
}

document.addEventListener('DOMContentLoaded', async () => {
  populateYearDropdown();
  await fetchGenres();
  setupDropdowns();
  setupFilters();

  fetch('header.html')
    .then(res => res.text())
    .then(html => {
      document.getElementById('nav-placeholder').innerHTML = html;
      attachSearchInputHandler(); // Attach after header loads
    });

  currentQuery = getQueryParam('q') || '';
  if (currentQuery !== null) {
    document.getElementById('searchBox')?.setAttribute('value', currentQuery);
    searchMovies(currentQuery, 1, false);
  }

  window.addEventListener('scroll', () => {
    if ((window.innerHeight + window.scrollY) >= document.body.offsetHeight - 200) {
      searchMovies(currentQuery, currentPage, true);
    }
  });
});
