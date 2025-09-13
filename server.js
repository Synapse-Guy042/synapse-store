import express from "express";
import fs from "fs";
import path from "path";

const app = express();
const PORT = 3000;

app.use(express.json());

// ✅ Serve everything from public folder
const publicDir = path.join(process.cwd(), "public");
app.use(express.static(publicDir));

// ✅ Serve index.html on root
app.get("/", (req, res) => {
  res.sendFile(path.join(publicDir, "index.html"));
});

// 🔑 Directory where your key .txt files are stored
const keysDir = path.join(process.cwd(), "keys");

// Keyword groups per product
const keywordGroups = {
  veil: ["veil"],        // Gorilla Tag product 1
  violet: ["violet"],    // Gorilla Tag product 2
  untitled: ["untitled"],// Gorilla Tag product 3
  syntroid: ["syntroid"],// Animal
  synapse: ["synapse"],  // Software
  steam: ["steam"],      // Software
};

// Helper: find the first available key from matching files
function getKeyForProduct(productId) {
  const keywords = keywordGroups[productId] || [productId];

  for (const keyword of keywords) {
    const files = fs.readdirSync(keysDir).filter(f => f.startsWith(keyword));
    for (const file of files) {
      const filePath = path.join(keysDir, file);
      if (!fs.existsSync(filePath)) continue;

      const keys = fs.readFileSync(filePath, "utf-8").split("\n").filter(Boolean);
      if (keys.length > 0) {
        const key = keys.shift(); // take first key
        fs.writeFileSync(filePath, keys.join("\n")); // save remaining
        return key;
      }
    }
  }
  return null;
}

// Helper: count keys for product
function countKeysForProduct(productId) {
  const keywords = keywordGroups[productId] || [productId];
  let total = 0;

  for (const keyword of keywords) {
    const files = fs.readdirSync(keysDir).filter(f => f.startsWith(keyword));
    for (const file of files) {
      const filePath = path.join(keysDir, file);
      if (!fs.existsSync(filePath)) continue;
      const keys = fs.readFileSync(filePath, "utf-8").split("\n").filter(Boolean);
      total += keys.length;
    }
  }
  return total;
}

// 📦 Route: buy a key
app.post("/get-key", (req, res) => {
  const { productId } = req.body;
  if (!productId) return res.json({ status: "ERROR", message: "No productId" });

  const key = getKeyForProduct(productId);
  if (key) {
    res.json({ status: "SUCCESS", key });
  } else {
    res.json({ status: "OUT_OF_STOCK" });
  }
});

// 📦 Route: stock status
app.get("/stock-status", (req, res) => {
  const stock = {};
  for (const productId of Object.keys(keywordGroups)) {
    stock[productId] = countKeysForProduct(productId);
  }
  res.json(stock);
});

app.listen(PORT, () => console.log(`✅ Server running on http://localhost:${PORT}`));
