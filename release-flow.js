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
    let newVersion = oldVersion;

    // 2️⃣ Perguntar ao usuário se deseja aumentar a versão
    const answer = await askQuestion(`Deseja aumentar a versão antes de compilar? (s/n): `);
    if (answer === "s") {
        newVersion = incrementPatch(oldVersion);
        packageJson.version = newVersion;
        fs.writeFileSync("package.json", JSON.stringify(packageJson, null, 2));
        console.log(`\n🔄 Atualizando versão do pacote: ${oldVersion} → ${newVersion}`);
        
        // Criar um commit inicial da nova versão
        execSync(`git add package.json`, { stdio: "inherit" });
        execSync(`git commit -m "chore: Bump version to ${newVersion}"`, { stdio: "inherit" });
        execSync(`git tag v${newVersion}`, { stdio: "inherit" });
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

    // 4️⃣ Criar um novo commit para incluir as release notes na mensagem
    execSync(`git commit --allow-empty -m "chore: Release ${newVersion}\n\n${releaseNotes}"`, { stdio: "inherit" });

    // 5️⃣ Atualizar a tag para apontar para o commit final
    if (answer === "s") {
        execSync(`git tag -d v${newVersion}`, { stdio: "inherit" });
        execSync(`git tag v${newVersion}`, { stdio: "inherit" });
    }

    // 6️⃣ Enviar tudo para o GitHub
    execSync(`git push && git push --tags`, { stdio: "inherit" });

    console.log(`\n✅ Versão ${newVersion} criada e commitada corretamente!`);
    console.log("Pronto para gerar o instalador.");
}

// Executa o script
main();