const express = require("express");
const app = express();

app.use(express.json());

app.get("/", (req, res) => {
  res.send("Webhook is working");
});

app.post("/generate-label", (req, res) => {
  console.log(req.body);

  res.json({
    tracking_number: "FLEET123456",
    label: "https://via.placeholder.com/400x600.png?text=Sample+Label"
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log("Server running"));
