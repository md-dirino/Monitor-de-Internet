const { execSync } = require("child_process");
const fs = require("fs");
const readline = require("readline");

// Função para perguntar ao usuário
function askQuestion(query) {
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });

    return new Promise(resolve => rl.question(query, answer => {
        rl.close();
        resolve(answer.trim().toLowerCase());
    }));
}

// Função para incrementar versão do package.json
function incrementPatch(versionString) {
    const parts = versionString.split(".").map(n => parseInt(n));
    parts[2] += 1; // Incrementa o patch (ex: 1.2.16 → 1.2.17)
    return parts.join(".");
}

async function main() {
    // 1️⃣ Ler a versão atual do package.json
    const packageJson = JSON.parse(fs.readFileSync("package.json", "utf8"));
    const oldVersion = packageJson.version;
    const nextVersion = incrementPatch(oldVersion);
    let newVersion = oldVersion;

    // 2️⃣ Perguntar ao usuário se deseja aumentar a versão
    const answer = await askQuestion(`Deseja aumentar para a versão ${nextVersion} antes de compilar? (s/n): `);
    
    if (answer === "s") {
        newVersion = nextVersion;
        packageJson.version = newVersion;
        fs.writeFileSync("package.json", JSON.stringify(packageJson, null, 2));
        console.log(`\n🔄 Atualizando versão do pacote: ${oldVersion} → ${newVersion}`);
        
        // Criar um commit inicial da nova versão
        execSync(`git add package.json`, { stdio: "inherit" });
        execSync(`git commit -m "chore: Bump version to ${newVersion}"`, { stdio: "inherit" });
    } else {
        console.log("\n🔄 Mantendo a versão atual...");
    }

    // 3️⃣ Gerar release notes com base nos commits desde a última versão
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

    // 4️⃣ Criar um novo commit para incluir as release notes na mensagem antes de gerar o instalador
    execSync(`git add release-notes.txt`, { stdio: "inherit" });
    execSync(`git commit -m "chore: Release ${newVersion}\n\n${releaseNotes}"`, { stdio: "inherit" });

    // 5️⃣ Remover a tag localmente (se existir) antes de recriá-la
    try {
        execSync(`git tag -d v${newVersion}`, { stdio: "inherit" });
    } catch (error) {
        console.log(`ℹ️ Nenhuma tag local para remover.`);
    }

    // 6️⃣ Criar ou atualizar a tag e empurrar para o repositório remoto
    execSync(`git tag v${newVersion}`, { stdio: "inherit" });

    try {
        execSync(`git push && git push --tags`, { stdio: "inherit" });
    } catch (error) {
        console.error("\n⚠️ Falha ao enviar as tags. Tente rodar manualmente:");
        console.error("   git push --force && git push --tags --force");
    }

    console.log(`\n✅ Versão ${newVersion} criada e commitada corretamente!`);
    console.log("Pronto para gerar o instalador.");
}

// Executa o script
main();