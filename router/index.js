const path = require("path");
const multer = require("multer");
const { Router } = require("express");
const {
  allImageController,
  createImageController,
} = require("../controller");

const router = Router();

const storage = multer.diskStorage({
    destination: path.join(__dirname, "../public/images"),
    filename: function (req, file, cb) {
      cb(null, file.originalname);
    },
  });
  

  const upload = multer({
    storage: storage,
  });
  
  router.route("/documents").get(allImageController);
  router.route("/documents").post(upload.single("imageFile"), createImageController);

module.exports = { router };