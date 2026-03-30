import mongoose from 'mongoose';
import * as dotenv from 'dotenv';
import connectDB from '../src/lib/db';
import User, { hashPassword } from '../src/models/User';

dotenv.config();

async function seedSuperAdmin() {
    try {
        console.log('Connecting to database...');
        await connectDB();
        console.log('Connected to database.');

        const username = process.env.SUPERADMIN_USERNAME;
        const password = process.env.SUPERADMIN_PASSWORD;

        if (!username || !password) {
            console.error('Error: SUPERADMIN_USERNAME and SUPERADMIN_PASSWORD must be defined in your .env file.');
            process.exit(1);
        }

        // Check if superadmin already exists
        let superadmin = await User.findOne({ username: username.toLowerCase() });

        if (superadmin) {
            console.log(`Superadmin '${username}' already exists. Updating password...`);
            superadmin.passwordHash = hashPassword(password);
            superadmin.role = 'superadmin'; // Ensure role is correct
            superadmin.isActive = true;
            await superadmin.save();
            console.log('Superadmin password updated successfully!');
        } else {
            console.log(`Creating new superadmin '${username}'...`);
            superadmin = new User({
                username: username.toLowerCase(),
                passwordHash: hashPassword(password),
                role: 'superadmin',
                isActive: true,
            });
            await superadmin.save();
            console.log('Superadmin created successfully!');
        }

    } catch (error) {
        console.error('Error seeding superadmin:', error);
        process.exit(1);
    } finally {
        await mongoose.disconnect();
        console.log('Disconnected from database.');
        process.exit(0);
    }
}

seedSuperAdmin();
