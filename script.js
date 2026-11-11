/* Interplanetary Market — JavaScript puro.
   Os produtos vêm do HTML. O carrinho fica apenas na memória desta página. */

const productCards = [...document.querySelectorAll('.product-card')];
const products = productCards.map((card) => ({
  id: card.dataset.id,
  name: card.dataset.name,
  price: Number(card.dataset.price),
  image: card.querySelector('img').getAttribute('src')
}));

const destinations = {
  terra: { name: 'Terra', hours: 2, place: '' },
  lua: { name: 'Lua', hours: 6, place: '' },
  marte: { name: 'Marte', hours: 12, place: '' },
  venus: { name: 'Vênus', hours: 24, place: 'em estações protegidas' },
  jupiter: { name: 'Júpiter', hours: 48, place: 'em estações orbitais' },
  saturno: { name: 'Saturno', hours: 72, place: 'em bases espaciais' }
};

let cart = [];
let selectedDestination = 'marte';
let toastTimer;
const cartDialog = document.querySelector('#cart-dialog');
const cartItems = document.querySelector('#cart-items');
const cartSummary = document.querySelector('#cart-summary');
const cartContent = document.querySelector('#cart-content');
const orderSuccess = document.querySelector('#order-success');
const cartDestination = document.querySelector('#cart-destination');

// A formatação brasileira inclui os pontos de milhar: 1.200 CE.
function formatCredits(value) {
  return value.toLocaleString('pt-BR') + ' CE';
}

function cartTotal() {
  return cart.reduce((total, item) => total + item.price * item.quantity, 0);
}

function showToast(message) {
  const toast = document.querySelector('#toast');
  clearTimeout(toastTimer);
  toast.textContent = message;
  toast.classList.add('visible');
  toastTimer = setTimeout(() => toast.classList.remove('visible'), 2600);
}

// Recria somente a lista do carrinho quando uma quantidade muda.
function renderCart() {
  const quantity = cart.reduce((total, item) => total + item.quantity, 0);
  document.querySelector('#cart-count').textContent = quantity;
  document.querySelector('#open-cart').setAttribute('aria-label', `Abrir carrinho, ${quantity} ${quantity === 1 ? 'item' : 'itens'}`);
  document.querySelector('#cart-total').textContent = formatCredits(cartTotal());
  cartItems.replaceChildren();
  cartSummary.hidden = cart.length === 0;

  if (cart.length === 0) {
    cartItems.innerHTML = '<div class="empty-cart"><svg class="icon"><use href="#i-bag"/></svg><h3>Uma órbita de possibilidades.</h3><p>Seu carrinho está vazio. Escolha os produtos para sua próxima expedição.</p><button class="button button-lime" id="empty-explore">Explorar produtos <svg class="icon"><use href="#i-arrow"/></svg></button></div>';
    document.querySelector('#empty-explore').addEventListener('click', continueShopping);
    return;
  }

  cart.forEach((item) => {
    const row = document.createElement('article');
    row.className = 'cart-item';
    // Os valores interpolados são os dados fixos dos cartões locais, sem entrada do usuário.
    row.innerHTML = `
      <img src="${item.image}" alt="" width="65" height="70">
      <div><h3>${item.name}</h3><p class="cart-item-price">${formatCredits(item.price)} / unidade</p>
        <div class="quantity-controls">
          <button data-action="decrease" data-id="${item.id}" aria-label="Diminuir quantidade de ${item.name}">−</button>
          <span aria-label="Quantidade de ${item.name}">${item.quantity}</span>
          <button data-action="increase" data-id="${item.id}" aria-label="Aumentar quantidade de ${item.name}">+</button>
        </div>
      </div>
      <button class="remove-item" data-action="remove" data-id="${item.id}" aria-label="Remover ${item.name}"><svg class="icon"><use href="#i-trash"/></svg></button>`;
    cartItems.append(row);
  });
}

function addToCart(id) {
  const product = products.find((item) => item.id === id);
  const existingItem = cart.find((item) => item.id === id);
  if (existingItem) {
    existingItem.quantity += 1;
  } else {
    cart.push({ ...product, quantity: 1 });
  }
  orderSuccess.hidden = true;
  cartContent.hidden = false;
  renderCart();
  showToast(`${product.name} adicionado ao carrinho. Boa viagem!`);
}

productCards.forEach((card) => {
  const button = card.querySelector('.add-to-cart');
  const originalLabel = button.getAttribute('aria-label');
  let feedbackTimer;

  button.addEventListener('click', () => {
    addToCart(card.dataset.id);

    // Confirma a adição no próprio botão, sem bloquear novos cliques.
    clearTimeout(feedbackTimer);
    card.classList.add('is-added');
    button.classList.add('is-added');
    button.querySelector('use').setAttribute('href', '#i-check');
    button.setAttribute('aria-label', `${card.dataset.name} adicionado. Adicionar mais uma unidade`);
    feedbackTimer = setTimeout(() => {
      card.classList.remove('is-added');
      button.classList.remove('is-added');
      button.querySelector('use').setAttribute('href', '#i-plus');
      button.setAttribute('aria-label', originalLabel);
    }, 1600);
  });
});

