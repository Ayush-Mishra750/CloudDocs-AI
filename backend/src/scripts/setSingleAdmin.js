import mongoose from 'mongoose';
import env from '../config/env.js';
import User from '../models/user.model.js';

const PRIMARY_ADMIN_EMAIL = 'ayushmishra270306@gmail.com';

const resetRoles = async () => {
  try {
    const mongoUri = env.MONGO_URI || 'mongodb+srv://ayushmishra270306_db_user:MKcH1PJ6BqKPFRAF@clouddocs.fvzckge.mongodb.net/cloudDocs';
    console.log(`Connecting to MongoDB (${mongoUri})...`);
    await mongoose.connect(mongoUri);

    // Demote all users to 'user' except PRIMARY_ADMIN_EMAIL
    const demoteResult = await User.updateMany(
      { email: { $ne: PRIMARY_ADMIN_EMAIL } },
      { $set: { role: 'user' } }
    );
    console.log(`Demoted ${demoteResult.modifiedCount} users to 'user'.`);

    // Promote PRIMARY_ADMIN_EMAIL to 'admin'
    const adminUser = await User.findOneAndUpdate(
      { email: PRIMARY_ADMIN_EMAIL },
      { $set: { role: 'admin' } },
      { new: true }
    );

    if (adminUser) {
      console.log(`🎉 SUCCESS: ${adminUser.email} is set as the ONLY ADMIN.`);
    } else {
      console.log(`⚠️ Note: Primary admin email ${PRIMARY_ADMIN_EMAIL} is not yet in the DB. It will automatically get admin role when registering or logging in.`);
    }

    const allUsers = await User.find({}, 'name email role');
    console.log('\n--- CURRENT DB USER ROLES ---');
    allUsers.forEach((u) => console.log(`- ${u.email}: ${u.role}`));

    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error('Error resetting roles:', err);
    process.exit(1);
  }
};

resetRoles();
