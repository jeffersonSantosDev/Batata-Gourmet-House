// ——— DADOS ———
const products = [
  { id: 1,  name: "Calabresa",                     description: "Batata recheada de calabresa e mussarela",                   price: 12.00, image: "imagens/itemCardapio.jpg", typeMenu: "Batatas" },
  { id: 2,  name: "Calabresa com Bacon",           description: "Batata recheada de calabresa e bacon",                      price: 15.00, image: "imagens/itemCardapio.jpg", typeMenu: "Batatas" },
  { id: 3,  name: "Carne",                         description: "Batata recheada de carne e mussarela",                       price: 15.00, image: "imagens/itemCardapio.jpg", typeMenu: "Batatas" },
  { id: 4,  name: "Refrigerante",                  description: "Refrigerante sabor cola 350ml",                             price: 5.00,  image: "imagens/itemCardapio.jpg", typeMenu: "Bebidas" },
  { id: 5,  name: "Água Mineral",                  description: "Água mineral 500ml",                                       price: 4.00,  image: "imagens/itemCardapio.jpg", typeMenu: "Bebidas" },
  { id: 6,  name: "Brownie",                       description: "Brownie de chocolate com nozes",                            price: 8.00,  image: "imagens/itemCardapio.jpg", typeMenu: "Sobremesas" },
  { id: 7,  name: "Batata + Refri",                description: "Combo Batata + Refrigerante",                               price: 18.00, image: "imagens/itemCardapio.jpg", typeMenu: "Combos" },
  { id: 8,  name: "Batata Napolitana",             description: "Batata com molho de tomate, mussarela e orégano",           price: 17.00, image: "imagens/itemCardapio.jpg", typeMenu: "Batatas" },
  { id: 9,  name: "Batata Parmesão",               description: "Batata com mussarela, parmesão e bacon crocante",           price: 18.00, image: "imagens/itemCardapio.jpg", typeMenu: "Batatas" },
  { id: 10, name: "Batata Mexicana",               description: "Batata com carne temperada, cheddar e jalapeños",           price: 19.00, image: "imagens/itemCardapio.jpg", typeMenu: "Batatas" },
  { id: 11, name: "Frango com Catupiry",           description: "Batata recheada de frango desfiado e catupiry",             price: 16.00, image: "imagens/itemCardapio.jpg", typeMenu: "Batatas" },
  { id: 12, name: "Quatro Queijos",                description: "Batata com mussarela, gorgonzola, provolone e parmesão",    price: 20.00, image: "imagens/itemCardapio.jpg", typeMenu: "Batatas" },
  { id: 13, name: "Calabresa Picante",             description: "Batata com calabresa, pimenta biquinho e queijo",           price: 17.00, image: "imagens/itemCardapio.jpg", typeMenu: "Batatas" },
  { id: 14, name: "Batata à Portuguesa",           description: "Batata com presunto, ervilha, ovo de codorna e mussarela",  price: 18.00, image: "imagens/itemCardapio.jpg", typeMenu: "Batatas" },
  { id: 15, name: "Batata Vegetariana",            description: "Batata com mix de legumes assados e queijo vegetal",        price: 16.50, image: "imagens/itemCardapio.jpg", typeMenu: "Batatas" },
  { id: 16, name: "Batata Trufada",                description: "Batata com creme de trufa e lascas de parmesão",            price: 23.00, image: "imagens/itemCardapio.jpg", typeMenu: "Batatas" },
  { id: 17, name: "Batata Mediterrânea",           description: "Batata com azeitonas, tomate seco e rúcula fresca",         price: 19.50, image: "imagens/itemCardapio.jpg", typeMenu: "Batatas" },
  { id: 18, name: "Batata BBQ",                    description: "Batata com pulled chicken ao molho barbecue e cheddar",      price: 21.00, image: "imagens/itemCardapio.jpg", typeMenu: "Batatas" },
  { id: 19, name: "Batata Carbonara",              description: "Batata com bacon, ovo pochê e parmesão",                     price: 20.00, image: "imagens/itemCardapio.jpg", typeMenu: "Batatas" },
  { id: 20, name: "Batata Mexidinha",              description: "Batata com ovos mexidos, bacon e queijo derretido",         price: 18.50, image: "imagens/itemCardapio.jpg", typeMenu: "Batatas" },
  { id: 21, name: "Suco de Laranja Natural",       description: "Suco espremido na hora, sem adição de açúcar",              price: 6.00,  image: "imagens/itemCardapio.jpg", typeMenu: "Bebidas" },
  { id: 22, name: "Suco de Abacaxi com Hortelã",   description: "Suco refrescante de abacaxi batido com folhas de hortelã",  price: 7.00,  image: "imagens/itemCardapio.jpg", typeMenu: "Bebidas" },
  { id: 23, name: "Limonada Siciliana",           description: "Limonada rosa com limão siciliano e toque de framboesa",    price: 6.50,  image: "imagens/itemCardapio.jpg", typeMenu: "Bebidas" },
  { id: 24, name: "Chá Gelado de Pêssego",         description: "Chá preto gelado com pedacinhos de pêssego",                price: 5.50,  image: "imagens/itemCardapio.jpg", typeMenu: "Bebidas" },
  { id: 25, name: "Refrigerante Dieta",            description: "Versão zero açúcar do refrigerante sabor cola 350ml",       price: 5.00,  image: "imagens/itemCardapio.jpg", typeMenu: "Bebidas" },
  { id: 26, name: "Água com Gás",                  description: "Água mineral com gás 500ml",                                price: 5.00,  image: "imagens/itemCardapio.jpg", typeMenu: "Bebidas" },
  { id: 27, name: "Cerveja Pilsen 350ml",          description: "Cerveja leve estilo pilsen, gelada e refrescante",          price: 8.00,  image: "imagens/itemCardapio.jpg", typeMenu: "Bebidas" },
  { id: 28, name: "Cerveja Artesanal IPA 350ml",   description: "Cerveja artesanal India Pale Ale, sabor intenso",           price: 12.00, image: "imagens/itemCardapio.jpg", typeMenu: "Bebidas" },
  { id: 29, name: "Vitamina de Morango",          description: "Leite batido com morangos frescos e mel",                   price: 9.00,  image: "imagens/itemCardapio.jpg", typeMenu: "Bebidas" },
  { id: 30, name: "Milkshake de Ovomaltine",       description: "Milkshake cremoso com achocolatado Ovomaltine",             price: 12.00, image: "imagens/itemCardapio.jpg", typeMenu: "Bebidas" },
  { id: 31, name: "Brownie com Sorvete",           description: "Brownie quentinho servido com bola de sorvete de creme",    price: 14.00, image: "imagens/itemCardapio.jpg", typeMenu: "Sobremesas" },
  { id: 32, name: "Petit Gateau",                  description: "Bolinho de chocolate com recheio cremoso e sorvete",        price: 16.00, image: "imagens/itemCardapio.jpg", typeMenu: "Sobremesas" },
  { id: 33, name: "Cheesecake de Frutas Vermelhas",description: "Cheesecake cremoso com calda de frutas vermelhas",          price: 15.00, image: "imagens/itemCardapio.jpg", typeMenu: "Sobremesas" },
  { id: 34, name: "Torta de Limão",                description: "Torta com massa crocante e recheio de creme de limão",      price: 13.00, image: "imagens/itemCardapio.jpg", typeMenu: "Sobremesas" },
  { id: 35, name: "Mousse de Maracujá",            description: "Mousse aerado de maracujá com calda ácida",                 price: 12.00, image: "imagens/itemCardapio.jpg", typeMenu: "Sobremesas" },
  { id: 36, name: "Combo Família",                 description: "3 batatas à escolha + 4 refrigerantes",                    price: 55.00, image: "imagens/itemCardapio.jpg", typeMenu: "Combos" },
  { id: 37, name: "Combo Casal",                   description: "2 batatas à escolha + 2 bebidas",                          price: 40.00, image: "imagens/itemCardapio.jpg", typeMenu: "Combos" }
];


