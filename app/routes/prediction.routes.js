const { authJwt } = require("../middleware");
const { optionalAuth } = require("../middleware/optionalAuth");
const { uploadSingle, handleUploadErrors } = require("../middleware/upload");
const controller = require("../controllers/prediction.controller");

module.exports = function(app) {
  app.use(function(req, res, next) {
    res.header(
      "Access-Control-Allow-Headers",
      "x-access-token, Origin, Content-Type, Accept"
    );
    next();
  });

  // Predict plant disease (dapat diakses tanpa login)
  app.post(
    "/api/predict",
    [optionalAuth.optionalAuth, uploadSingle, handleUploadErrors],
    controller.predictPlantDisease
  );

  // Get prediction history (butuh login)
  app.get(
    "/api/predictions/history",
    [authJwt.verifyToken],
    controller.getPredictionHistory
  );

  // Get prediction detail by ID (butuh login)
  app.get(
    "/api/predictions/:id",
    [authJwt.verifyToken],
    controller.getPredictionDetail
  );

  // Get prediction statistics (admin only)
  app.get(
    "/api/predictions/stats",
    [authJwt.verifyToken, authJwt.isAdmin],
    controller.getPredictionStats
  );
};
