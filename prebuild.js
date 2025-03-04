const readline = require("readline");
const { execSync } = require("child_process");

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Pergunta ao usuário se deseja incrementar a versão antes da build
rl.question("Deseja aumentar a versão antes de compilar? (s/n): ", (answer) => {
  rl.close(); // Fecha o input do usuário corretamente antes de continuar

  if (answer.toLowerCase() === "s") {
    try {
      console.log("\nAtualizando versão do pacote...");
      execSync("npm version patch --no-git-tag-version", { stdio: "inherit" });
      console.log("Versão incrementada com sucesso!\n");
    } catch (error) {
      console.error("Erro ao incrementar a versão:", error);
      process.exit(1); // Sai com erro para evitar continuar se falhar
    }
  } else {
    console.log("\nMantendo a versão atual...\n");
  }

  process.exit(0); // Sai com sucesso para evitar loops no npm run build
});