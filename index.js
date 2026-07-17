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

    

    console.log("===== SHIPHERO PAYLOAD =====");
    console.log(JSON.stringify(req.body, null, 2));



 
// ✅ FROM (dynamic)
    
const fromName = "Western Dispatch";
const fromAddress = "16630 144 Ave NW";
const fromCity = "Edmonton";
const fromState = "AB";
const fromPostalCode = "T5M 3R8";


// ✅ TO
//const orderId = data.order_number || "ShipHero Order";
//const customer = data.shipping_address?.name || data.ship_to?.name || data.customer_name || "Customer Name";
//const address = data.shipping_address?.address1 || data.ship_to?.address1 || data.address1 || "Address";
//const city = data.shipping_address?.city || data.ship_to?.city || "City";
//const state = data.shipping_address?.state || data.ship_to?.state || "State";
//const postalCode = data.shipping_address?.zip || data.shipping_address?.zipcode || data.shipping_address?.postal_code || data.ship_to?.zip || data.ship_to?.postal_code || "Zip/Postal Code";

const orderId = data.order_number || "ShipHero Order";    
const customer = data.to_address?.name || "Customer Name";
const address = data.to_address?.address_1 || "Address";
const city = data.to_address?.city || "City";
const state = data.to_address?.state || "State";
const postalCode = data.to_address?.zip || "Zip/Postal Code";


    const trackingNumber =
      "FLEET" + Math.floor(100000 + Math.random() * 900000);

    // ✅ BARCODE (NO TEXT INSIDE)
    const barcodeBuffer = await bwipjs.toBuffer({
      bcid: "code128",
      text: trackingNumber,
      scale: 3,
      height: 10,
      includetext: false,
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
    // ✅ WATERMARK (moved up)
    // ===========================
    const logoPath = path.join(__dirname, "logo.png");
    if (fs.existsSync(logoPath)) {
      doc.save();
      doc.opacity(0.09);
      doc.image(logoPath, 10, 60, { width: 180 });
      doc.restore();
    }

    // ===========================
    // ✅ FROM
    // ===========================
    doc.fontSize(7).text("FROM:", 15, 15, { underline: true });
    doc.text(fromName, 15, 26);
    doc.text(fromAddress, 15, 37);
    doc.text(`${fromCity} ${fromState} ${fromPostalCode}`, 15, 48);

    // ===========================
    // ✅ SHIP TO (MOVED RIGHT)
    // ===========================
    let startY = 75;
    const shipToX = 35;

    doc.fontSize(8).text("SHIP TO:", shipToX, startY, { underline: true });
    doc.fontSize(9).text(customer, shipToX, startY + 10);
    doc.fontSize(8).text(address, shipToX, startY + 21);
  
doc.text(
  `${city}${state ? ", " + state : ""}${postalCode ? " " + postalCode : ""}`,
  shipToX,
  startY + 30
);


    // ===========================
    // ✅ ORDER INFO
    // ===========================
    const infoY = startY + 62;

    doc.fontSize(7).text(`Order ID: ${orderId}`, 15, infoY);
    doc.fontSize(7).text(`Tracking: ${trackingNumber}`, 15, infoY + 14);

    // ===========================
    // ✅ BARCODE
    // ===========================
    const barcodeY = 172;
    doc.image(barcodeBuffer, 52, barcodeY, { width: 100 });

    // ✅ TRACKING BELOW BARCODE (SPACED ✅)
    doc
      .font("Helvetica-Bold")
      .fontSize(9)
      .text(trackingNumber, 72, barcodeY + 28);

    // ===========================
    // ✅ BOTTOM LOGO (FIXED)
    // ===========================
    const bottomLogoPath = path.join(__dirname, "logo1.png");
    if (fs.existsSync(bottomLogoPath)) {
      doc.image(bottomLogoPath, 64, 225, { width: 70 });
    }

    // ===========================
    // ✅ FOOTER (ALIGNED)
    // ===========================
    doc
      .fillColor("dark gray")
      .fontSize(5)
      .text("POWERED BY WESTERN DISPATCH", 59, 272, {
        width: 288,
      });

    doc.end();

    stream.on("finish", () => {
      const publicUrl = `https://${process.env.RENDER_EXTERNAL_HOSTNAME}/${fileName}`;


  console.log("FILE NAME:", fileName);
  console.log("PUBLIC URL:", publicUrl);

  console.log("GENERATED FILE:", fileName);
  console.log("FILE PATH:", filePath);

      
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
