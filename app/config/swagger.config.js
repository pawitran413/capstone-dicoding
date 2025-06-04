module.exports = {
  swagger: "2.0",
  info: {
    version: "1.0.0",
    title: "Plant Disease Prediction API",
    description: "Authentication & Plant Disease Prediction API Documentation",
  },
  host: "localhost:8000",
  basePath: "/",
  tags: [
    { name: "Auth", description: "Authentication routes" },
    { name: "User", description: "User-related routes" },
    { name: "Prediction", description: "Plant disease prediction routes" }
  ],
  paths: {
    "/api/auth/signup": {
      post: {
        tags: ["Auth"],
        summary: "Register a new user",
        parameters: [
          {
            in: "body",
            name: "body",
            required: true,
            schema: {
              type: "object",
              properties: {
                username: { type: "string" },
                email: { type: "string" },
                password: { type: "string" },
              },
              required: ["username", "email", "password"],
            },
          },
        ],
        responses: { 200: { description: "User registered successfully" } },
      },
    },
    "/api/auth/signin": {
      post: {
        tags: ["Auth"],
        summary: "Sign in a user",
        parameters: [
          {
            in: "body",
            name: "body",
            required: true,
            schema: {
              type: "object",
              properties: {
                username: { type: "string" },
                password: { type: "string" },
              },
              required: ["username", "password"],
            },
          },
        ],
        responses: { 200: { description: "User signed in successfully" } },
      },
    },
    "/api/predict": {
      post: {
        tags: ["Prediction"],
        summary: "Predict plant disease from image",
        consumes: ["multipart/form-data"],
        parameters: [
          {
            in: "formData",
            name: "image",
            type: "file",
            required: true,
            description: "Plant leaf image file (JPEG, PNG, WebP, max 5MB)"
          },
          {
            in: "header",
            name: "x-access-token",
            type: "string",
            required: false,
            description: "Optional JWT token for authenticated prediction"
          }
        ],
        responses: { 
          200: { description: "Prediction completed successfully" },
          400: { description: "Invalid image file" },
          500: { description: "Prediction failed" }
        },
      },
    },
    "/api/predictions/history": {
      get: {
        tags: ["Prediction"],
        summary: "Get user's prediction history",
        parameters: [
          {
            in: "header",
            name: "x-access-token",
            type: "string",
            required: true,
            description: "JWT token"
          },
          {
            in: "query",
            name: "page",
            type: "integer",
            description: "Page number (default: 1)"
          },
          {
            in: "query",
            name: "limit",
            type: "integer",
            description: "Items per page (default: 10)"
          }
        ],
        responses: { 
          200: { description: "Prediction history retrieved successfully" },
          401: { description: "Authentication required" }
        },
      },
    }
  },
};
