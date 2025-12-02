const app = document.getElementById('app');
const API_BASE = 'http://localhost:3000';

function init() {
  app.innerHTML = `
    <header id="header" class="header"></header>

    <div class="create-post-btn-container">
      <button id="openCreateModal" class="create-post-btn">Новый пост</button>

      <div class="view-switch">
        <button id="viewList">Список</button>
        <button id="viewGrid">Плитка</button>
      </div>
    </div>
  
    <main id="post-list" class="main-content"></main>
    <footer id="footer" class="footer"></footer>
  `;

  renderHeader();
  renderFooter();
  renderPostList();

  // открытие модалки создания поста
  document.getElementById('openCreateModal').addEventListener('click', openCreatePostModal);

  // обработка кликов
  document.addEventListener('click', e => {
    if (e.target.classList.contains('author-link')) {
      const userId = e.target.dataset.userId;
      renderPostList(userId);
    }
    if (e.target.classList.contains('details-btn')) {
      showModal(e.target.dataset.postId);
    }
    if (e.target.classList.contains('delete-btn')) {
      if (confirm('Удалить этот пост?')) {
        deletePost(e.target.dataset.postId);
      }
    }
    if (e.target.classList.contains("favorite-btn")) {
      const id = Number(e.target.dataset.postId);
      addFavoritePost(id);
      renderPostList();
    }
  });

  // хранение режима вывода
  let savedView = localStorage.getItem("postView") || "list";
  document.body.setAttribute("data-view", savedView);

  document.getElementById("viewList").addEventListener("click", () => {
    localStorage.setItem("postView", "list");
    document.body.setAttribute("data-view", "list");
    renderPostList();
  });

  document.getElementById("viewGrid").addEventListener("click", () => {
    localStorage.setItem("postView", "grid");
    document.body.setAttribute("data-view", "grid");
    renderPostList();
  });
}

// модалка создания поста
async function openCreatePostModal() {
  const modal = document.createElement('div');
  modal.className = 'modal-overlay';
  modal.innerHTML = `
    <div class="modal-content create-modal">
      <form id="createPostForm">
        <input type="text" id="postTitle" placeholder="Название поста" required>
        <textarea id="postBody" placeholder="Текст поста" rows="5" required></textarea>
        <select id="postAuthor" required>
          <option value="">Выберите автора</option>
        </select>
        <div class="modal-buttons">
          <button type="submit">Опубликовать</button>
          <button type="button" class="close-modal">Отмена</button>
        </div>
        <p id="formError" class="error-message"></p>
      </form>
    </div>
  `;
  document.body.appendChild(modal);

  try {
    const res = await fetch(`${API_BASE}/users`);
    const users = await res.json();
    const select = modal.querySelector('#postAuthor');
    select.innerHTML = '<option value="">Выберите автора</option>' +
      users.map(u => `<option value="${u.id}">${u.name}</option>`).join('');
  } catch {
    modal.querySelector('#formError').textContent = 'Не удалось загрузить авторов';
  }

  modal.querySelector('#createPostForm').addEventListener('submit', async e => {
    e.preventDefault();
    const title = modal.querySelector('#postTitle').value.trim();
    const body = modal.querySelector('#postBody').value.trim();
    const userId = modal.querySelector('#postAuthor').value;
    const error = modal.querySelector('#formError');

    if (!title || !body || !userId) {
      error.textContent = 'Заполните все поля!';
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/posts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, body, userId: +userId, numberOfLike: 0 })
      });

      if (!res.ok) throw new Error('error');
      modal.remove();
      renderPostList();
      alert('Пост успешно создан');
    } catch (err) {
      error.textContent = err.message;
    }
  });

  modal.addEventListener('click', e => {
    if (e.target.classList.contains('close-modal') || e.target === modal) {
      modal.remove();
    }
  });
}

// удаление поста
function deletePost(postId) {
  fetch(`${API_BASE}/posts/${postId}`, { method: 'DELETE' })
    .then(r => { if (r.ok) renderPostList(); })
    .catch(() => alert('error'));
}

// шапка
function renderHeader() {
  const header = document.getElementById('header');
  fetch(`${API_BASE}/users`)
    .then(r => r.json())
    .then(users => {
      header.innerHTML = `
        <nav class="header-nav">
          <h1 class="header-title">Авторы</h1>
          <div class="nav-space">
            <a href="#" class="all-authors-btn author-link" data-user-id="all">Все</a>
            <div class="authors-space">
              ${users.map(u => `<a href="#" class="author-link" data-user-id="${u.id}">${u.name}</a>`).join('')}
            </div>
          </div>
        </nav>
      `;
    });
}

// подвал
function renderFooter() {
  document.getElementById('footer').innerHTML = `<p>Бобровский Артём © ${new Date().getFullYear()}</p>`;
}