// estado
let currentCategory = "Todos";
let currentSearch = "";

// refs
const productsContainer = document.getElementById("products-container");
const searchInput = document.querySelector(".search-input");
const categoryItems = document.querySelectorAll("#category-nav-list li");
const ordersBtn = document.querySelector(".btn.orders");
const scheduleBtn = document.querySelector(".btn.info");

// FETCH LOJA
async function fetchLojaInfo(lojaId) {
  const resp = await fetch('/api/Usuario/GetStatusById', {
    method: 'POST',
    mode: 'cors',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id: lojaId })
  });
  if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
  return await resp.json();
}

async function atualizarStatusLoja(lojaId) {
  const badge = document.getElementById('storeBadge');
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

// RENDERIZA PRODUTOS
function renderProducts() {
  productsContainer.innerHTML = "";
  const filtered = products.filter(p => {
    const matchCat = currentCategory === "Todos" || p.typeMenu === currentCategory;
    const matchText = p.name.toLowerCase().includes(currentSearch)
      || p.description.toLowerCase().includes(currentSearch);
    return matchCat && matchText;
  });
  if (!filtered.length) {
    productsContainer.innerHTML = "<p>Nenhum produto encontrado.</p>";
    return;
  }
  const byCat = filtered.reduce((acc, p) => {
    (acc[p.typeMenu] ||= []).push(p);
    return acc;
  }, {});
  Object.entries(byCat).forEach(([cat, items]) => {
    const bloco = document.createElement("div");
    bloco.className = "category-block";
    const h3 = document.createElement("h3");
    h3.className = "category-title";
    h3.textContent = cat;
    bloco.appendChild(h3);
    const list = document.createElement("div");
    list.className = "category-grid";
    items.forEach(prod => {
      const card = document.createElement("div");
      card.className = "product-card";
      card.innerHTML = `
        <div class="product-details">
          <h3 class="product-name">${prod.name}</h3>
          <p class="product-description">${prod.description}</p>
          <span class="product-price">R$ ${prod.price.toFixed(2).replace(".", ",")}</span>
        </div>
        <img src="${prod.image}" alt="${prod.name}" class="product-image"/>
      `;
      card.dataset.id = prod.id;
      card.addEventListener("click", () => {
        window.location.href = `product-detail.html?id=${prod.id}`;
      });
      list.appendChild(card);
    });
    bloco.appendChild(list);
    productsContainer.appendChild(bloco);
  });
}

// MODAL INFO
document.addEventListener('DOMContentLoaded', () => {
  atualizarStatusLoja(1);
  renderProducts();

  // Info modal
  const ellipsis = document.querySelector('.ellipsis');
  const overlay = document.getElementById('modal-overlay');
  const modal = document.getElementById('modal-container');
  const closeBtn = document.getElementById('modal-close');
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
  const badge = document.getElementById('storeBadge');
  const schOverlay = document.getElementById('schedule-overlay');
  const schContainer = document.getElementById('schedule-container');
  const schCloseBtn = document.getElementById('schedule-close');
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

  // Navegação
  ordersBtn.addEventListener("click", () => {
    if (identifyUser()) window.location.href = "index.html";
    else window.location.href = "identify.html?return=orders-list.html";
  });
  scheduleBtn.addEventListener("click", () => {
    if (identifyUser()) window.location.href = "edit-address.html";
    else window.location.href = "identify.html?return=edit-address.html";
  });

  // Categorias
  categoryItems.forEach(li => {
    li.addEventListener("click", () => {
      categoryItems.forEach(el => el.classList.remove("active"));
      li.classList.add("active");
      currentCategory = li.textContent;
      renderProducts();
      document.querySelector(".search-nav")?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  });

  // Busca
  searchInput.addEventListener("input", () => {
    currentSearch = searchInput.value.trim().toLowerCase();
    renderProducts();
  });
});
