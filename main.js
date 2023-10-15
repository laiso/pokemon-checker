import fs from "fs";
import path from "path";

import { chromium } from "playwright";

function getRandomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1) + min);
}

function getRandomPokemonSprites(length) {
  const sprites = [];
  for (let i = 0; i < length; i++) {
    const randomId = getRandomInt(1, 500);
    const spriteUrl = `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${randomId}.png`;
    sprites.push(spriteUrl);
  }
  return sprites;
}

async function downloadSprites(sprites) {
  if (!fs.existsSync("./out/pokemon")) {
    fs.mkdirSync("./out/pokemon");
  }

  const spritePaths = [];

  for (let i = 0; i < sprites.length; i++) {
    const spriteUrl = sprites[i];
    const response = await fetch(spriteUrl);
    if (!response.ok) {
      console.error(`Failed to fetch ${spriteUrl}: ${response.statusText}`);
      continue;
    }

    const buffer = Buffer.from(await response.arrayBuffer());
    const spriteFilename = path.basename(spriteUrl);
    const spritePath = path.join("./out/pokemon", spriteFilename);
    fs.writeFileSync(spritePath, buffer);
    spritePaths.push(spritePath);
  }

  return spritePaths;
}

const browser = await chromium.connectOverCDP("http://localhost:9222");

const defaultContext = browser.contexts()[0];
const page = await defaultContext.newPage();
await page.goto("https://chat.openai.com/?model=gpt-4");

const RESULT_REQUIRED_LENGTH = 2;
const BATCH_SIZE = 1;

const result = [];
while (result.length < RESULT_REQUIRED_LENGTH) {
  const fileInput = await page.locator('input[type="file"]');
  const spriteUrls = getRandomPokemonSprites(BATCH_SIZE);
  const images = await downloadSprites(spriteUrls);
  await fileInput.setInputFiles(images);

  await page.waitForSelector('button[data-testid="send-button"]', {
    state: "attached",
  });

  await page.getByPlaceholder("Send a message")
    .fill(`Who's that Pokemon in Japanese?
  The output should be a markdown code snippet formatted in the following schema:
    \`\`\`json
    {
        "results": [
            {
                "id": number,
                "name": string,
                "sprite_url": string // https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/{id}.png
            }
        ]
    }
    \`\`\`
  `);

  await page.getByTestId("send-button").click({ timeout: 30000 * 10 });
  await page.waitForRequest((request) => {
    return request.url() === 'https://chat.openai.com/backend-api/conversation'
  });
  
  await page.waitForFunction(
    () => {
      const result =
        window.document.querySelector('button[as="button"]').textContent === "Regenerate" &&
        window.document.querySelector('button[data-testid="send-button"]') !== null;
      if (result) debugger;
      return result;
    },
    [],
    { timeout: 30000 * 10 }
  );

  const jsonInCode = await page.$$eval("code", (elements) => {
    const lastCodeElement = elements[elements.length - 1];
    return lastCodeElement.textContent;
  });

  const pokemons = JSON.parse(jsonInCode).results;
  for (let [index, pokemon] of pokemons.entries()) {
    const input = spriteUrls[index];
    pokemon.input = input;
    result.push(pokemon);
  }
}

  fs.writeFileSync("./data.json", JSON.stringify(result, null, 2));

console.log("Done!");
process.exit(0);