const express = require("express");
const PDFDocument = require("pdfkit");
const bwipjs = require("bwip-js");
const fs = require("fs");
const path = require("path");

const app = express();
app.use(express.json());
app.use(express.static(__dirname));

app.get("/", (req, res) => {
  res.send("Webhook is working");
});

app.post("/generate-label", async (req, res) => {
  try {
    const data = req.body;

    // ✅ FROM (sender)
    const fromName = "Western Dispatch";
    const fromAddress = "456 Dispatch Lane";
    const fromCity = "Edmonton, AB";

    // ✅ TO
    const orderId = data.order_id || "ORDER123";
    const customer = data.shipping_address?.name || "Customer Name";
    const address = data.shipping_address?.address1 || "Address";
    const city = data.shipping_address?.city || "City";

    const trackingNumber =
      "FLEET" + Math.floor(100000 + Math.random() * 900000);

    // ✅ Barcode
    const barcodeBuffer = await bwipjs.toBuffer({
      bcid: "code128",
      text: trackingNumber,
      scale: 3,
      height: 10,
      includetext: true,
    });

    const fileName = `label-${trackingNumber}.pdf`;
    const filePath = path.join(__dirname, fileName);

    const doc = new PDFDocument({
      size: [288, 432],
      margin: 10,
    });

    const stream = fs.createWriteStream(filePath);
    doc.pipe(stream);

    // ===========================
    // ✅ WATERMARK
    // ===========================
    const logoPath = path.join(__dirname, "logo.png");
    if (fs.existsSync(logoPath)) {
      doc.save();
      doc.opacity(0.07);
      doc.image(logoPath, 20, 120, { width: 250 });
      doc.restore();
    }

    // ===========================
    // ✅ FROM (fixed position)
    // ===========================
    doc.fontSize(9).text("FROM:", 15, 15, { underline: true });

    doc.fontSize(9).text(fromName, 15, 30);
    doc.text(fromAddress, 15, 42);
    doc.text(fromCity, 15, 54);

    // ===========================
    // ✅ SHIP TO
    // ===========================
    let startY = 90;

    doc.fontSize(11).text("SHIP TO:", 15, startY, { underline: true });

    doc.fontSize(13).text(customer, 15, startY + 18);
    doc.fontSize(11).text(address, 15, startY + 36);
    doc.text(city, 15, startY + 50);

    // ===========================
    // ✅ ORDER + TRACKING (smaller + lower)
    // ===========================
    const infoY = startY + 80;

    doc.fontSize(9).text(`Order ID: ${orderId}`, 15, infoY);
    doc.fontSize(9).text(`Tracking: ${trackingNumber}`, 15, infoY + 14);

    // ===========================
    // ✅ BARCODE
    // ===========================
    const barcodeY = infoY + 35;
    doc.image(barcodeBuffer, 30, barcodeY, { width: 230 });

    // ===========================
    // ✅ BOTTOM LOGO (moved up)
    // ===========================
    const bottomLogoPath = path.join(__dirname, "logo1.png");

    if (fs.existsSync(bottomLogoPath)) {
      doc.image(bottomLogoPath, 85, 360, { width: 120 });
    }

    // ===========================
    // ✅ FOOTER (very bottom)
    // ===========================
    doc
      .fillColor("gray")
      .fontSize(7).text(
      "POWERED BY WESTERN DISPATCH",
      0,
      405,
      { align: "center" }
    );

    doc.end();

    stream.on("finish", () => {
      const publicUrl = `https://${process.env.RENDER_EXTERNAL_HOSTNAME}/${fileName}`;

      res.json({
        tracking_number: trackingNumber,
        label: publicUrl,
      });
    });

  } catch (err) {
    console.error(err);
    res.status(500).send("Error generating label");
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log("Server running"));
``
