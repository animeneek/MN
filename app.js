// app.js

const API_KEY = 'e3afd4c89e3351edad9e875ff7a01f0c';
const BASE_URL = 'https://api.themoviedb.org/3';
const IMG_ORIGINAL = 'https://image.tmdb.org/t/p/original';
const IMG_W500 = 'https://image.tmdb.org/t/p/w500';

// Load Hero Slider (Trending Movies)
async function loadHeroSlider() {
  const res = await fetch(`${BASE_URL}/trending/movie/week?api_key=${API_KEY}`);
  const data = await res.json();
  const sliderWrapper = document.getElementById('sliderWrapper');

  sliderWrapper.innerHTML = data.results.slice(0, 5).map(movie => `
    <div class="absolute inset-0 bg-cover bg-center animate-fade" style="background-image: url('${IMG_ORIGINAL + movie.backdrop_path}')">
      <div class="absolute bottom-10 left-10 z-30 text-white max-w-xl">
        <h2 class="text-2xl md:text-4xl font-bold mb-2">${movie.title}</h2>
        <p class="hidden md:block text-sm md:text-base">${movie.overview.slice(0, 180)}...</p>
      </div>
    </div>
  `).join('');

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
async function loadNeekPicks(type = 'TRENDING') {
  let url = '';
  if (type === 'TRENDING') {
    url = `${BASE_URL}/trending/movie/week?api_key=${API_KEY}`;
  } else if (type === 'POPULAR') {
    url = `${BASE_URL}/movie/popular?api_key=${API_KEY}`;
  } else if (type === 'TOP') {
    url = `${BASE_URL}/movie/top_rated?api_key=${API_KEY}`;
  }

  const res = await fetch(url);
  const data = await res.json();
  const container = document.getElementById('movieSection');

  container.innerHTML = data.results.slice(0, 18).map(movie => `
    <div class="rounded overflow-hidden shadow-md bg-[#111] hover:scale-105 transition transform duration-300 cursor-pointer">
      <img src="${IMG_W500 + movie.poster_path}" alt="${movie.title}" class="w-full h-auto">
      <div class="p-2 text-sm text-white">
        <h3 class="font-semibold">${movie.title}</h3>
        <p class="opacity-60 text-xs">${movie.release_date}</p>
      </div>
    </div>
  `).join('');
}

// Tab Events
document.addEventListener('DOMContentLoaded', () => {
  loadHeroSlider();
  loadNeekPicks();

  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.tab-btn').forEach(b => b.style.backgroundColor = '#222');
      btn.style.backgroundColor = '#ff4444';
      loadNeekPicks(btn.dataset.type);
    });
  });
});
