import mongoose from 'mongoose';
import env from '../config/env.js';
import User from '../models/user.model.js';

const email = process.argv[2];

if (!email) {
  console.error('\n❌ Please provide an email address.');
  console.log('Usage: node src/scripts/makeAdmin.js <user-email>\n');
  process.exit(1);
}

const promoteUserToAdmin = async () => {
  let connected = false;
  const urisToTry = [
    env.MONGO_URI,
    'mongodb://mongo:27017/clouddocs',
    'mongodb://127.0.0.1:27017/clouddocs',
  ].filter(Boolean);

  for (const uri of urisToTry) {
    try {
      console.log(`Attempting connection to MongoDB (${uri})...`);
      await mongoose.connect(uri, { serverSelectionTimeoutMS: 5000 });
      console.log(`Connected successfully to database.`);
      connected = true;
      break;
    } catch (err) {
      console.warn(`Connection to ${uri} failed: ${err.message}`);
    }
  }

  if (!connected) {
    console.error('\n❌ Could not connect to any MongoDB instance.');
    process.exit(1);
  }

  try {

    const user = await User.findOne({ email: email.toLowerCase().trim() });

    if (!user) {
      console.error(`\n❌ User with email "${email}" not found in database.\n`);
      process.exit(1);
    }

    user.role = 'admin';
    await user.save();

    console.log(`\n🎉 SUCCESS! User "${user.name}" (${user.email}) has been promoted to ADMIN.`);
    console.log(`You can now log in and access the Admin Dashboard at: http://localhost:5173/admin\n`);

    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Error promoting user:', error.message);
    process.exit(1);
  }
};

promoteUserToAdmin();
