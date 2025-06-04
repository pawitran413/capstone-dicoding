const tf = require('@tensorflow/tfjs-node');
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');
const db = require("../models");
const Prediction = db.prediction;

// Load model dan labels saat server start
let model = null;
let classNames = [];

const MODEL_PATH = path.join(__dirname, '../../models/tfjs_model/model.json');
const LABELS_PATH = path.join(__dirname, '../../models/labels.txt');

// Initialize model
const initializeModel = async () => {
  try {
    // Load model
    if (fs.existsSync(MODEL_PATH)) {
      model = await tf.loadLayersModel(`file://${MODEL_PATH}`);
      console.log('✅ TensorFlow.js model loaded successfully');
    } else {
      console.log('⚠️ Model file not found, using dummy predictions');
    }

    // Load class labels
    if (fs.existsSync(LABELS_PATH)) {
      const labelsContent = fs.readFileSync(LABELS_PATH, 'utf8');
      classNames = labelsContent.split('\n').filter(line => line.trim() !== '');
      console.log(`✅ Loaded ${classNames.length} class labels`);
    } else {
      // Default labels jika file tidak ada
      classNames = ['Healthy', 'Disease_1', 'Disease_2', 'Disease_3'];
      console.log('⚠️ Labels file not found, using default labels');
    }
  } catch (error) {
    console.error('❌ Error initializing model:', error);
    model = null;
  }
};

// Call initialization
initializeModel();

// Preprocessing image
const preprocessImage = async (imagePath) => {
  try {
    // Resize dan normalize image menggunakan sharp
    const imageBuffer = await sharp(imagePath)
      .resize(224, 224)
      .removeAlpha()
      .toFormat('rgb')
      .raw()
      .toBuffer();

    // Convert to tensor
    const imageTensor = tf.tensor3d(
      new Uint8Array(imageBuffer),
      [224, 224, 3],
      'int32'
    );

    // Normalize to [0, 1] dan add batch dimension
    const normalizedImage = imageTensor.cast('float32').div(255.0).expandDims(0);
    
    // Cleanup
    imageTensor.dispose();
    
    return normalizedImage;
  } catch (error) {
    throw new Error(`Image preprocessing error: ${error.message}`);
  }
};

// Dummy prediction function
const getDummyPrediction = () => {
  const predictions = classNames.map((className, index) => ({
    class: className,
    confidence: Math.random()
  }));
  
  // Sort by confidence
  predictions.sort((a, b) => b.confidence - a.confidence);
  
  return {
    predictedClass: predictions[0].class,
    confidence: predictions[0].confidence,
    allPredictions: predictions
  };
};

