import readline from "readline";
import AIManager from "./AIManager.js";
import { CHARACTERS } from "./lib/characters.js";

// === CONFIGURATION ===
const GITHUB_TOKEN = process.env.GITHUB_TOKEN || ""; // <-- set your GitHub token here or via env
const ENDPOINT = process.env.AZURE_AI_ENDPOINT || "https://models.inference.ai.azure.com";
const DEFAULT_MODEL = "gpt-4o";
const CHARACTER = process.env.CHARACTER || Object.keys(CHARACTERS)[0];

// === SETUP AI MANAGER ===
const aiManager = new AIManager(GITHUB_TOKEN, ENDPOINT, DEFAULT_MODEL);

// === SETUP READLINE INTERFACE ===
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
  prompt: "You: ",
});

async function chatLoop() {
  console.log("=== AI Console Chatbot ===");
  console.log(`Model: ${aiManager.getCurrentModel()} | Character: ${CHARACTER}`);
  console.log("Type your message or 'exit' to quit.\n");
  rl.prompt();
  rl.on("line", async (line) => {
    const input = line.trim();
    if (!input) { rl.prompt(); return; }
    if (input.toLowerCase() === "exit" || input.toLowerCase() === "quit") {
      rl.close(); return;
    }
    try {
      const response = await aiManager.queryAI(input, "User", CHARACTER);
      console.log(`AI (${CHARACTER}): ${response}\n`);
    } catch (err) {
      console.error("Error:", err.message);
    }
    rl.prompt();
  }).on("close", () => {
    console.log("Goodbye!");
    process.exit(0);
  });
}

chatLoop();