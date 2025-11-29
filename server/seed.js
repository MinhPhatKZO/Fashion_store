const mongoose = require("mongoose");
const Product = require("./models/Product"); // ⚠️ chỉnh path đúng

// =============================
//   KẾT NỐI DATABASE
// =============================
mongoose
  .connect("mongodb://127.0.0.1:27017/fasion_store", { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.log(err));

(async () => {
  try {
    const products = await Product.find({});
    console.log(`➡ Found ${products.length} products to fix images`);

    for (let product of products) {
      let updated = false;

      if (Array.isArray(product.images)) {
        // Chỉ xử lý nếu array chứa string
        const newImages = product.images.map((img) => {
          if (typeof img === "string") {
            updated = true;
            return { url: img, alt: "" };
          } else if (!img.alt) {
            updated = true;
            img.alt = "";
          }
          return img;
        });

        product.images = newImages;
      }

      if (updated) {
        await product.save();
        console.log(`✔ Fixed images for product: ${product._id}`);
      }
    }

    console.log("🎉 All products images updated!");
    process.exit();
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
})();
