const express = require("express");
const router = express.Router();
router.use(express.json());
/** models **/
const Offer = require("../models/Offer");
const isAuthenticated = require("../middleware/isAuthenticated");

router.get("/offers", async(req,res)=> {
    try {
        /** default values */
        let skip = 0
        let limitInit = 20
        /** get queries */
        const {page, title, priceMin, priceMax, sort, limit=limitInit} = req.query

        const processedSort = sort ? sort.replace("price-", "") : "desc";
        if (limit !== limitInit) {
            limitInit = limit;
        }
        const filters = {}
        if (title) { filters.product_name = new RegExp(title, 'i') } // /pantalon/i /\bpantalons?\b/i  new RegExp(`\\b${title}s?\\b`, 'i')
// $gte = greater than or equal
// $gt = greater than
// $lte = lower than or equal
// $lt = lower than
        if (priceMin && priceMax) { filters.product_price = {$gte : priceMin, $lte : priceMax} }
        else if (priceMin) { filters.product_price = {$gte : priceMin} }
        else if (priceMax) { filters.product_price = {$lte : priceMax} }

        // pagination : 
// 1- limiter le nobmre d'offres : limit
// 2- sauter des résultats : skip => (page - 1) * limit
        if(page) {
             skip = (page - 1) * limitInit
        }
        console.log(filters);
        const offers = await Offer.find(filters).sort({product_price:processedSort}).select().limit(limitInit).skip(skip).populate("owner", "name")
        console.log(offers);
        
        return res.status(200).json({
            count: offers.length,
            offers: offers
        })
    } catch (error) {
        return res.status(500).json({message:error.message})
    }
})

router.get("/owner_offers/:owner_id", isAuthenticated, async(req,res) => {
    try {
        const owner_id = req.params.owner_id;
        
        const offersFound = await Offer.find({owner:owner_id});

        return res.status(200).json({offers:offersFound})
    } catch (error) {
        return res.status(500).json({message:error.message})
    }
})

module.exports = router