require('dotenv').config()
const port = 3000
const express = require("express")
const cors = require("cors")
const app = express()

app.use(cors())
app.use(express.json())

const mongoose = require("mongoose")
mongoose.connect(process.env.MONGODB_URI)

const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

/*** ROUTES */
const userRoutes = require("./routes/user")
app.use(userRoutes)

const offerRoutes = require("./routes/offer")
app.use(offerRoutes)

const offersRoutes = require("./routes/offers")
app.use(offersRoutes)

// import de cloudinary
const cloudinary = require("cloudinary").v2;
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

/** API */
app.get("/", (req,res)=> {
    try {
        return res.status(200).json("Welcome on Vinted")
    } catch (error) {
        return res.status(500).json({message:error.message})
    }
})

app.post("/payment", async (req, res) => {
  try {
    const { currency, description, amount } = req.body;
    // On crée une intention de paiement
    const paymentIntent = await stripe.paymentIntents.create({
      // Montant de la transaction
      amount: amount,
      // Devise de la transaction
      currency: currency,
      // Description du produit
      description: description,
    });
    // On renvoie les informations de l'intention de paiement au client
    res.json(paymentIntent);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.all(/.*/, (req,res)=> {
    res.status(404).json({message: "not found page"})
})

const PORT = process.env.PORT || 3000

app.listen(PORT,()=> {
    console.log("Server started 😁 at port " + PORT);
})