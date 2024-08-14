require("dotenv").config();

export const envConfigs = {
  server: {
    port: process.env.PORT,
  },
  database: {
    mongo_url: process.env.MONGO_URI,
  },
  authentication: {
    jwt_secret: process.env.JWT_SECRET,
    expiry_time: process.env.EXPIRY_TIME,
  },
} as const;
