import mongoose from 'mongoose';
import { envConfigs } from './environment.config';

const connectDB = async () => {
    try {
        await mongoose.connect(envConfigs.database.mongo_url || 'mongodb://localhost:27017/software-co');
        console.log('MongoDB connected');
    } catch (err) {
        console.error('MongoDB connection error:', err.message);
        process.exit(1);
    }
};

export { connectDB };