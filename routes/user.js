const express = require("express");
const router = express.Router();
router.use(express.json());
const fileUpload = require("express-fileupload");
const uid = require("uid2"); // chaine de caractères aléatoire
const SHA256 = require("crypto-js/sha256"); // servira pour l'encryptage
const encodeB64 = require("crypto-js/enc-base64"); // servira pour l'encodage en base 64 (imprimable)

/** models **/
const User = require("../models/User");

// import de cloudinary
const cloudinary = require("cloudinary").v2;
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

/** lib */
const convertToBase64 = require("../utils/convertToBase64");

/*** API ***/
router.post("/user/signup", fileUpload(), async (req, res) => {
  try {
    const { username, email, password, newsletter } = req.body;
    if (!username || !password || !email) {
      return res.status(400).json({
        message: "Veuillez renseigner un username, un email et un password",
      });
    }
    //Test si email renseigné existe déjà dans la base de données
    const verifMail = await User.findOne({ email });
    if (verifMail) {
      return res.status(400).json({
        message: "Email déjà utilisé",
      });
    }

    /** encodage password */
    const salt = uid(16);
    const saltedPass = password + salt;
    const saltedPassCrypted = SHA256(saltedPass);
    const hash = encodeB64.stringify(saltedPassCrypted);
    // const hash = SHA256(saltedPass).toString(encodeB64)
    const token = uid(16);

    
    /** Création user */
    const newUser = new User({
      email: email,
      account: {
        username: username,
      },
      newsletter: newsletter,
      token: token,
      hash: hash,
      salt: salt,
    });

    /** récupération + encodage avatar */
    // conversion de l'img en b64 + envoi de l'img vers Cloudinary + recup de l'objet reçu
    if (req.files && req.files.avatar) {
      const convertedPicture = convertToBase64(req.files.avatar);
      const uploadResponse = await cloudinary.uploader.upload(convertedPicture, {
        folder: `avatars/${username}`,
      });
      newUser.account.avatar = uploadResponse
    }

    await newUser.save();

    return res.status(201).json({
      _id: newUser._id,
      token: newUser.token,
      account: { username: newUser.account.username },
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

router.post("/user/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    console.log(email, password);

    const verifUser = await User.findOne({ email });
    if (!verifUser) {
      return res.status(401).json({
        message: "Votre email ou password est incorrect !",
      });
    }
    const userSalt = verifUser.salt;
    const userHash = verifUser.hash;
    const token = verifUser.token;
    const newHash = SHA256(password + userSalt).toString(encodeB64);

    if (userHash !== newHash) {
      return res.status(401).json({
        message: "Votre email ou password est incorrect !",
      });
    }

    return res.status(200).json({
      message: "Vous êtes connecté !",
      _id: verifUser._id,
      token,
      account: { username: verifUser.account.username },
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

module.exports = router;
