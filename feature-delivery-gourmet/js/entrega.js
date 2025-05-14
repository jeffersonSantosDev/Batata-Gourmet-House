// js/entrega.js
document.addEventListener("DOMContentLoaded", async () => {
    const loading     = document.getElementById("loadingOverlay");
    const backBtn     = document.getElementById("backBtn");
    const userNameEl  = document.getElementById("userName");
    const userPhoneEl = document.getElementById("userPhone");
    const form        = document.getElementById("addressesForm");
    const addBtn      = document.getElementById("addAddressBtn");
    const nextBtn     = document.getElementById("nextBtn");
    const totalEl     = document.getElementById("total");
    const fmt         = v => v.toFixed(2).replace(".",",");
  
    // Voltar à home
    backBtn.onclick = () => window.location.href = "index.html";
  
    // Carrega usuário
    const numeroFull = localStorage.getItem("bgHouse_whatsapp");  // e.g. "5511949128076"
    const nome       = localStorage.getItem("bgHouse_name") || "Usuário";
    if (!numeroFull) {
      return swal("Ops!","Identifique-se.","warning")
        .then(() => window.location.href="identify.html?return=entrega.html");
    }
    userNameEl.textContent  = nome;
    userPhoneEl.textContent = numeroFull.replace(/(\d{2})(\d{5})(\d{4})/, '+$1 $2-$3');
  
    // Busca endereços pelo WhatsApp
    async function carregarEnderecos() {
      loading.classList.remove("hidden");
      try {
        const resp = await fetch(
          'http://batatagourmethouse.runasp.net/api/Usuario/GetAddressesByWhatsApp',
          {
            method: "POST",
            headers: {
              "Accept": "application/json",
              "Content-Type": "application/json"
            },
            body: JSON.stringify({ numero: numeroFull })
          }
        );
        if (!resp.ok) throw new Error();
        const list = await resp.json(); 
        form.innerHTML = "";
  
        list.forEach(addr => {
          const label = document.createElement("label");
          label.className = "address-option" + (addr.padrao ? " address-default" : "");
          label.innerHTML = `
            <input type="radio" name="addressId" value="${addr.id}" ${addr.padrao ? "checked" : ""}/>
            <div class="address-label">
              ${addr.rua}, ${addr.numero}${addr.referencia ? ` (<i>${addr.referencia}</i>)` : ""}
              <small>${addr.bairro} - ${addr.cidade}/${addr.uf}</small>
              <small>Dist: ${addr.distanciaKm.toFixed(1)} km • ${addr.tempoMinutos} min • Frete R$ ${fmt(addr.frete)}</small>
            </div>`;
          form.appendChild(label);
        });
      } catch {
        swal("Erro","Não foi possível carregar endereços.","error");
      } finally {
        loading.classList.add("hidden");
      }
    }
  
    // Nova rota de adicionar endereço
    addBtn.onclick = () => window.location.href = "novo-endereco.html";
  
    // TOTAL: pegue do localStorage ou API do carrinho
    const total = parseFloat(localStorage.getItem("bgHouse_total") || "0");
    totalEl.textContent = `R$ ${fmt(total)}`;
  
    // Avançar para o próximo passo (checkout)
    nextBtn.onclick = () => {
      const chosen = form.addressId.value;
      if (!chosen) {
        swal("Atenção","Escolha um endereço.","warning");
        return;
      }
      // passa endereço selecionado por query
      window.location.href = `checkout.html?addressId=${chosen}`;
    };
  
    // Inicializa
    await carregarEnderecos();
  });
  