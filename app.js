const API_KEY = 'e3afd4c89e3351edad9e875ff7a01f0c';
const BASE_URL = 'https://api.themoviedb.org/3';
const IMG_ORIGINAL = 'https://image.tmdb.org/t/p/original';
const IMG_W500 = 'https://image.tmdb.org/t/p/w500';

// Load header and search logic
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

// Inject footer.html
fetch('footer.html')
  .then(res => res.text())
  .then(data => {
    document.getElementById('footer-placeholder').innerHTML = data;
  });

// Format date
function formatDate(dateStr) {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' });
}

// Fetch genre map
async function fetchGenres() {
  const res = await fetch(`${BASE_URL}/genre/movie/list?api_key=${API_KEY}`);
  const data = await res.json();
  return data.genres.reduce((acc, g) => {
    acc[g.id] = g.name;
    return acc;
  }, {});
}

// Hero Slider
async function loadHeroSlider() {
  const res = await fetch(`${BASE_URL}/trending/movie/week?api_key=${API_KEY}`);
  const data = await res.json();
  const genresMap = await fetchGenres();
  const sliderWrapper = document.getElementById('sliderWrapper');

  sliderWrapper.innerHTML = data.results.slice(0, 5).map(movie => {
    const genreNames = movie.genre_ids.map(id => genresMap[id]).join(', ');
    return `
      <div class="absolute inset-0 bg-cover bg-center animate-fade" style="background-image: url('${IMG_ORIGINAL + movie.backdrop_path}')">
        <div class="absolute bottom-10 left-10 z-30 text-white max-w-xl">
          <h2 class="text-2xl md:text-4xl font-bold mb-2">${movie.title}</h2>
          <p class="text-sm opacity-80 mb-1">${genreNames}</p>
          <p class="hidden md:block text-sm md:text-base">${movie.overview?.slice(0, 180)}...</p>
        </div>
      </div>
    `;
  }).join('');

  startSlider();
}

let currentSlide = 0;
function startSlider() {
  const slides = document.querySelectorAll('#sliderWrapper > div');
  slides.forEach((slide, i) => slide.style.display = i === 0 ? 'block' : 'none');

  setInterval(() => {
    slides[currentSlide].style.display = 'none';
    currentSlide = (currentSlide + 1) % slides.length;
    slides[currentSlide].style.display = 'block';
  }, 5000);
}

// Load Neek Picks
async function loadNeekPicks(type = 'POPULAR') {
  const url = `${BASE_URL}/movie/${type.toLowerCase()}?api_key=${API_KEY}`;
  const res = await fetch(url);
  const data = await res.json();
  const container = document.getElementById('movieSection');

  container.innerHTML = data.results.slice(0, 18).map(movie => `
    <div class="rounded overflow-hidden shadow-md bg-[#111] hover:scale-105 transition transform duration-300 cursor-pointer content-card" data-id="${movie.id}" data-type="movie">
      <img src="${IMG_W500 + movie.poster_path}" alt="${movie.title}" class="w-full h-auto">
      <div class="p-2 text-sm text-white">
        <h3 class="font-semibold">${movie.title}</h3>
        <p class="opacity-60 text-xs">${formatDate(movie.release_date)}</p>
      </div>
    </div>
  `).join('');

  container.querySelectorAll('.content-card').forEach(card => {
    card.addEventListener('click', () => {
      const id = card.dataset.id;
      const type = card.dataset.type;
      const movie = data.results.find(m => m.id == id);
      saveToContinueWatching(movie);
      window.location.href = `info.html?id=${id}&type=${type}`;
    });
  });
}

// Save to localStorage
function saveToContinueWatching(movie) {
  let stored = JSON.parse(localStorage.getItem('continueWatching')) || [];
  stored = stored.filter(item => item.id !== movie.id);
  stored.unshift(movie);
  if (stored.length > 12) stored.pop();
  localStorage.setItem('continueWatching', JSON.stringify(stored));
}

// Load from localStorage
function loadContinueWatching() {
  const container = document.getElementById('continueWatching');
  if (!container) return;

  const stored = JSON.parse(localStorage.getItem('continueWatching')) || [];
  if (stored.length === 0) {
    container.innerHTML = '<p class="text-sm text-gray-400">No recently watched movies.</p>';
    return;
  }

  container.innerHTML = stored.map(movie => `
    <div class="rounded overflow-hidden shadow-md bg-[#111] hover:scale-105 transition transform duration-300 cursor-pointer content-card" data-id="${movie.id}" data-type="movie">
      <img src="${IMG_W500 + movie.poster_path}" alt="${movie.title}" class="w-full h-auto">
      <div class="p-2 text-sm text-white">
        <h3 class="font-semibold">${movie.title}</h3>
        <p class="opacity-60 text-xs">${formatDate(movie.release_date)}</p>
      </div>
    </div>
  `).join('');

  container.querySelectorAll('.content-card').forEach(card => {
    card.addEventListener('click', () => {
      const id = card.dataset.id;
      const type = card.dataset.type;
      window.location.href = `info.html?id=${id}&type=${type}`;
    });
  });
}

// Init
document.addEventListener('DOMContentLoaded', () => {
  loadHeroSlider();
  loadNeekPicks();
  loadContinueWatching();

  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.tab-btn').forEach(b => {
        b.classList.remove('bg-[#ff4444]', 'text-white');
        b.classList.add('bg-transparent');
      });
      btn.classList.remove('bg-transparent');
      btn.classList.add('bg-[#ff4444]', 'text-white');

      const type = btn.dataset.type;
      loadNeekPicks(type);
    });
  });
});