// список постов
function renderPostList(userId = null) {
  const container = document.getElementById('post-list');

  // вид постов
  const viewMode = localStorage.getItem("postView") || "list";
  container.classList.remove("view-list", "view-grid");
  container.classList.add(`view-${viewMode}`);

  let url = `${API_BASE}/posts`;
  if (userId && userId !== 'all') url += `?userId=${userId}`;

  fetch(url)
    .then(r => { if (!r.ok) throw new Error('Ошибка'); return r.json(); })
    .then(posts => {
      container.innerHTML = posts.map(p => `
        <div class="post-card ${isFavorite(p.id) ? 'favorite' : ''}">
          <h2 class="post-title">${p.title}</h2>
          <p class="post-body">${p.body}</p>

          <div class="post-actions">
            <button class="details-btn" data-post-id="${p.id}">Подробнее</button>
            <button class="delete-btn" data-post-id="${p.id}">Удалить</button>
          </div>

          <button class="favorite-btn" data-post-id="${p.id}">${isFavorite(p.id) ? "★" : "☆"}</button>

          <div class="like">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 16 16">
              <path class="like-path" data-idpost="${p.id}" fill-rule="evenodd" d="M8 1.314C12.438-3.248 23.534 4.735 8 15-7.534 4.736 3.562-3.248 8 1.314"/>
            </svg>
            <span>${p.numberOfLike || 0}</span>
          </div>
        </div>
      `).join('');
    })
    .catch(() => container.innerHTML = '<p class="error-message">Ошибка загрузки постов</p>');
}

// модалка подробнее
async function showModal(postId) {
  const modal = document.createElement('div');
  modal.className = 'modal-overlay';
  modal.innerHTML = `<div class="modal-content"><button class="close-modal">Закрыть</button></div>`;
  document.body.appendChild(modal);

  try {
    const [postRes, commRes] = await Promise.all([
      fetch(`${API_BASE}/posts/${postId}`),
      fetch(`${API_BASE}/comments?postId=${postId}`)
    ]);
    const post = await postRes.json();
    const comments = await commRes.json();

    modal.querySelector('.modal-content').innerHTML = `
      <h2 class="modal-title">${post.title}</h2>
      <p class="modal-text">${post.body}</p>
      <h3 class="comments-title">Комментарии:</h3>
      <div class="comments-space">
        ${comments.length ? comments.map(c => `
          <div class="comment-card">
            <p class="comment-author">${c.name} <span class="comment-email">(${c.email})</span></p>
            <p class="comment-body">${c.body}</p>
          </div>
        `).join('') : '<p>Комментариев нет</p>'}
      </div>
      <button class="close-modal">Закрыть</button>
    `;
  } catch {
    modal.querySelector('.modal-content').innerHTML += `<p class="error-message">Ошибка загрузки</p><button class="close-modal">Закрыть</button>`;
  }

  modal.addEventListener('click', e => {
    if (e.target.classList.contains('close-modal') || e.target === modal) modal.remove();
  });
}

// лайки
document.addEventListener('click', function (e) {
  if (e.target.classList.contains('like-path')) {
    let id = e.target.getAttribute('data-idpost');
    let span = e.target.closest('.like').querySelector('span');
    let likes = Number(span.innerText) + 1;

    fetch('http://localhost:3000/posts/' + id, {
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      method: 'PATCH',
      body: JSON.stringify({
        numberOfLike: likes
      })
    })
      .then(() => {
        span.innerText = likes;
      })
      .catch(() => {
        alert('error');
      });

  }
});

init();

// переключение темы
const btnLight = document.getElementById("light-theme");
const btnDark = document.getElementById("dark-theme");

let browserTheme = window.matchMedia("(prefers-color-scheme: dark)").matches
browserTheme = browserTheme ? "dark" : "light";

let theme = localStorage.getItem('theme') || browserTheme;
if (theme === 'light') {
  btnLight.checked = true;
} else {
  btnDark.checked = true;
  const link = document.createElement("link");
  link.rel = "stylesheet"
  link.href = "/src/dark.css"
  link.id = "dark-style"
  document.querySelector("head").append(link);
}

btnLight.addEventListener("change", () => {
  localStorage.setItem("theme", "light");
  document.getElementById("dark-style").remove();
})

btnDark.addEventListener("change", () => {
  localStorage.setItem("theme", "dark");
  const link = document.createElement("link");
  link.rel = "stylesheet"
  link.href = "/src/dark.css"
  link.id = "dark-style"
  document.querySelector("head").append(link);
})

// счетчик перезагрузок
let count;
const STORAGE_KEY = 'pageReloadCount';
let storedValue = localStorage.getItem(STORAGE_KEY) || 0;

storedValue = parseInt(storedValue)

count = storedValue + 1;
localStorage.setItem(STORAGE_KEY, String(count));

const counterElement = document.getElementById('reload-count');
if (counterElement) {
  counterElement.textContent = count;
}

// избранные посты
const FAV_STORAGE_KEY = 'favoritePosts';

function getFavoritePosts() {
  const stored = localStorage.getItem(FAV_STORAGE_KEY);
  return stored ? JSON.parse(stored) : [];
}

function addFavoritePost(postId) {
  const favs = getFavoritePosts();
  const index = favs.indexOf(postId);
  if (index === -1) {
    favs.push(postId);
  }
  localStorage.setItem(FAV_STORAGE_KEY, JSON.stringify(favs));
}

function isFavorite(postId) {
  const favs = getFavoritePosts();
  return favs.includes(parseInt(postId));
}
