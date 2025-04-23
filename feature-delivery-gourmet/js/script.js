// ——— DADOS ———
const products = [
  { id: 1, name: "Calabresa",           description: "Batata recheada de calabresa e mussarelaBatata recheada de calabresa e mussarela", price: 12.00, image: "imagens/itemCardapio.jpg",       typeMenu: "Batatas" },
  { id: 2, name: "Calabresa com Bacon", description: "Batata recheada de calabresa e bacon ",     price: 15.00, image: "imagens/itemCardapio.jpg",typeMenu: "Batatas" },
  { id: 3, name: "Carne",              description: "Batata recheada de carne e mussarela",      price: 15.00, image: "imagens/itemCardapio.jpg",          typeMenu: "Batatas" },
  { id: 4, name: "Refrigerante",       description: "Refrigerante sabor cola 350ml",             price:  5.00, image: "imagens/itemCardapio.jpg",  typeMenu: "Bebidas" },
  { id: 5, name: "Água Mineral",       description: "Água mineral 500ml",                        price:  4.00, image: "imagens/itemCardapio.jpg",          typeMenu: "Bebidas" },
  { id: 6, name: "Brownie",            description: "Brownie de chocolate com nozes",             price:  8.00, image: "imagens/itemCardapio.jpg",       typeMenu: "Sobremesas" },
];

// estado
let currentCategory = "Todos";
let currentSearch   = "";

// refs
const productsContainer = document.getElementById("products-container");
const searchInput       = document.querySelector(".search-input");
const categoryItems     = document.querySelectorAll("#category-nav-list li");

// init
document.addEventListener("DOMContentLoaded", () => {
  // clicar nas categorias
  categoryItems.forEach(li => {
    li.addEventListener("click", () => {
      // troca a classe active
      categoryItems.forEach(el => el.classList.remove("active"));
      li.classList.add("active");
  
      // atualiza filtro e re-renderiza
      currentCategory = li.textContent;
      renderProducts();
  
      // faz scroll suave até a search-nav
      const searchNav = document.querySelector(".search-nav");
      if (searchNav) {
        searchNav.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    });
  });

  // digitar na busca
  searchInput.addEventListener("input", () => {
    currentSearch = searchInput.value.trim().toLowerCase();
    renderProducts();
  });

  // primeira chamada
  renderProducts();
});

function renderProducts() {
  productsContainer.innerHTML = "";
  const filtered = products.filter(p => {
    const matchCat  = currentCategory === "Todos" || p.typeMenu === currentCategory;
    const matchText = p.name.toLowerCase().includes(currentSearch)
                   || p.description.toLowerCase().includes(currentSearch);
    return matchCat && matchText;
  });

  if (!filtered.length) {
    productsContainer.innerHTML = "<p>Nenhum produto encontrado.</p>";
    return;
  }

  // agrupa
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
          <span class="product-price">${prod.price.toFixed(2)} AED</span>
        </div>
        <img src="${prod.image}" alt="${prod.name}" class="product-image"/>
      `;
      list.appendChild(card);
    });

    bloco.appendChild(list);
    productsContainer.appendChild(bloco);
  });
}
