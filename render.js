// Processo de Renderização
console.log('✅ Processo de renderização iniciado!');

// Aguarda o carregamento do DOM e solicita a versão do app
window.addEventListener('DOMContentLoaded', async () => {
    try {
        const version = await window.electronAPI.getAppVersion();
        document.getElementById('app-version').innerText = version;
        console.log("✅ Versão do app carregada:", version);
    } catch (error) {
        console.error("Erro ao obter a versão do app:", error);
    }
});