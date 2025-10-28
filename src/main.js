const app = document.getElementById('app');

function init() {
  app.innerHTML = `
    <header id="header" class="header"></header>
    <main id="post-list" class="main-content"></main>
    <footer id="footer" class="footer"></footer>
  `;

  renderHeader();
  renderFooter();
  renderPostList();

  // клики
  document.addEventListener('click', (e) => {
    if (e.target.classList.contains('author-link')) {
      const userId = e.target.dataset.userId;
      renderPostList(userId);
    }
  });

  document.addEventListener('click', (e) => {
    if (e.target.classList.contains('details-btn')) {
      const postId = e.target.dataset.postId;
      showModal(postId);
    }
  });
}

/* шапка */

function renderHeader() {
  const header = document.getElementById('header');
  fetch('/db.json')
    .then((response) => response.json())
    .then((data) => {
      const authors = data.users;
      header.innerHTML = `
        <nav class="header-nav">
          <h1 class="header-title">Авторы</h1>
          <div class="nav-space">
            <a href="#" class="all-authors-btn author-link" data-user-id="all">Все</a>
            <div class="authors-space">
              ${authors.map(author => `
                <a href="#" class="author-link" data-user-id="${author.id}">${author.name}</a>
              `).join('')}
            </div>
          </div>
        </nav>
      `;
    })
}

/* подвал */

function renderFooter() {
  const footer = document.getElementById('footer');
  footer.innerHTML = `
    <p>Бобровский Артём &copy; ${new Date().getFullYear()}</p>
  `;
}

/* рендер постов */

function renderPostList(userId = null) {
  const postList = document.getElementById('post-list');

  fetch('/db.json')
    .then((response) => {
      if (!response.ok) throw new Error(`${response.status} — ${response.statusText}`);
      return response.json();
    })
    .then((data) => {
      let posts = data.posts;
      
      if (userId && userId !== 'all') {
        posts = posts.filter(post => post.userId == userId);
      }

      postList.innerHTML = posts.map(post => `
        <div class="post-card">
          <h2 class="post-title">${post.title}</h2>
          <p class="post-body">${post.body}</p>
          <button class="details-btn" data-post-id="${post.id}">Подробнее</button>
        </div>
      `).join('');
    })
    .catch((error) => {
      postList.innerHTML = `<p class="error-message">Ошибка: ${error.message}</p>`;
    });
}

/* модальное */

async function showModal(postId) {
  const modal = document.createElement('div');
  modal.className = 'modal-overlay';
  modal.innerHTML = `
    <div class="modal-content">
      <button class="close-modal">Закрыть</button>
    </div>
  `;
  document.body.appendChild(modal);

  try {
    const response = await fetch('/db.json');
    const data = await response.json();

    const post = data.posts.find(p => p.id == postId);
    const comments = data.comments ? data.comments.filter(comment => comment.postId == postId) : [];

    modal.querySelector('.modal-content').innerHTML = `
      <h2 class="modal-title">${post.title}</h2>
      <p class="modal-text">${post.body}</p>
      <h3 class="comments-title">Комментарии:</h3>
      <div class="comments-space">
        ${comments.map(comment => `
          <div class="comment-card">
            <p class="comment-author">${comment.name} <span class="comment-email">(${comment.email})</span></p>
            <p class="comment-body">${comment.body}</p>
          </div>
        `).join('')}
      </div>
      <button class="close-modal">Закрыть</button>
    `;
  } catch (error) {
    modal.querySelector('.modal-content').innerHTML = `
      <button class="close-modal">Закрыть</button>
    `;
  }

  /* закрывашка модального */
  
  modal.addEventListener('click', (e) => {
    if (e.target.classList.contains('close-modal') || e.target === modal) {
      modal.remove();
    }
  });
}

init();