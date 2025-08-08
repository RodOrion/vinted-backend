const User = require("../models/User");
const isAuthenticated = async (req, res, next) => {
  try {
    if(req.headers.authorization) {
      // recup du token
      const receivedToken = req.headers.authorization.replace("Bearer ", "");
      // verif user
      const foundUser = await User.findOne({ token: receivedToken });
      if(foundUser === null) {
        return res.status(401).json("Not found");
      } else {
        req.user = foundUser
        next();
      }
    } else {
      return res.status(401).json("Unauthorized");
    }
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

module.exports = isAuthenticated;
