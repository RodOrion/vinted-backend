const express = require("express");
const router = express.Router();
router.use(express.json());
const fileUpload = require("express-fileupload");
const isAuthenticated = require("../middleware/isAuthenticated");

// import de cloudinary
const cloudinary = require("cloudinary").v2;
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

/** models **/
const Offer = require("../models/Offer");

/** utils/fonctions */
const convertToBase64 = require("../utils/convertToBase64");

router.post("/offer/publish", isAuthenticated, fileUpload(), /// ne pas oublier dès qu'on a form-data pour body
  async (req, res) => {
    try {
      //console.log(req.body);
      const { title, description, price, condition, city, brand, size, color } = req.body;
      ******************console.log(req.files);
      // Gestion des images multiples
      let uploadResponses = [];

      if (req.files && req.files.pictures) {
        // Si plusieurs images sont envoyées, req.files.pictures sera un array
        // Si une seule image, on la transforme en array pour uniformiser
        const pictures = Array.isArray(req.files.pictures)
          ? req.files.pictures
          : [req.files.pictures];

        //console.log(`${pictures.length} image(s) à traiter`);

        // Conversion en base64 et upload vers Cloudinary avec Promise.all
        const uploadPromises = pictures.map(async (picture) => {
          const convertedPicture = convertToBase64(picture);
          return cloudinary.uploader.upload(convertedPicture, {
            folder: `vinted/offers/${req.user._id}`,
          });
        });

        // Attendre que tous les uploads se terminent
        uploadResponses = await Promise.all(uploadPromises);
        //console.log(`${uploadResponses.length} image(s) uploadée(s)`);
      }

      //console.log(req.user);
      const foundUser = req.user;
      // si user publish offer
      if (foundUser) {
        const id = foundUser._id;
        const newOffer = new Offer({
          product_name: title,
          product_description: description,
          product_price: price,
          product_details: [
            { ÉTAT: condition },
            { EMPLACEMENT: city },
            { MARQUE: brand },
            { TAILLE: size },
            { COULEUR: color },
          ],
          product_images: uploadResponses,
          owner: id, // foundUser enregistrerait ttes les infos de l'user avec le produit
        });
        await newOffer.save();
        // reponse
        return res.status(201).json({
          _id: newOffer._id,
          product_name: title,
          product_description: description,
          product_price: price,
          product_details: [
            {
              MARQUE: brand,
            },
            {
              TAILLE: size,
            },
            {
              ÉTAT: condition,
            },
            {
              COULEUR: color,
            },
            {
              EMPLACEMENT: city,
            },
          ],
          owner: {
            account: {
              username: foundUser.account.username,
            },
            _id: foundUser._id,
          },
          product_image: uploadResponses,
        });
      } else {
        return res.status(400).json({ message: "Not authorized !" });
      }
    } catch (error) {
      return res.status(500).json({ message: error.message });
    }
  }
);

router.put(
  "/offer/update/:id",
  isAuthenticated,
  fileUpload(),
  async (req, res) => {
    try {
      const foundUser = req.user;
      // si user
      if (foundUser) {
        const {
          title,
          description,
          price,
          condition,
          city,
          brand,
          size,
          color,
        } = req.body;
        const foundProduct = await Offer.findOne({
          _id: req.params.id,
          owner: foundUser._id,
        });
        //console.log(foundProduct);

        // si user & foundProduct : update offer
        if (foundProduct) {
          foundProduct.product_name = title;
          foundProduct.product_description = description;
          foundProduct.product_price = price;
          foundProduct.product_details = [condition, city, brand, size, color];

          if (req.files && req.files.pictures) {
            // Si plusieurs images sont envoyées, req.files.pictures sera un array
            // Si une seule image, on la transforme en array pour uniformiser
            const pictures = Array.isArray(req.files.pictures)
              ? req.files.pictures
              : [req.files.pictures];
            //console.log("req.files.pictures:", req.files.pictures);

            // Conversion en base64 et upload vers Cloudinary avec Promise.all
            const uploadPromises = pictures.map(async (picture) => {
              const convertedPicture = convertToBase64(picture);
              return cloudinary.uploader.upload(convertedPicture, {
                folder: `vinted/offers/${req.user._id}`,
              });
            });

            // Attendre que tous les uploads se terminent
            const uploadResponses = await Promise.all(uploadPromises);
            foundProduct.product_images = uploadResponses;
          }
          await foundProduct.save();
          return res.status(200).json("produit mis à jour");
        }
      } else {
        return res.status(400).json("Vous devez être authentifié");
      }
    } catch (error) {
      return res.status(500).json({ message: error.message });
    }
  }
);

router.delete(
  "/offer/delete/:id",
  isAuthenticated,
  fileUpload(),
  async (req, res) => {
    try {
      const foundUser = req.user;
      // si user
      if (foundUser) {
        const foundProduct = await Offer.findOne({
          _id: req.params.id,
          owner: foundUser._id,
        });
        //console.log(foundProduct);

        // si user & foundProduct : update offer
        if (foundProduct) {
          await foundProduct.deleteOne();
          return res.status(200).json("produit supprimé !");
        } else {
          return res.status(404).json("produit non trouvé !");
        }
      } else {
        return res.status(400).json("Vous devez être authentifié");
      }
    } catch (error) {
      return res.status(500).json({ message: error.message });
    }
  }
);

router.get("/offers/:id", async (req, res) => {
  try {
    const offerFound = await Offer.findById(req.params.id).populate("owner", [
      "newsletter",
      "account.username",
    ]);
    return res.status(200).json(offerFound);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

module.exports = router;
