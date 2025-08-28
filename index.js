require('dotenv').config()
const port = 3000
const express = require("express")
const cors = require("cors")
const app = express()

app.use(cors())
app.use(express.json())

const mongoose = require("mongoose")
mongoose.connect(process.env.MONGODB_URI)

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

// app.get("/offers", async(req,res)=> {
//     try {
//         const filters = {} // indice avec condition pour ajouter les filtres ds le find
//         let limit = 25
//         let skip = 0
//         let page = 1
//         if(req.query.limit) {
//             limit = req.query.limit
//         }
//         if(req.query.page) {
//              skip = (page - 1) * limit
//         }
//         const offers = await Offer.find({product_name:/pantalon/i}).select("product_name product_price -_id")
// // $gte = greater than or equal
// // $gt = greater than
// // $lte = lower than or equal
// // $lt = lower than
//         const offersPrice = await Offer.find({product_price: {$gte: 100}}).select("product_name product_price -_id")
// // "asc" ou 1
// // "desc" ou -1
//         const offersPriceSort = await Offer.find({product_price: {$gte: 100}}).sort({product_price:"asc"}).select("product_name product_price -_id")
// // pagination : 
// // 1- limiter le nobmre d'offres : limit
// // 2- sauter des résultats : skip => (page - 1) * limit
//         const offersPricePage = await Offer.find({product_price: {$gte: 100}}).select("product_name product_price -_id").limit(5).skip(5)

//         return res.status(200).json(offers)
//     } catch (error) {
//         return res.status(500).json({message:error.message})
//     }
// })

app.all(/.*/, (req,res)=> {
    res.status(404).json({message: "not found page"})
})

const PORT = process.env.PORT || 3000

app.listen(PORT,()=> {
    console.log("Server started 😁 at port " + PORT);
})