// Main prediction function
exports.predictPlantDisease = async (req, res) => {
  const startTime = Date.now();
  
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No image file provided'
      });
    }

    let predictionResult;

    if (model) {
      // Real prediction using TensorFlow.js model
      const imageTensor = await preprocessImage(req.file.path);
      
      // Run prediction
      const predictions = await model.predict(imageTensor).data();
      
      // Get prediction results
      const predictionArray = Array.from(predictions);
      const predictedIndex = predictionArray.indexOf(Math.max(...predictionArray));
      const confidence = predictionArray[predictedIndex];
      
      // Prepare all predictions
      const allPredictions = classNames.map((className, index) => ({
        class: className,
        confidence: predictionArray[index] || 0
      })).sort((a, b) => b.confidence - a.confidence);

      predictionResult = {
        predictedClass: classNames[predictedIndex] || 'Unknown',
        confidence: confidence,
        allPredictions: allPredictions
      };

      // Cleanup tensor
      imageTensor.dispose();
    } else {
      // Fallback to dummy prediction
      predictionResult = getDummyPrediction();
    }

    const processingTime = Date.now() - startTime;

    // Save prediction to database
    const predictionData = {
      imageName: req.file.originalname,
      imageUrl: `/uploads/${req.file.filename}`,
      predictedClass: predictionResult.predictedClass,
      confidence: predictionResult.confidence,
      allPredictions: predictionResult.allPredictions,
      predictionType: req.userId ? 'authenticated' : 'anonymous',
      deviceInfo: {
        userAgent: req.get('User-Agent'),
        ip: req.ip
      },
      processingTime: processingTime
    };

    // Add userId if user is authenticated
    if (req.userId) {
      predictionData.userId = req.userId;
    }

    const savedPrediction = await new Prediction(predictionData).save();

    // Response
    res.status(200).json({
      success: true,
      message: 'Prediction completed successfully',
      data: {
        id: savedPrediction._id,
        predictedClass: predictionResult.predictedClass,
        confidence: Math.round(predictionResult.confidence * 10000) / 100, // Convert to percentage
        allPredictions: predictionResult.allPredictions.map(p => ({
          class: p.class,
          confidence: Math.round(p.confidence * 10000) / 100
        })),
        imageName: req.file.originalname,
        imageUrl: predictionData.imageUrl,
        processingTime: `${processingTime}ms`,
        timestamp: savedPrediction.createdAt
      }
    });

  } catch (error) {
    console.error('Prediction error:', error);
    
    // Clean up uploaded file if error occurs
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }

    res.status(500).json({
      success: false,
      message: 'Prediction failed',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

// Get prediction history
exports.getPredictionHistory = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    let query = {};
    
    // If user is authenticated, show their predictions
    if (req.userId) {
      query.userId = req.userId;
    } else {
      // For anonymous users, don't show any history
      return res.status(401).json({
        success: false,
        message: 'Authentication required to view prediction history'
      });
    }

    // Add filters
    if (req.query.predictedClass) {
      query.predictedClass = { $regex: req.query.predictedClass, $options: 'i' };
    }

    if (req.query.startDate && req.query.endDate) {
      query.createdAt = {
        $gte: new Date(req.query.startDate),
        $lte: new Date(req.query.endDate)
      };
    }

    const total = await Prediction.countDocuments(query);
    const predictions = await Prediction.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('userId', 'username email')
      .select('-deviceInfo -allPredictions'); // Exclude sensitive data

    res.status(200).json({
      success: true,
      message: 'Prediction history retrieved successfully',
      data: {
        predictions: predictions,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(total / limit),
          totalItems: total,
          itemsPerPage: limit
        }
      }
    });

  } catch (error) {
    console.error('Get history error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve prediction history',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

// Get prediction detail by ID
exports.getPredictionDetail = async (req, res) => {
  try {
    const { id } = req.params;

    let query = { _id: id };
    
    // If user is authenticated, only show their prediction
    if (req.userId) {
      query.userId = req.userId;
    } else {
      return res.status(401).json({
        success: false,
        message: 'Authentication required to view prediction details'
      });
    }

    const prediction = await Prediction.findOne(query)
      .populate('userId', 'username email');

    if (!prediction) {
      return res.status(404).json({
        success: false,
        message: 'Prediction not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Prediction detail retrieved successfully',
      data: prediction
    });

  } catch (error) {
    console.error('Get prediction detail error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve prediction details',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

// Get prediction statistics (admin only)
exports.getPredictionStats = async (req, res) => {
  try {
    const totalPredictions = await Prediction.countDocuments();
    const authenticatedPredictions = await Prediction.countDocuments({ predictionType: 'authenticated' });
    const anonymousPredictions = await Prediction.countDocuments({ predictionType: 'anonymous' });

    // Get predictions by class
    const predictionsByClass = await Prediction.aggregate([
      {
        $group: {
          _id: '$predictedClass',
          count: { $sum: 1 },
          avgConfidence: { $avg: '$confidence' }
        }
      },
      { $sort: { count: -1 } }
    ]);

    // Get predictions by date (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const predictionsByDate = await Prediction.aggregate([
      {
        $match: {
          createdAt: { $gte: sevenDaysAgo }
        }
      },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$createdAt' }
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    res.status(200).json({
      success: true,
      message: 'Prediction statistics retrieved successfully',
      data: {
        overview: {
          totalPredictions,
          authenticatedPredictions,
          anonymousPredictions
        },
        predictionsByClass,
        predictionsByDate
      }
    });

  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve prediction statistics',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};
