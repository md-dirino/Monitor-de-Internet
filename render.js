// Processo de Renderização
console.log('✅ Processo de renderização iniciado!');

// Aguarda o carregamento do DOM e solicita a versão do app
window.addEventListener('DOMContentLoaded', async () => {
    try {
        const version = await window.electronAPI.getAppVersion();

        // Atualiza o texto da versão na página
        document.getElementById('app-version').innerText = version;

        // Captura o título atual e adiciona a versão ao final dele
        const currentTitle = document.title;
        document.title = `${currentTitle} v${version}`;

        console.log("✅ Versão do app carregada:", version);
    } catch (error) {
        console.error("Erro ao obter a versão do app:", error);
    }
});