require('dotenv').config({ path: './.env' });
const mongoose = require('mongoose');

mongoose.connect(process.env.MONGODB_URI).then(async () => {
  console.log('✅ Connected to MongoDB');

  const User = require('./models/User');

  
  await User.deleteMany({ role: 'admin' });
  console.log('🗑️  Old admin accounts removed');

  
  const admin = new User({
    username: 'koushikchandaka',
    email: 'koushikchandaka@gmail.com',
    password: 'Koushik@756',
    role: 'admin',
  });

  await admin.save();

  console.log('');
  console.log('🎉 Your admin account is ready!');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('   Email:    koushikchandaka@gmail.com');
  console.log('   Password: Koushik@756');
  console.log('   Role:     admin');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('');
  console.log('Go to http://localhost:3000/login and sign in!');

  process.exit(0);
}).catch(err => {
  console.error('❌ Error:', err.message);
  process.exit(1);
});