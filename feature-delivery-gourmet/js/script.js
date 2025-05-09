// js/script.js

// ——— ESTADO GLOBAL ———
let products = [];
let currentCategory = "Todos";
let currentSearch   = "";

// ——— REFS ———
const productsContainer = document.getElementById("products-container");
const searchInput       = document.querySelector(".search-input");
const categoryItems     = document.querySelectorAll("#category-nav-list li");
const ordersBtn         = document.querySelector(".btn.orders");
const scheduleBtn       = document.querySelector(".btn.info");
const badge             = document.getElementById("storeBadge");

// ——— FETCH LOJA ———
async function fetchLojaInfo(lojaId) {
  const resp = await fetch('/api/Usuario/GetStatusById', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id: lojaId })
  });
  if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
  return await resp.json();
}

async function atualizarStatusLoja(lojaId) {
  badge.textContent = '…';
  badge.classList.remove('aberto', 'fechado');
  try {
    const { aberta } = await fetchLojaInfo(lojaId);
    if (aberta) {
      badge.classList.add('aberto');
      badge.innerHTML = '<i class="fas fa-store"></i> Aberto';
    } else {
      badge.classList.add('fechado');
      badge.innerHTML = '<i class="fas fa-store-slash"></i> Fechado';
    }
  } catch {
    badge.textContent = 'Erro';
  }
}

// ——— FETCH DE PRODUTOS ———
async function loadProducts() {
  try {
    const resp = await fetch("/api/Produto/1");
    if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
    products = await resp.json();
    renderProducts();
  } catch (err) {
    console.error("Erro ao buscar produtos:", err);
    productsContainer.innerHTML = "<p>Não foi possível carregar os produtos.</p>";
  }
}

// ——— RENDERIZAÇÃO ———
function renderProducts() {
  productsContainer.innerHTML = "";

  const filtered = products.filter(p => {
    const catOk  = currentCategory === "Todos" || p.categoria === currentCategory;
    const textOk = p.nome.toLowerCase().includes(currentSearch)
                || p.descricao.toLowerCase().includes(currentSearch);
    return catOk && textOk;
  });

  if (!filtered.length) {
    productsContainer.innerHTML = "<p>Nenhum produto encontrado.</p>";
    return;
  }

  const byCat = filtered.reduce((acc, p) => {
    (acc[p.categoria] ||= []).push(p);
    return acc;
  }, {});

  Object.entries(byCat).forEach(([cat, items]) => {
    const bloco = document.createElement("div");
    bloco.className = "category-block";
    bloco.innerHTML = `<h3 class="category-title">${cat}</h3>`;

    const grid = document.createElement("div");
    grid.className = "category-grid";

    items.forEach(prod => {
      const path = prod.imagemUrl.replace(/^\/+/, "");        // remove barras extras
      const src  = `${window.location.origin}/${path}`;
      const card = document.createElement("div");
      card.className = "product-card";
      card.innerHTML = `
        <div class="product-details">
          <h3 class="product-name">${prod.nome}</h3>
          <p class="product-description">${prod.descricao}</p>
          <span class="product-price">
            R$ ${prod.preco.toLocaleString("pt-BR",{ minimumFractionDigits:2 })}
          </span>
        </div>
        <img src="${src}" alt="${prod.nome}" class="product-image"/>
      `;
      card.dataset.id = prod.id;
      card.addEventListener("click", () => {
        window.location.href = `product-detail.html?id=${prod.id}`;
      });
      grid.appendChild(card);
    });

    bloco.appendChild(grid);
    productsContainer.appendChild(bloco);
  });
}

// ——— MODAIS E BINDINGS ———
document.addEventListener("DOMContentLoaded", async  () => {
  // Atualiza status da loja e carrega produtos
  atualizarStatusLoja(1);
  loadProducts();

  // Info modal
  const ellipsis    = document.querySelector('.ellipsis');
  const overlay     = document.getElementById('modal-overlay');
  const modal       = document.getElementById('modal-container');
  const closeBtn    = document.getElementById('modal-close');

  const cartBar     = document.getElementById("cart-bar");
  const cartCountEl = document.getElementById("cart-count");
  const whatsapp    = localStorage.getItem("bgHouse_whatsapp");

  if (whatsapp) {
    try {
      const resp = await fetch(`/api/Cart?whatsapp=${encodeURIComponent(whatsapp)}`);
      if (resp.ok) {
        const cart = await resp.json();
        const totalItems = cart.items.reduce((sum, i) => sum + i.quantidade, 0);
        if (totalItems > 0) {
          cartCountEl.textContent = `(${totalItems}) Veja meu carrinho`;
          cartBar.classList.remove("hidden");
          // ao clicar, leva à página do carrinho
          cartBar.onclick = () => window.location.href = "cart.html";
        }
      }
    } catch (err) {
      console.error("Não foi possível carregar o carrinho:", err);
    }
  }

  function openModal() {
    overlay.classList.remove('hidden');
    modal.classList.remove('hidden');
    document.body.classList.add('modal-open');
  }
  function closeModal() {
    overlay.classList.add('hidden');
    modal.classList.add('hidden');
    document.body.classList.remove('modal-open');
  }
  ellipsis.addEventListener('click', openModal);
  overlay.addEventListener('click', closeModal);
  closeBtn.addEventListener('click', closeModal);
  document.getElementById('modal-content').addEventListener('click', e => e.stopPropagation());

  // Schedule modal
  const schOverlay   = document.getElementById('schedule-overlay');
  const schContainer = document.getElementById('schedule-container');
  const schCloseBtn  = document.getElementById('schedule-close');
  function openSchedule() {
    schOverlay.classList.remove('hidden');
    schContainer.classList.remove('hidden');
    document.body.classList.add('modal-open');
  }
  function closeSchedule() {
    schOverlay.classList.add('hidden');
    schContainer.classList.add('hidden');
    document.body.classList.remove('modal-open');
  }
  badge.addEventListener('click', openSchedule);
  schOverlay.addEventListener('click', closeSchedule);
  schCloseBtn.addEventListener('click', closeSchedule);
  document.getElementById('schedule-content').addEventListener('click', e => e.stopPropagation());

  // Navegação de botões
  ordersBtn.addEventListener("click", () => {
    if (identifyUser()) window.location.href = "orders-list.html";
    else window.location.href = "identify.html?return=index.html";
  });
  scheduleBtn.addEventListener("click", () => {
    if (identifyUser()) window.location.href = "edit-address.html";
    else window.location.href = "identify.html?return=edit-address.html";
  });

  // Filtro de categorias
  categoryItems.forEach(li => {
    li.addEventListener("click", () => {
      categoryItems.forEach(el => el.classList.remove("active"));
      li.classList.add("active");
      currentCategory = li.textContent;
      renderProducts();
      document.querySelector(".search-nav")
              .scrollIntoView({ behavior:"smooth", block:"start" });
    });
  });

  // Busca por texto
  searchInput.addEventListener("input", () => {
    currentSearch = searchInput.value.trim().toLowerCase();
    renderProducts();
  });
});
