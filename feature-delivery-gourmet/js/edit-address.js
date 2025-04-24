// js/edit-address.js
document.addEventListener("DOMContentLoaded", () => {
    const backBtn     = document.getElementById("backBtn");
    const saveBtn     = document.getElementById("saveBtn");
    const listEl      = document.getElementById("addressList");
    let selectedId    = null;
  
    // 1) Seed de exemplo (só se não houver nada)
    if (!localStorage.getItem("bgHouse_addresses")) {
      localStorage.setItem("bgHouse_addresses", JSON.stringify([
        { id: 1, label: "Endereço 1", details: "Rua Exemplo, 123 – Centro/CEP" }
      ]));
    }
  
    // 2) Voltar
    backBtn.addEventListener("click", () =>
      history.length > 1 ? history.back() : window.location.href = "/"
    );
  
    // 3) Carrega endereços
    const addresses = JSON.parse(localStorage.getItem("bgHouse_addresses"));
    addresses.forEach(addr => {
      const li = document.createElement("li");
      li.className = "address-item";
      li.innerHTML = `
        <div class="address-info">
          <input type="radio" name="chosenAddress" id="addr-${addr.id}" value="${addr.id}">
          <label for="addr-${addr.id}">
            <strong>${addr.label}</strong>
            <div class="details">${addr.details}</div>
          </label>
        </div>
        <button class="menu-btn">⋮</button>
      `;
      listEl.appendChild(li);
    });
  
    // 4) Captura seleção
    listEl.addEventListener("change", e => {
      if (e.target.name === "chosenAddress") {
        selectedId = e.target.value;
      }
    });
  
    // 5) Salvar e voltar
    saveBtn.addEventListener("click", () => {
      if (!selectedId) {
        alert("Por favor, selecione um endereço.");
        return;
      }
      localStorage.setItem("bgHouse_selectedAddress", selectedId);
      history.back();
    });
  });
  