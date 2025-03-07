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
    const currentVersion = packageJson.version;
    const nextVersion = incrementPatch(currentVersion);
    let finalVersion = currentVersion;

    // 2️⃣ Gerar release notes com base nos commits desde a última versão
    let commitMessages;
    try {
        commitMessages = execSync('git log $(git describe --tags --abbrev=0)..HEAD --pretty=format:"- %s"').toString().trim();
    } catch (error) {
        commitMessages = "Sem mudanças registradas.";
    }
    const releaseNotes = `🚀 Novidades na versão ${currentVersion}:\n\n${commitMessages || "Sem mudanças registradas."}`;
    fs.writeFileSync("release-notes.txt", releaseNotes);

    console.log("\n📃 Release Notes geradas:\n");
    console.log(releaseNotes);

    // 3️⃣ Criar um novo commit para incluir as release notes
    execSync('git add release-notes.txt', { stdio: "inherit" });
    execSync(`git commit -m "Release notes para a versão ${currentVersion}"`, { stdio: "inherit" });

    // 4️⃣ Perguntar ao usuário se deseja aumentar a versão
    const answer = await askQuestion(`Deseja aumentar para a versão ${nextVersion} antes de compilar? (s/n): `);
    
    if (answer === "s") {
        finalVersion = nextVersion;
        packageJson.version = finalVersion;
        fs.writeFileSync("package.json", JSON.stringify(packageJson, null, 2));
        console.log(`\n🔄 Atualizando versão do pacote: ${currentVersion} → ${finalVersion}`);
        
        // Criar um commit para a nova versão
        execSync('git add package.json', { stdio: "inherit" });
        execSync(`git commit -m "🚀 Nova versão disponível ${finalVersion}"`, { stdio: "inherit" });
    } else {
        console.log("\n🔄 Mantendo a versão atual...");
    }

    // 5️⃣ Criar a nova tag da versão atual e enviar
    console.log(`ℹ️ Criando nova tag v${finalVersion}...`);
    execSync(`git tag v${finalVersion}`, { stdio: "inherit" });

    // 6️⃣ Enviar commits e a nova tag para o repositório remoto
    execSync("git push", { stdio: "inherit" });
    execSync(`git push origin v${finalVersion}`, { stdio: "inherit" });

    console.log(`\n✅ Versão ${finalVersion} criada e commitada corretamente!`);
    console.log("Pronto para gerar o instalador.");
}

// Executa o script
main();