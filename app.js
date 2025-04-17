const API_KEY = 'e3afd4c89e3351edad9e875ff7a01f0c';
const BASE_URL = 'https://api.themoviedb.org/3';
const IMG_ORIGINAL = 'https://image.tmdb.org/t/p/original';
const IMG_W500 = 'https://image.tmdb.org/t/p/w500';

// Dynamically load header.html and add search logic
fetch('header.html')
  .then(res => res.text())
  .then(data => {
    document.getElementById('nav-placeholder').innerHTML = data;

    // Add search box handler after header is injected
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

// Format YYYY-MM-DD to MMM DD, YYYY
function formatDate(dateStr) {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' });
}

// Get movie genres as a { id: name } map
async function fetchGenres() {
  const res = await fetch(`${BASE_URL}/genre/movie/list?api_key=${API_KEY}`);
  const data = await res.json();
  return data.genres.reduce((acc, g) => {
    acc[g.id] = g.name;
    return acc;
  }, {});
}

// HERO SLIDER
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

// NEEK PICKS Section
async function loadNeekPicks(type = 'POPULAR') {
  const url = `${BASE_URL}/movie/${type.toLowerCase()}?api_key=${API_KEY}`;
  const res = await fetch(url);
  const data = await res.json();
  const container = document.getElementById('movieSection');

  container.innerHTML = data.results.slice(0, 18).map(movie => `
    <div class="rounded overflow-hidden shadow-md bg-[#111] hover:scale-105 transition transform duration-300 cursor-pointer">
      <img src="${IMG_W500 + movie.poster_path}" alt="${movie.title}" class="w-full h-auto">
      <div class="p-2 text-sm text-white">
        <h3 class="font-semibold">${movie.title}</h3>
        <p class="opacity-60 text-xs">${formatDate(movie.release_date)}</p>
      </div>
    </div>
  `).join('');
}

// Tab handling + Initial load
document.addEventListener('DOMContentLoaded', () => {
  loadHeroSlider();
  loadNeekPicks();

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
