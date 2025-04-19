const API_KEY = 'e3afd4c89e3351edad9e875ff7a01f0c';
const BASE_URL = 'https://api.themoviedb.org/3';
const IMG_W500 = 'https://image.tmdb.org/t/p/w500';
const IMG_ORIGINAL = 'https://image.tmdb.org/t/p/original';
const FALLBACK_IMG = 'https://github.com/animeneek/MN/blob/main/assets/Black%20and%20White%20Modern%20Coming%20soon%20Poster.png?raw=true';

// Inject header + enable search logic
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

// Helpers
function formatDate(dateStr) {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' });
}

function getQueryParam(param) {
  return new URLSearchParams(window.location.search).get(param);
}

// Fetch and render content details
async function fetchContentDetails(id, type) {
  try {
    const res = await fetch(`${BASE_URL}/${type}/${id}?api_key=${API_KEY}&append_to_response=credits,recommendations,videos`);
    const data = await res.json();

    renderDetails(data, type);
    renderCast(data.credits.cast);
    renderRecommendations(data.recommendations.results);
    renderSources(data.videos.results);
  } catch (error) {
    console.error('Failed to fetch content details:', error);
  }
}

function renderDetails(data, type) {
  const html = `
    <div class="col-span-3 md:col-span-1">
      <img src="${IMG_W500 + data.poster_path}" alt="${data.title || data.name}" class="rounded-lg w-full">
    </div>
    <div class="col-span-3 md:col-span-2">
      <h1 class="text-2xl font-bold mb-2">${data.title || data.name}</h1>
      <p class="text-gray-400 mb-2">${formatDate(data.release_date || data.first_air_date)}</p>
      <p class="text-sm mb-4">${data.overview}</p>
      <div class="text-sm text-gray-300">
        <p><strong>Status:</strong> ${data.status}</p>
        <p><strong>Rating:</strong> ${data.vote_average?.toFixed(1)}</p>
        <p><strong>Genres:</strong> ${(data.genres || []).map(g => g.name).join(', ')}</p>
      </div>
    </div>
  `;
  document.getElementById('contentDetails').innerHTML = html;
}

function renderCast(cast = []) {
  const html = cast.slice(0, 12).map(member => `
    <div class="text-center">
      <img src="${member.profile_path ? IMG_W500 + member.profile_path : FALLBACK_IMG}" alt="${member.name}" class="w-24 h-24 object-cover rounded-full mx-auto mb-2">
      <p class="text-sm">${member.name}</p>
      <p class="text-xs text-gray-400">${member.character}</p>
    </div>
  `).join('');
  document.getElementById('tab-cast').innerHTML = `<div class="grid grid-cols-3 md:grid-cols-6 gap-4">${html}</div>`;
}

function renderRecommendations(recs = []) {
  const html = recs.slice(0, 12).map(item => `
    <div class="cursor-pointer hover:scale-105 transition" data-id="${item.id}" data-type="${item.media_type || 'movie'}">
      <img src="${item.poster_path ? IMG_W500 + item.poster_path : FALLBACK_IMG}" class="rounded-lg w-full">
      <p class="text-sm mt-2">${item.title || item.name}</p>
    </div>
  `).join('');
  const wrapper = document.getElementById('tab-recommended');
  wrapper.innerHTML = `<div class="grid grid-cols-3 md:grid-cols-6 gap-4">${html}</div>`;

  wrapper.querySelectorAll('[data-id]').forEach(card => {
    card.addEventListener('click', () => {
      const id = card.dataset.id;
      const type = card.dataset.type;
      window.location.href = `info.html?id=${id}&type=${type}`;
    });
  });
}

function renderSources(videos = []) {
  const trailer = videos.find(v => v.type === 'Trailer' && v.site === 'YouTube');
  if (!trailer) {
    document.getElementById('tab-sources').innerHTML = '<p class="text-gray-500">No trailers available.</p>';
    return;
  }

  document.getElementById('tab-sources').innerHTML = `
    <button class="bg-red-600 text-white px-4 py-2 rounded-lg" onclick="openVideo('${trailer.key}')">
      ▶ Watch Trailer
    </button>
  `;
}

function openVideo(key) {
  const modal = document.getElementById('videoModal');
  const frame = document.getElementById('videoFrame');
  frame.src = `https://www.youtube.com/embed/${key}?autoplay=1`;
  modal.classList.remove('hidden');
}

document.getElementById('closeModal').addEventListener('click', () => {
  const modal = document.getElementById('videoModal');
  const frame = document.getElementById('videoFrame');
  frame.src = '';
  modal.classList.add('hidden');
});

// Tab handling
document.querySelectorAll('.tab-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    const tab = btn.dataset.tab;
    document.querySelectorAll('.tab-panel').forEach(panel => panel.classList.add('hidden'));
    document.getElementById(`tab-${tab}`).classList.remove('hidden');

    document.querySelectorAll('.tab-btn').forEach(b => {
      b.classList.remove('bg-[#ff4444]', 'text-white');
      b.classList.add('bg-transparent');
    });
    btn.classList.add('bg-[#ff4444]', 'text-white');
  });
});

// Load details
document.addEventListener('DOMContentLoaded', () => {
  const id = getQueryParam('id');
  const type = getQueryParam('type') || 'movie';
  if (id) {
    fetchContentDetails(id, type);
  }

  // Default to first visible tab
  const firstTab = document.querySelector('.tab-btn');
  if (firstTab) firstTab.click();
});
