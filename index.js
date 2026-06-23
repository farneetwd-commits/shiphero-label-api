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

    const trackingNumber =
      "FLEET" + Math.floor(100000 + Math.random() * 900000);

    // ✅ Create Barcode
    const barcodeBuffer = await bwipjs.toBuffer({
      bcid: "code128",
      text: trackingNumber,
      scale: 3,
      height: 12,
      includetext: true,
    });

    const fileName = `label-${trackingNumber}.pdf`;
    const filePath = path.join(__dirname, fileName);

    // ✅ Create 4x6 PDF
    const doc = new PDFDocument({
      size: [288, 432],
      margin: 10,
    });

    const stream = fs.createWriteStream(filePath);
    doc.pipe(stream);

    // ===========================

   
// ===========================
// ✅ BACKGROUND LOGO (FADED)
// ===========================
const logoPath = path.join(__dirname, "logo.png");

if (fs.existsSync(logoPath)) {
  doc.save();

  // Set opacity (very important for fade effect)
  doc.opacity(0.08);

  // Center + stretch logo across label
  doc.image(logoPath, 20, 80, {
    width: 250,   // almost full width
    align: "center",
  });

  doc.restore();
}


    doc.moveDown(4);

    // ===========================
    // ✅ SHIP TO SECTION
    // ===========================
    doc.fontSize(12).text("SHIP TO:", { underline: true });

    doc.moveDown(0.5);
    doc.fontSize(14).text(customer, { bold: true });
    doc.fontSize(12).text(address);
    doc.text(city);

    doc.moveDown(1);

    // ===========================
    // ✅ ORDER DETAILS
    // ===========================
    doc.fontSize(10).text(`Order ID: ${orderId}`);
    doc.text(`Tracking: ${trackingNumber}`);

    doc.moveDown(1.5);

    // ===========================
    // ✅ BARCODE SECTION
    // ===========================
    doc.image(barcodeBuffer, 30, doc.y, {
      width: 230,
    });

    doc.moveDown(5);
    // ===========================
    // ✅ BOTTOM LOGO (logo1.png)
    // ===========================
    const bottomLogoPath = path.join(__dirname, "logo1.png");

    if (fs.existsSync(bottomLogoPath)) {
     doc.image(bottomLogoPath, 90, 380, { width: 120 });
    }
    // ===========================
    // ✅ FOOTER
    // ===========================
    doc.fontSize(10).text("Powered by WESTERN DISPATCH", {
      align: "center",
    });

    doc.end();

    // Wait until file is finished
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
