const mongoose = require("mongoose");

const Offer = mongoose.model("Offer", {
  product_name: {type:String, min:0, max:50},
  product_description: {type:String, min:0, max:500},
  product_price: {type:Number, max:100000},
  product_details: Array,
  product_images: Array,
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
});

module.exports = Offer;