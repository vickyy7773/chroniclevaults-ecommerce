// Check users with frozen coins
const mongoose = require('mongoose');

mongoose.connect('mongodb://localhost:27017/ecommerce').then(async () => {
  const User = mongoose.connection.collection('users');

  // Find users with frozen coins
  const users = await User.find({ frozenCoins: { $gt: 0 } }).toArray();

  console.log('\n📊 Users with Frozen Coins:\n');
  users.forEach(user => {
    console.log(`User: ${user.name} (${user.email})`);
    console.log(`Total Auction Coins: ${user.auctionCoins}`);
    console.log(`Frozen Coins: ${user.frozenCoins}`);
    console.log(`Available Coins: ${user.auctionCoins - user.frozenCoins}`);
    console.log(`Frozen Per Auction:`, JSON.stringify(user.frozenCoinsPerAuction || [], null, 2));
    console.log('\n---\n');
  });

  mongoose.connection.close();
}).catch(err => console.error(err));
