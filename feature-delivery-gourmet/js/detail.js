// js/detail.js
const products = [
    { id:1, name:"Calabresa", description:"Batata com calabresa e mussarela", price:12.00, image:"imagens/calabresa.jpg" },
    /* ...mesmos produtos do products.js... */
  ];
  
  document.addEventListener("DOMContentLoaded", () => {
    const params = new URLSearchParams(location.search);
    const id     = +params.get("id");
    const prod   = products.find(p => p.id===id);
    if (!prod) return alert("Produto não encontrado");
  
    document.getElementById("detailImage").src        = prod.image;
    document.getElementById("detailImage").alt        = prod.name;
    document.getElementById("detailName").textContent = prod.name;
    document.getElementById("detailDesc").textContent = prod.description;
    document.getElementById("detailPrice").textContent= `R$ ${prod.price.toFixed(2).replace(".",",")}`;
  
    document.getElementById("addToCartBtn").onclick = () => {
      // lógica de carrinho aqui
      alert(`"${prod.name}" adicionado ao carrinho.`);
    };
  });
  