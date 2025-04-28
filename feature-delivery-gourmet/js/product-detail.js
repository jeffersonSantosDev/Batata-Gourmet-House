// js/product-detail.js
document.addEventListener("DOMContentLoaded", async () => {
    // verifica identificação
    if (!window.identifyUser()) return;
  
    // exemplo estático; substitua pela sua fonte real
    const products = [
      { id:1, name:"Calabresa", desc:"Batata recheada de calabresa e mussarela.", price:12.00, image:"imagens/itemCardapio.jpg" },
      { id:2, name:"Frango",    desc:"Batata recheada de frango com catupiry.",      price:13.50, image:"imagens/itemCardapio.jpg" },
      // ...
    ];
    const addonsData = [
      { name:"Batata Palha", price: 0.00 },
      { name:"Milho",        price: 0.00 },
      { name:"Azeitona",     price: 0.00 },
      { name:"Bacon",        price: 2.00 },
    ];
  
    // refs DOM
    const params       = new URLSearchParams(location.search);
    const id           = Number(params.get("id"));
    const prod         = products.find(p=>p.id===id) || products[0];
    const titleEl      = document.getElementById("detailTitle");
    const imgEl        = document.getElementById("detailImage");
    const descEl       = document.getElementById("detailDesc");
    const addonsList   = document.getElementById("addonsList");
    const mainQtyEl    = document.getElementById("mainQty");
    const minusMain    = document.getElementById("mainMinus");
    const plusMain     = document.getElementById("mainPlus");
    const finalPriceEl = document.getElementById("finalPrice");
    const addCartBtn   = document.getElementById("addCartBtn");
  
    // popula dados básicos
    titleEl.textContent = prod.name;
    imgEl.src = prod.image;
    imgEl.alt = prod.name;
    descEl.textContent = prod.desc;
  
    let mainQty = 1;
    let selectedAddons = {}; // { idx: qty, ... }
  
    // renderiza lista de adicionais
    addonsData.forEach((a,i) => {
      const li = document.createElement("li");
      li.className = "addon-item";
      li.innerHTML = `
        <div>
          <span class="addon-name">${a.name}</span>
          <span class="addon-price">+ R$ ${a.price.toFixed(2).replace(".",",")}</span>
        </div>
        <div class="addon-controls">
          <button class="qty-btn minus" data-idx="${i}">−</button>
          <span class="qty">0</span>
          <button class="qty-btn plus" data-idx="${i}">+</button>
        </div>`;
      addonsList.appendChild(li);
    });
  
    // atualiza o preço total no botão
    function updateFinal() {
      const base = prod.price * mainQty;
      const extras = Object.entries(selectedAddons)
        .reduce((sum,[i,q])=> sum + (addonsData[i].price * q),0);
      const total = base + extras;
      finalPriceEl.textContent = total.toFixed(2).replace(".",",");
    }
  
    updateFinal();
  
    // controles numérico principal
    minusMain.onclick = () => {
      if (mainQty>1) {
        mainQty--;
        mainQtyEl.textContent = mainQty;
        updateFinal();
      }
    };
    plusMain.onclick = () => {
      mainQty++;
      mainQtyEl.textContent = mainQty;
      updateFinal();
    };
  
    // controles de cada adicional
    addonsList.addEventListener("click", e => {
      const btn = e.target.closest("button");
      if (!btn) return;
      const idx = btn.dataset.idx;
      let qty = selectedAddons[idx]||0;
      // conta quantos addons já com qty>0
      const used = Object.values(selectedAddons).reduce((s,v)=> s + (v>0?1:0),0);
  
      if (btn.classList.contains("plus")) {
        if (used>=3 && qty===0) return; // máximo 3 tipos
        qty++;
      }
      if (btn.classList.contains("minus")) {
        if (qty>0) qty--;
      }
      if (qty>0) selectedAddons[idx] = qty;
      else delete selectedAddons[idx];
  
      const span = btn.parentNode.querySelector(".qty");
      span.textContent = qty;
      updateFinal();
    });
  
    // botão voltar
    document.getElementById("backBtn").onclick = () => {
      history.back();
    };
  
    // adicionar ao carrinho
    addCartBtn.onclick = () => {
      // implemente aqui a lógica de adicionar ao carrinho...
      swal("Adicionado!", `Você adicionou ${mainQty}× ${prod.name}`, "success");
    };
  });
  