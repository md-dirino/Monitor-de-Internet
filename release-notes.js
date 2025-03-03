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

// Formata a descrição
const releaseNotes = `🚀 **Novidades na versão ${process.env.npm_package_version}:**\n\n${commitMessages || "Sem mudanças registradas."}`;

// Salva em um arquivo temporário
fs.writeFileSync("release-notes.txt", releaseNotes);

// Exibe no console
console.log(releaseNotes);