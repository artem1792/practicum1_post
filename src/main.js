const app = document.getElementById('app');

function init() {
  app.innerHTML = `
    <header id="header" class="bg-gradient-to-b from-lime-100 to-lime-200 shadow-lg fixed right-0 top-0 h-full w-64"></header>
    <main id="post-list" class="container mx-auto p-4 mr-64"></main>
    <footer id="footer" class="bg-lime-300 text-gray-800 p-4 text-center mr-64"></footer>
  `;

  renderHeader();

  renderFooter();

  renderPostList();

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

function renderHeader() {
  const header = document.getElementById('header');
  fetch('/db.json')
    .then((response) => response.json())
    .then((data) => {
      const authors = data.users;
      header.innerHTML = `
        <nav class="p-6">
          <h1 class="text-2xl font-bold text-lime-800 mb-8 text-center">Блог постов</h1>
          <div class="space-y-4">
            <a href="#" class="author-link block w-full bg-lime-400 text-gray-800 px-4 py-3 rounded-xl hover:bg-lime-500 transition-colors font-bold text-center shadow-md" data-user-id="all">Все посты</a>
            <div class="space-y-2">
              ${authors.map(author => `
                <a href="#" class="author-link block w-full bg-white text-lime-700 px-4 py-2 rounded-lg hover:bg-lime-100 transition-colors font-medium text-center border border-lime-200" data-user-id="${author.id}">${author.name}</a>
              `).join('')}
            </div>
          </div>
        </nav>
      `;
    })
    .catch((error) => console.error('Ошибка загрузки авторов:', error));
}

function renderFooter() {
  const footer = document.getElementById('footer');
  footer.innerHTML = `
    <p>&copy; ${new Date().getFullYear()} JSONPlaceholder Posts App</p>
  `;
}

function renderPostList(userId = null) {
  const postList = document.getElementById('post-list');
  postList.innerHTML = '<p class="text-center">Загрузка...</p>';

  const url = userId && userId !== 'all' 
    ? `https://jsonplaceholder.typicode.com/posts?userId=${userId}` 
    : 'https://jsonplaceholder.typicode.com/posts';

  fetch(url)
    .then((response) => {
      if (!response.ok) throw new Error(`${response.status} — ${response.statusText}`);
      return response.json();
    })
    .then((posts) => {
      postList.innerHTML = posts.map(post => `
        <div class="bg-white p-6 mb-6 rounded-xl shadow-sm border border-lime-100 hover:shadow-md transition-shadow">
          <h2 class="text-xl font-bold text-lime-800">${post.title}</h2>
          <p class="mt-3 text-lime-700">${post.body}</p>
          <button class="details-btn bg-lime-300 text-gray-800 px-4 py-2 mt-3 rounded-lg hover:bg-lime-400 transition-colors font-medium" data-post-id="${post.id}">Подробнее</button>
        </div>
      `).join('');
    })
    .catch((error) => {
      postList.innerHTML = `<p class="text-red-400">Ошибка: ${error.message}</p>`;
    });
}

async function showModal(postId) {
  const modal = document.createElement('div');
  modal.className = 'fixed inset-0 bg-lime-900 bg-opacity-30 flex items-center justify-center z-50';
  modal.innerHTML = `
    <div class="bg-gradient-to-br from-lime-50 to-lime-100 p-8 rounded-2xl max-w-2xl w-full max-h-[80vh] overflow-y-auto border border-lime-200 shadow-2xl">
      <h2 class="text-xl font-bold mb-4 text-lime-800">Загрузка...</h2>
      <button class="close-modal bg-lime-300 text-gray-800 px-6 py-3 rounded-xl hover:bg-lime-400 transition-colors font-medium">Закрыть</button>
    </div>
  `;
  document.body.appendChild(modal);

  try {
    const postResponse = await fetch(`https://jsonplaceholder.typicode.com/posts/${postId}`);
    if (!postResponse.ok) throw new Error('Ошибка загрузки поста');
    const post = await postResponse.json();

    const commentsResponse = await fetch(`https://jsonplaceholder.typicode.com/posts/${postId}/comments`);
    if (!commentsResponse.ok) throw new Error('Ошибка загрузки комментариев');
    const comments = await commentsResponse.json();

    modal.querySelector('div').innerHTML = `
      <h2 class="text-2xl font-bold mb-6 text-lime-800 border-b border-lime-200 pb-4">${post.title}</h2>
      <p class="mb-6 text-lime-700 text-lg leading-relaxed">${post.body}</p>
      <h3 class="text-xl font-semibold mb-4 text-lime-800">Комментарии:</h3>
      <div class="space-y-4 mb-6">
        ${comments.map(comment => `
          <div class="bg-white p-4 rounded-xl border border-lime-200 shadow-sm">
            <p class="font-semibold text-lime-700">${comment.name} <span class="text-lime-600 text-sm">(${comment.email})</span></p>
            <p class="mt-2 text-lime-700">${comment.body}</p>
          </div>
        `).join('')}
      </div>
      <button class="close-modal bg-lime-300 text-gray-800 px-6 py-3 rounded-xl hover:bg-lime-400 transition-colors font-medium w-full">Закрыть</button>
    `;
  } catch (error) {
    modal.querySelector('div').innerHTML = `
      <p class="text-red-400 mb-4">Ошибка: ${error.message}</p>
      <button class="close-modal bg-lime-300 text-gray-800 px-6 py-3 rounded-xl hover:bg-lime-400 transition-colors font-medium">Закрыть</button>
    `;
  }

  modal.addEventListener('click', (e) => {
    if (e.target.classList.contains('close-modal') || e.target === modal) {
      modal.remove();
    }
  });
}

init();