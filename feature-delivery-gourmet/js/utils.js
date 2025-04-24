/**
 * Se a página vier de um reload (F5, CTRL+R, etc.), limpa o localStorage.
 * Deve ser chamado **antes** de qualquer outro código que dependa de localStorage.
 */
function clearStorageOnReload() {
    // 1) Captura navegações do tipo “reload”
    const navEntries = performance.getEntriesByType("navigation");
    if (navEntries.length > 0 && navEntries[0].type === "reload") {
      localStorage.clear();
      return;
    }
    // 2) Intercepta F5 e CTRL+R antes de disparar o reload
    window.addEventListener("keydown", e => {
      if (e.key === "F5" || (e.ctrlKey && (e.key === "r" || e.key === "R"))) {
        localStorage.clear();
        // Deixe o reload acontecer naturalmente
      }
    });
  }
  
  // Execute imediatamente
  clearStorageOnReload();
  
  // Exponha globalmente, caso queira chamar manualmente
  window.clearStorageOnReload = clearStorageOnReload;
  