// Um único evento atende aos botões +, − e remover da lista inteira.
cartItems.addEventListener('click', (event) => {
  const button = event.target.closest('button[data-action]');
  if (!button) return;
  const item = cart.find((product) => product.id === button.dataset.id);
  if (!item) return;

  if (button.dataset.action === 'increase') item.quantity += 1;
  if (button.dataset.action === 'decrease') item.quantity -= 1;
  if (button.dataset.action === 'remove') item.quantity = 0;
  cart = cart.filter((product) => product.quantity > 0);
  renderCart();

  // Mantém o foco útil para quem navega apenas pelo teclado.
  const nextButton = [...cartItems.querySelectorAll('button[data-action]')].find((candidate) =>
    candidate.dataset.id === button.dataset.id && candidate.dataset.action === button.dataset.action
  );
  (nextButton || cartItems.querySelector('button') || document.querySelector('#close-cart')).focus();
});

document.querySelector('#open-cart').addEventListener('click', () => {
  renderCart();
  cartDialog.showModal();
  document.body.classList.add('modal-open');
});

document.querySelector('#close-cart').addEventListener('click', () => cartDialog.close());
cartDialog.addEventListener('close', () => document.body.classList.remove('modal-open'));
// O clique no fundo escuro fecha o painel; o clique dentro dele não fecha.
cartDialog.addEventListener('click', (event) => {
  const bounds = cartDialog.getBoundingClientRect();
  if (event.target === cartDialog && (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom)) {
    cartDialog.close();
  }
});

function continueShopping() {
  cartDialog.close();
  orderSuccess.hidden = true;
  cartContent.hidden = false;
  document.querySelector('#produtos').scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' });
  document.querySelector('.filter.active').focus({ preventScroll: true });
}
document.querySelector('#continue-shopping').addEventListener('click', continueShopping);

// Finaliza apenas uma demonstração. Nenhum dado é enviado ou armazenado.
document.querySelector('#checkout').addEventListener('click', () => {
  if (cart.length === 0) return;
  const destination = destinations[selectedDestination];
  const quantity = cart.reduce((total, item) => total + item.quantity, 0);
  document.querySelector('#order-message').textContent = `Na nossa história de 2058, sua expedição com ${quantity} ${quantity === 1 ? 'item' : 'itens'}, no total de ${formatCredits(cartTotal())}, seguiria para ${destination.name}, com entrega em até ${destination.hours} horas${destination.place ? ', ' + destination.place : ''}.`;
  cart = [];
  renderCart();
  cartContent.hidden = true;
  orderSuccess.hidden = false;
  document.querySelector('#continue-shopping').focus();
});

// Filtros simples: apenas ocultam os cartões de outras categorias.
document.querySelectorAll('.filter').forEach((button) => {
  button.addEventListener('click', () => {
    document.querySelectorAll('.filter').forEach((filter) => {
      const isActive = filter === button;
      filter.classList.toggle('active', isActive);
      filter.setAttribute('aria-pressed', isActive);
    });
    productCards.forEach((card) => {
      card.hidden = button.dataset.filter !== 'todos' && card.dataset.category !== button.dataset.filter;
    });
  });
});

// Mapa e carrinho compartilham o mesmo destino selecionado.
function selectDestination(key) {
  selectedDestination = key;
  const destination = destinations[key];
  document.querySelector('#map-destination-name').textContent = destination.name;
  document.querySelector('#map-delivery').textContent = `Entrega em até ${destination.hours} horas${destination.place ? ' · ' + destination.place : ''}`;
  document.querySelector('#map-destination').className = `map-target planet-${key}`;
  cartDestination.value = key;
  document.querySelectorAll('.destination').forEach((button) => {
    const isSelected = button.dataset.destination === key;
    button.classList.toggle('selected', isSelected);
    button.setAttribute('aria-pressed', isSelected);
  });
}
document.querySelectorAll('.destination').forEach((button) => {
  button.addEventListener('click', () => selectDestination(button.dataset.destination));
});
cartDestination.addEventListener('change', () => selectDestination(cartDestination.value));

// Menu para telas pequenas.
const menuToggle = document.querySelector('#menu-toggle');
const mainNav = document.querySelector('#main-nav');
function closeMenu() {
  mainNav.classList.remove('open');
  menuToggle.setAttribute('aria-expanded', 'false');
  menuToggle.setAttribute('aria-label', 'Abrir menu');
}
menuToggle.addEventListener('click', () => {
  const isOpen = mainNav.classList.toggle('open');
  menuToggle.setAttribute('aria-expanded', isOpen);
  menuToggle.setAttribute('aria-label', isOpen ? 'Fechar menu' : 'Abrir menu');
});
// Evita manter um menu móvel aberto ao alternar a largura da janela.
window.matchMedia('(max-width: 680px)').addEventListener('change', closeMenu);
mainNav.querySelectorAll('a').forEach((link) => link.addEventListener('click', closeMenu));
document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && mainNav.classList.contains('open')) {
    closeMenu();
    menuToggle.focus();
  }
});
document.addEventListener('click', (event) => {
  if (!event.target.closest('.site-header')) closeMenu();
});

// A seção visível recebe um pequeno indicador no menu, sem animação de rolagem.
const sectionObserver = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (!entry.isIntersecting) return;
    mainNav.querySelectorAll('a').forEach((link) => {
      const isCurrent = link.getAttribute('href') === '#' + entry.target.id;
      link.classList.toggle('active', isCurrent);
      if (isCurrent) link.setAttribute('aria-current', 'location');
      else link.removeAttribute('aria-current');
    });
  });
}, { rootMargin: '-15% 0px -55% 0px', threshold: 0 });
document.querySelectorAll('main section[id]').forEach((section) => sectionObserver.observe(section));

renderCart();
