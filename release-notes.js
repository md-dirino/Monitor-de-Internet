const { execSync } = require("child_process");
const fs = require("fs");

// Obtém o último tag (versão anterior)
let lastTag;
try {
  lastTag = execSync("git describe --tags --abbrev=0").toString().trim();
} catch (error) {
  lastTag = "Nenhum release anterior";
}

// Obtém os commits desde a última tag
const commitMessages = execSync(`git log ${lastTag}..HEAD --pretty=format:"- %s"`).toString().trim();

// Lê a versão atual do package.json
const packageJson = JSON.parse(fs.readFileSync("package.json", "utf8"));
const currentVersion = packageJson.version || "Versão desconhecida";

// Formata a descrição
const releaseNotes = `🚀 **Novidades na versão ${currentVersion}:**\n\n${commitMessages || "Sem mudanças registradas."}`;

// Salva em um arquivo externo para o Electron Builder usar
fs.writeFileSync("release-notes.txt", releaseNotes);

console.log("\nRelease Notes geradas:\n");
console.log(releaseNotes);