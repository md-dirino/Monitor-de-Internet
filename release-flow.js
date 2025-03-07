const { execSync } = require("child_process");
const fs = require("fs");
const readline = require("readline");

// Pergunta no terminal
function askQuestion(query) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  return new Promise(resolve => {
    rl.question(query, answer => {
      rl.close();
      resolve(answer.trim().toLowerCase());
    });
  });
}

// Incrementa apenas o PATCH na versão "x.y.z"
function incrementPatch(versionString) {
  const parts = versionString.split(".").map(n => parseInt(n));
  parts[2] += 1; // Ex: 1.2.16 -> 1.2.17
  return parts.join(".");
}

async function main() {
  // 1) Ler a versão atual do package.json
  const packageJson = JSON.parse(fs.readFileSync("package.json", "utf8"));
  const oldVersion = packageJson.version;
  const nextVersion = incrementPatch(oldVersion);
  let newVersion = oldVersion;

  // 2) Verificar a tag antiga (para gerar o changelog depois)
  //    Normalmente, assumimos que a tag do repositório corresponde a oldVersion
  const oldTag = `v${oldVersion}`;

  // 3) Perguntar se deseja aumentar a versão
  const answer = await askQuestion(`Deseja aumentar para a versão ${nextVersion} antes de compilar? (s/n): `);

  if (answer === "s") {
    // Aumentar a versão no package.json
    newVersion = nextVersion;
    packageJson.version = newVersion;
    fs.writeFileSync("package.json", JSON.stringify(packageJson, null, 2));
    console.log(`\n🔄 Atualizando versão do pacote: ${oldVersion} → ${newVersion}`);

    // Commit curto para registrar a mudança de versão
    execSync("git add package.json", { stdio: "inherit" });
    execSync(`git commit -m "🚀 Nova versão ${newVersion}"`, { stdio: "inherit" });

    // Criar e enviar a nova tag
    execSync(`git tag v${newVersion}`, { stdio: "inherit" });
    execSync("git push", { stdio: "inherit" });
    execSync(`git push origin v${newVersion}`, { stdio: "inherit" });
  } else {
    console.log("\n🔄 Mantendo a versão atual...");
  }

  // 4) Gerar o release-notes.txt a partir da tag antiga até o HEAD
  //    Se acabamos de criar uma nova versão, HEAD terá o commit dessa versão.
  let commitMessages;
  try {
    commitMessages = execSync(`git log ${oldTag}..HEAD --pretty=format:"- %s"`).toString().trim();
  } catch (error) {
    commitMessages = "Sem mudanças registradas.";
  }

  const releaseNotes = `🚀 Novidades na versão ${newVersion}:\n\n${commitMessages || "Sem mudanças registradas."}`;
  fs.writeFileSync("release-notes.txt", releaseNotes);

  console.log("\n📃 Release Notes geradas:\n");
  console.log(releaseNotes);

  console.log(`\n✅ Versão ${newVersion} finalizada!`);
  console.log("Pronto para gerar o instalador (npm run build).");
}

// Executa o script
main();