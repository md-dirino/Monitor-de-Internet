const { execSync } = require("child_process");
const fs = require("fs");

// Função para incrementar versão do package.json
function incrementPatch(versionString) {
    const parts = versionString.split(".").map(n => parseInt(n));
    parts[2] += 1; // Incrementa o patch (ex: 1.2.15 → 1.2.16)
    return parts.join(".");
}

// 1️⃣ Ler a versão atual do package.json
const packageJson = JSON.parse(fs.readFileSync("package.json", "utf8"));
const oldVersion = packageJson.version;
const newVersion = incrementPatch(oldVersion);

// 2️⃣ Atualizar o package.json para a nova versão
packageJson.version = newVersion;
fs.writeFileSync("package.json", JSON.stringify(packageJson, null, 2));

console.log(`\n🔄 Atualizando versão do pacote: ${oldVersion} → ${newVersion}`);

// 3️⃣ Criar um commit inicial da nova versão e adicionar a tag correspondente
execSync(`git add package.json`, { stdio: "inherit" });
execSync(`git commit -m "chore: Bump version to ${newVersion}"`, { stdio: "inherit" });
execSync(`git tag v${newVersion}`, { stdio: "inherit" });

// 4️⃣ Gerar release notes com base nos commits desde a última versão
let commitMessages;
try {
    commitMessages = execSync(`git log v${oldVersion}..HEAD --pretty=format:"- %s"`).toString().trim();
} catch (error) {
    commitMessages = "Sem mudanças registradas.";
}

const releaseNotes = `🚀 **Novidades na versão ${newVersion}:**\n\n${commitMessages || "Sem mudanças registradas."}`;
fs.writeFileSync("release-notes.txt", releaseNotes);

console.log("\n📃 Release Notes geradas:\n");
console.log(releaseNotes);

// 5️⃣ Criar um novo commit para incluir as release notes na mensagem
execSync(`git commit --allow-empty -m "chore: Release ${newVersion}\n\n${releaseNotes}"`, { stdio: "inherit" });

// 6️⃣ Atualizar a tag para apontar para o commit final, que contém as release notes
execSync(`git tag -d v${newVersion}`, { stdio: "inherit" });
execSync(`git tag v${newVersion}`, { stdio: "inherit" });

// 7️⃣ Enviar tudo para o GitHub
execSync(`git push && git push --tags`, { stdio: "inherit" });

console.log(`\n✅ Versão ${newVersion} criada, commitada e tagueada corretamente!`);
console.log("Pronto para gerar o instalador.");