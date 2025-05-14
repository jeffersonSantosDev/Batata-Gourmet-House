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
  
    // Volta para home
    backBtn.onclick = () => window.location.href = "index.html";
  
    // Carrega usuário
    const whatsapp   = localStorage.getItem("bgHouse_whatsapp");
    const uidEnc     = localStorage.getItem("bgHouse_id");
    const usuarioId  = uidEnc ? parseInt(atob(uidEnc)) : null;
    if (!whatsapp || !usuarioId) {
      return swal("Ops!","Identifique-se.","warning")
        .then(() => window.location.href="identify.html?return=entrega.html");
    }
    // Preenche nome/telefone
    userNameEl.textContent  = localStorage.getItem("bgHouse_name") || "Usuário";
    userPhoneEl.textContent = localStorage.getItem("bgHouse_whatsapp");
  
    // Busca endereços
    async function carregarEnderecos() {
      loading.classList.remove("hidden");
      try {
        const resp = await fetch(`/api/Usuario/Enderecos?usuarioId=${usuarioId}`);
        if (!resp.ok) throw new Error();
        const list = await resp.json(); // [{ id, linha1, cidade, padrao }, ...]
        form.innerHTML = "";
        list.forEach(addr => {
          const div = document.createElement("label");
          div.className = "address-option" + (addr.padrao ? " address-default" : "");
          div.innerHTML = `
            <input type="radio" name="addressId" value="${addr.id}" ${addr.padrao?"checked":""}/>
            <span class="address-label">${addr.linha1}, ${addr.cidade}</span>`;
          form.appendChild(div);
        });
      } catch {
        swal("Erro","Não foi possível carregar endereços.","error");
      } finally {
        loading.classList.add("hidden");
      }
    }
  
    // Adicionar endereço
    addBtn.onclick = () => window.location.href = "novo-endereco.html";
  
    // Total (pegue do localStorage ou API de carrinho)
    const total = parseFloat(localStorage.getItem("bgHouse_total") || "0");
    totalEl.textContent = `R$ ${fmt(total)}`;
  
    // Próximo passo
    nextBtn.onclick = () => {
      const checked = form.addressId.value;
      if (!checked) {
        swal("Atenção","Escolha um endereço.","warning");
        return;
      }
      // redireciona e envia o addressId via query
      window.location.href = `checkout.html?addressId=${checked}`;
    };
  
    // Inicializa
    await carregarEnderecos();
  });
  