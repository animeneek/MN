const API_KEY = 'e3afd4c89e3351edad9e875ff7a01f0c';

fetch('header.html')
  .then(res => res.text())
  .then(data => document.getElementById('nav-placeholder').innerHTML = data)
  .catch(err => console.error('Error loading header:', err));

const urlParams = new URLSearchParams(window.location.search);
const personId = urlParams.get('id');

function imageUrl(path, size = 'w500', fallback = 'https://raw.githubusercontent.com/animeneek/MN/main/assets/Black%20and%20White%20Modern%20Coming%20soon%20Poster.png') {
  return path ? `https://image.tmdb.org/t/p/${size}${path}` : fallback;
}

async function fetchPersonDetails(id) {
  const res = await fetch(`https://api.themoviedb.org/3/person/${id}?api_key=${API_KEY}&language=en-US`);
  return await res.json();
}

async function fetchCombinedCredits(id) {
  const res = await fetch(`https://api.themoviedb.org/3/person/${id}/combined_credits?api_key=${API_KEY}&language=en-US`);
  return await res.json();
}

function renderPersonDetails(person) {
  const profile = imageUrl(person.profile_path, 'w500');
  document.getElementById('personDetails').innerHTML = `
    <img src="${profile}" class="rounded shadow max-w-full object-cover" alt="${person.name}">
    <div class="md:col-span-2 space-y-3">
      <h1 class="text-3xl font-bold">${person.name}</h1>
      <p class="text-sm italic text-gray-400">${person.known_for_department}</p>
      <p class="text-sm">${person.biography || 'No biography available.'}</p>
      <div class="text-sm text-gray-300 pt-4">
        ${person.birthday ? `<p><strong>Birthday:</strong> ${person.birthday}</p>` : ''}
        ${person.place_of_birth ? `<p><strong>Place of Birth:</strong> ${person.place_of_birth}</p>` : ''}
        ${person.deathday ? `<p><strong>Died:</strong> ${person.deathday}</p>` : ''}
        ${person.gender === 2 ? `<p><strong>Gender:</strong> Male</p>` : person.gender === 1 ? `<p><strong>Gender:</strong> Female</p>` : ''}
      </div>
    </div>
  `;
}

function groupCreditsByDepartment(credits) {
  const grouped = {};
  credits.forEach(credit => {
    const dept = credit.department || credit.known_for_department || 'Other';
    if (!grouped[dept]) grouped[dept] = [];
    grouped[dept].push(credit);
  });
  return grouped;
}

function renderRoleTabs(grouped) {
  const tabContainer = document.getElementById('role-tabs');
  const contentContainer = document.getElementById('role-content');

  const departments = Object.keys(grouped);
  departments.forEach((dept, index) => {
    const btn = document.createElement('button');
    btn.textContent = dept;
    btn.className = `tab-btn ${index === 0 ? 'border-b-2 border-primary' : ''}`;
    btn.dataset.tab = `role-${dept}`;
    tabContainer.appendChild(btn);

    const items = grouped[dept]
      .sort((a, b) => (b.vote_count || 0) - (a.vote_count || 0))
      .map(item => `
        <a href="info.html?type=${item.media_type}&id=${item.id}" class="rounded overflow-hidden block hover:scale-105 transition">
          <img src="${imageUrl(item.poster_path, 'w342')}" class="w-full aspect-[2/3] object-cover rounded mb-2" />
          <div class="text-sm text-center">${item.title || item.name}</div>
        </a>
      `).join('');

    const panel = document.createElement('div');
    panel.id = `role-${dept}`;
    panel.className = `tab-panel ${index === 0 ? '' : 'hidden'}`;
    panel.innerHTML = `<div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">${items}</div>`;
    contentContainer.appendChild(panel);
  });

  setupRoleTabEvents();
}

function setupRoleTabEvents() {
  const tabButtons = document.querySelectorAll('#role-tabs .tab-btn');
  const panels = document.querySelectorAll('#role-content .tab-panel');

  tabButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      tabButtons.forEach(b => b.classList.remove('border-b-2', 'border-primary'));
      panels.forEach(p => p.classList.add('hidden'));
      btn.classList.add('border-b-2', 'border-primary');
      document.getElementById(btn.dataset.tab).classList.remove('hidden');
    });
  });
}

async function init() {
  if (!personId) return;

  const person = await fetchPersonDetails(personId);
  const credits = await fetchCombinedCredits(personId);

  renderPersonDetails(person);
  const grouped = groupCreditsByDepartment(credits.cast.concat(credits.crew));
  renderRoleTabs(grouped);
}

document.addEventListener('DOMContentLoaded', init);
