// js/product-detail.js
document.addEventListener("DOMContentLoaded", async () => {
  const loading = document.getElementById("loadingOverlay");
  function showLoading() { loading.classList.remove("hidden"); }
  function hideLoading() { loading.classList.add("hidden"); }

  showLoading();

  // Se não estiver logado, apenas oculta o loading e continua
  if (!identifyUser()) {
    hideLoading(); 
  }

  // Parâmetros
  const params = new URLSearchParams(location.search);
  const id     = Number(params.get("id"));
  const loja   = 1;

  // Refs
  const titleEl    = document.getElementById("detailTitle");
  const mainEl     = document.querySelector(".detail-main");
  const addonsList = document.getElementById("addonsList");
  const mainQtyEl  = document.getElementById("mainQty");
  const minusMain  = document.getElementById("mainMinus");
  const plusMain   = document.getElementById("mainPlus");
  const finalPrice = document.getElementById("finalPrice");
  const addCartBtn = document.getElementById("addCartBtn"); 
  const notesInput   = document.getElementById("notes");

  // Inserção dinâmica da seção de imagem/descrição
  const infoSection = document.createElement("section");
  infoSection.className = "product-info";
  infoSection.innerHTML = `
    <img id="detailImage" class="product-img" src="" alt=""/>
    <p id="detailDesc" class="product-desc"></p>`;
  // antes das observações
  const notesSec = document.querySelector(".notes-section");
  mainEl.insertBefore(infoSection, notesSec);

  // Busca do detalhe
  let prod;
  try {
    const resp = await fetch(`/api/Produto/Detail/${id}?loja=${loja}`);
    if (!resp.ok) throw new Error("Produto não encontrado");
    prod = await resp.json();
  } catch (err) {
    hideLoading();
    await swal("Erro", "Não foi possível carregar o produto.", "error");
    return history.back();
  }
  hideLoading();

  // Popula dados básicos
  titleEl.textContent = prod.nome;
  const imgEl = document.getElementById("detailImage");
  imgEl.src = `${window.location.origin}/${prod.imagemUrl.replace(/^\/+/, "")}`;
  imgEl.alt = prod.nome;
  document.getElementById("detailDesc").textContent = prod.descricao;

  let mainQty = 1;
  const selectedAddons = {};

  // Monta adicionais
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

  // Função para atualizar o preço total
  const updateFinal = () => {
    const base   = prod.preco * mainQty;
    const extras = Object.entries(selectedAddons)
      .reduce((sum,[aid,q]) => {
        const ad = prod.adicionais.find(x=>x.id==aid);
        return sum + (ad.preco * q);
      }, 0);
    finalPrice.textContent = (base + extras)
      .toFixed(2).replace(".",",");
  };
  updateFinal();

  // Controles qty principal
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

  // Controles de adicionais
  addonsList.addEventListener("click", e => {
    const btn = e.target.closest("button");
    if (!btn) return;
    const aid = btn.dataset.id;
    let qty = selectedAddons[aid] || 0;
    const usedTypes = Object.values(selectedAddons)
      .filter(v=>v>0).length;

    if (btn.classList.contains("plus")) {
      if (usedTypes >= 3 && qty === 0) return;
      qty++;
    } else {
      if (qty > 0) qty--;
    }

    if (qty > 0) selectedAddons[aid] = qty;
    else delete selectedAddons[aid];

    btn.parentNode.querySelector(".qty").textContent = qty;
    updateFinal();
  });

  // Botão voltar
  document.getElementById("backBtn").onclick = () => {
    window.location.href = "index.html";
  };
 
  // Adicionar ao carrinho
  addCartBtn.onclick = async () => {
    if (!identifyUser()) {
      location.replace(`identify.html?return=${encodeURIComponent(location.pathname + location.search)}`);
      return;
    }
  
    const payload = {
      whatsapp: localStorage.getItem("bgHouse_whatsapp"),
      produtoId: prod.id,
      quantidade: mainQty,
      observacoes: notesInput.value.trim(),
      adicionais: prod.adicionais
        .filter(a => selectedAddons[a.id] > 0)
        .map(a => ({
          adicionalId: a.id,
          quantidade: selectedAddons[a.id],
          preco: a.preco
        }))
    };
  
    try {
      showLoading();
      const r = await fetch("/api/Cart/AddItem", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      if (!r.ok) throw new Error();
  
      // Sucesso: exibe alerta e redireciona para a home
      swal("Adicionado!", `Você adicionou ${mainQty}× ${prod.nome}`, "success")
        .then(() => {
          // Aqui redireciona para a página inicial
          window.location.href = "index.html";
        });
  
    } catch {
      swal("Erro", "Não foi possível adicionar ao carrinho.", "error");
    } finally {
      hideLoading();
    }
  };
  

});
