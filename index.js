const express = require("express");
const PDFDocument = require("pdfkit");
const bwipjs = require("bwip-js");
const fs = require("fs");
const path = require("path");

const app = express();
app.use(express.json());
app.use(express.static(__dirname));

// Test route
app.get("/", (req, res) => {
  res.send("Webhook is working");
});

// Generate Label
app.post("/generate-label", async (req, res) => {
  try {
    const data = req.body;

    const orderId = data.order_id || "ORDER123";
    const customer = data.shipping_address?.name || "Customer Name";
    const address = data.shipping_address?.address1 || "Address";
    const city = data.shipping_address?.city || "City";

    const trackingNumber = "FLEET" + Math.floor(100000 + Math.random() * 900000);

    // Create barcode
    const barcodeBuffer = await bwipjs.toBuffer({
      bcid: "code128",
      text: trackingNumber,
      scale: 3,
      height: 10,
      includetext: true,
    });

    const fileName = `label-${trackingNumber}.pdf`;
    const filePath = path.join(__dirname, fileName);

    // Create PDF (4x6 inches)
    const doc = new PDFDocument({
      size: [288, 432], // 4x6 inches (72 DPI)
      margin: 10,
    });

    const stream = fs.createWriteStream(filePath);
    doc.pipe(stream);

    // ✅ LOGO (Replace with your logo URL if needed)
    doc.fontSize(16).text("MY FLEET LOGO", { align: "center" });

    doc.moveDown();

    // ✅ ADDRESS BLOCK
    doc.fontSize(12).text(`Ship To:`, { underline: true });
    doc.text(customer);
    doc.text(address);
    doc.text(city);

    doc.moveDown();

    // ✅ ORDER INFO
    doc.fontSize(10).text(`Order ID: ${orderId}`);
    doc.text(`Tracking: ${trackingNumber}`);

    doc.moveDown();

    // ✅ BARCODE
    doc.image(barcodeBuffer, {
      fit: [250, 80],
      align: "center"
    });

    doc.end();

    // Wait until file is finished writing
    stream.on("finish", () => {
      const publicUrl = `https://${process.env.RENDER_EXTERNAL_HOSTNAME}/${fileName}`;

      res.json({
        tracking_number: trackingNumber,
        label: publicUrl
      });
    });

  } catch (err) {
    console.error(err);
    res.status(500).send("Error generating label");
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log("Server running"));
