const { execSync } = require("child_process");
const fs = require("fs");
const readline = require("readline");

// Pasta onde serão salvos os arquivos com o resumo de cada versão
const NOTES_DIR = "release-notes";

// Função para perguntar ao usuário
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

// Função para incrementar apenas o patch na versão x.y.z
function incrementPatch(versionString) {
  const parts = versionString.split(".").map(n => parseInt(n));
  parts[2] += 1; // Ex: 1.2.16 -> 1.2.17
  return parts.join(".");
}

async function main() {
  // 1) Ler a versão atual do package.json
  const packageJson = JSON.parse(fs.readFileSync("package.json", "utf8"));
  const oldVersion = packageJson.version;        // Ex: "1.2.16"
  const nextVersion = incrementPatch(oldVersion);
  let newVersion = oldVersion;

  // 2) Verificar a tag antiga para gerar log depois
  const oldTag = `v${oldVersion}`;

  // 3) Perguntar se deseja aumentar a versão
  const answer = await askQuestion(`Deseja aumentar para a versão ${nextVersion} antes de compilar? (s/n): `);

  if (answer === "s") {
    // Incrementa a versão
    newVersion = nextVersion;
    packageJson.version = newVersion;
    fs.writeFileSync("package.json", JSON.stringify(packageJson, null, 2));
    console.log(`\n🔄 Atualizando versão do pacote: ${oldVersion} → ${newVersion}`);

    // Commit curto para indicar nova versão
    execSync("git add package.json", { stdio: "inherit" });
    execSync(`git commit -m "Nova versão ${newVersion} gerada"`, { stdio: "inherit" });

    // Criar e enviar a tag
    execSync(`git tag v${newVersion}`, { stdio: "inherit" });
    execSync("git push", { stdio: "inherit" });
    execSync(`git push origin v${newVersion}`, { stdio: "inherit" });
  } else {
    console.log("\n🔄 Mantendo a versão atual...");
  }

  // 4) Gera o resumo de commits (changelog) desde a tag antiga até o HEAD
  let commitMessages;
  try {
    commitMessages = execSync(`git log ${oldTag}..HEAD --pretty=format:"- %s"`).toString().trim();
  } catch (error) {
    commitMessages = "Sem mudanças registradas.";
  }

  // Monta o texto de release
  const releaseNotes = `🚀 Novidades na versão ${newVersion}:\n\n${commitMessages || "Sem mudanças registradas."}`;

  // 5) Cria a pasta de release notes, se não existir
  if (!fs.existsSync(NOTES_DIR)) {
    fs.mkdirSync(NOTES_DIR);
    console.log(`\n🗂️ Pasta "${NOTES_DIR}" criada para armazenar as notas de cada versão.`);
  }

  // Define o nome do arquivo de notas, ex: "v1.2.17-release-notes.txt"
  const fileName = `v${newVersion}-release-notes.txt`;
  const filePath = `${NOTES_DIR}/${fileName}`;

  // Salva o arquivo de notas na pasta
  fs.writeFileSync(filePath, releaseNotes);
  console.log(`\n📃 Release Notes salvas em: ${filePath}`);
  console.log(releaseNotes);

  console.log(`\n✅ Versão ${newVersion} finalizada!`);
  console.log("Pronto para gerar o instalador (npm run build).");
}

// Executa o script
main();