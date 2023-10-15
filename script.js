const pokemonContainer = document.getElementById("pokemon-container");

async function fetchData() {
  try {
    const response = await fetch("/out/data.json");
    if (!response.ok) {
      throw new Error("Network response was not ok " + response.statusText);
    }
    const data = await response.json();
    displayData(data);
  } catch (error) {
    console.error("There has been a problem with your fetch operation:", error);
  }
}

function displayData(data) {
  const pokemonContainer = document.getElementById("pokemon-container");

  const table = document.createElement("table");
  const headerRow = document.createElement("tr");
  const headers = ["result", "input", "answer"];

  headers.forEach((headerText) => {
    const th = document.createElement("th");
    th.textContent = headerText;
    headerRow.appendChild(th);
  });

  table.appendChild(headerRow);

  data.forEach((pokemon) => {
    const row = document.createElement("tr");

    const checkColumn = document.createElement("td");
    checkColumn.textContent = pokemon.input === pokemon.sprite_url ? "✅" : "❌";
    row.appendChild(checkColumn);

    // input列
    const inputColumn = document.createElement("td");
    const inputImage = document.createElement("img");
    inputImage.src = pokemon.input;
    inputColumn.appendChild(inputImage);
    row.appendChild(inputColumn);

    // name列
    const nameColumn = document.createElement("td");
    const pokemonName = document.createElement("p");
    pokemonName.textContent = pokemon.name;
    nameColumn.appendChild(pokemonName);
    const pokemonImage = document.createElement("img");
    pokemonImage.src = pokemon.sprite_url;
    nameColumn.appendChild(pokemonImage);
    row.appendChild(nameColumn);

    table.appendChild(row);
  });

  pokemonContainer.appendChild(table);
}

fetchData();
