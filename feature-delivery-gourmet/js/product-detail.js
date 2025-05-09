document.addEventListener("DOMContentLoaded", async () => {
  if (!identifyUser()) return;

  // Params
  const params = new URLSearchParams(location.search);
  const id     = Number(params.get("id"));
  const loja   = 1; // ou obter dinamicamente se precisar

  // Refs
  const titleEl      = document.getElementById("detailTitle");
  const imgEl        = document.getElementById("detailImage");
  const descEl       = document.getElementById("detailDesc");
  const addonsList   = document.getElementById("addonsList");
  const mainQtyEl    = document.getElementById("mainQty");
  const minusMain    = document.getElementById("mainMinus");
  const plusMain     = document.getElementById("mainPlus");
  const finalPriceEl = document.getElementById("finalPrice");
  const addCartBtn   = document.getElementById("addCartBtn");
  const backBtn      = document.getElementById("backBtn");

  // 1) Busca do back-end
  let prod;
  try {
    const resp = await fetch(`/api/Produto/Detail/${id}?loja=${loja}`);
    if (!resp.ok) throw new Error("Produto não encontrado");
    prod = await resp.json();
  } catch {
    swal("Erro", "Não foi possível carregar o produto.", "error")
       .then(() => history.back());
    return;
  }

  // 2) Renderiza dados básicos
  titleEl.textContent = prod.nome;
  imgEl.src           = `${window.location.origin}/${prod.imagemUrl.replace(/^\/+/, "")}`;
  imgEl.alt           = prod.nome;
  descEl.textContent  = prod.descricao;

  let mainQty = 1;
  let selectedAddons = {};   // { adicionalId: qty, ... }

  // 3) Monta lista de adicionais
  prod.adicionais.forEach(a => {
    const li = document.createElement("li");
    li.className = "addon-item";
    li.dataset.id = a.id;
    li.innerHTML = `
      <div>
        <span class="addon-name">${a.nome}</span>
        <span class="addon-price">+ R$ ${a.preco.toFixed(2).replace(".",",")}</span>
      </div>
      <div class="addon-controls">
        <button class="qty-btn minus" data-id="${a.id}">−</button>
        <span class="qty">0</span>
        <button class="qty-btn plus"  data-id="${a.id}">+</button>
      </div>`;
    addonsList.appendChild(li);
  });

  // 4) Calcula e atualiza preço total
  function updateFinal() {
    const base   = prod.preco * mainQty;
    const extras = Object.entries(selectedAddons)
      .reduce((sum,[aid,q]) => {
        const a = prod.adicionais.find(x=>x.id==aid);
        return sum + (a.preco * q);
      }, 0);
    finalPriceEl.textContent = (base + extras)
      .toFixed(2).replace(".",",");
  }
  updateFinal();

  // 5) Eventos de quantidade principal
  minusMain.onclick = () => {
    if (mainQty > 1) {
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

  // 6) Eventos de adicionais
  addonsList.addEventListener("click", e => {
    const btn = e.target.closest("button");
    if (!btn) return;
    const id   = btn.dataset.id;
    let qty    = selectedAddons[id] || 0;
    const used = Object.values(selectedAddons).reduce((c,v)=> c + (v>0?1:0),0);

    if (btn.classList.contains("plus")) {
      // até 3 tipos
      if (used >= 3 && qty === 0) return;
      qty++;
    } else {
      if (qty > 0) qty--;
    }

    if (qty > 0) selectedAddons[id] = qty;
    else delete selectedAddons[id];

    btn.parentNode.querySelector(".qty").textContent = qty;
    updateFinal();
  });

  // 7) Voltar
  backBtn.onclick = () => history.back();

  // 8) Adicionar ao carrinho (implemente conforme seu storage)
  addCartBtn.onclick = () => {
    // Exemplo: reúna objeto final e salve no localStorage ou chame API de carrinho
    swal("Adicionado!", `${mainQty}× ${prod.nome} adicionado ao carrinho.`, "success");
  };
});
