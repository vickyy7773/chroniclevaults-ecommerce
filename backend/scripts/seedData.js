import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './models/User.js';
import Product from './models/Product.js';
import Category from './models/Category.js';

// Load env vars
dotenv.config();

// Sample categories data
const categories = [
  {
    name: 'Coins',
    type: 'main',
    description: 'Rare and collectible coins from around the world',
    isActive: true
  },
  {
    name: 'BankNotes',
    type: 'main',
    description: 'Vintage and rare bank notes and currency',
    isActive: true
  },
  {
    name: 'Stamps',
    type: 'main',
    description: 'Collectible postage stamps from various eras',
    isActive: true
  },
  {
    name: 'Medals',
    type: 'main',
    description: 'Commemorative and military medals',
    isActive: true
  },
  {
    name: 'Books',
    type: 'main',
    description: 'Reference books and guides for collectors',
    isActive: true
  },
  {
    name: 'Accessories',
    type: 'main',
    description: 'Tools and supplies for collectors',
    isActive: true
  }
];

// Sample products data
const products = [
  {
    name: "1909-S VDB Lincoln Penny",
    description: "The 1909-S VDB Lincoln Penny is one of the most sought-after coins in American numismatics. This rare penny features the initials of its designer, Victor David Brenner, on the reverse.",
    price: 1250.0,
    originalPrice: 1500.0,
    category: "Coins",
    subCategory: "Penny",
    year: 1909,
    rarity: "Rare",
    condition: "Very Fine",
    images: [
      "https://images.unsplash.com/photo-1541961017774-22349e4a1262?w=400&h=400&fit=crop",
      "https://images.unsplash.com/photo-1621761191319-c6fb62004040?w=400&h=400&fit=crop"
    ],
    inStock: 3,
    rating: 4.8,
    numReviews: 12,
    featured: true
  },
  {
    name: "1964 Kennedy Half Dollar",
    description: "First year Kennedy Half Dollar in pristine condition. 90% silver content makes this a valuable addition to any collection.",
    price: 45.0,
    originalPrice: 65.0,
    category: "Coins",
    subCategory: "Half Dollar",
    year: 1964,
    rarity: "Common",
    condition: "Uncirculated",
    images: [
      "https://images.unsplash.com/photo-1605792657660-596af9009e82?w=400&h=400&fit=crop"
    ],
    inStock: 25,
    rating: 4.5,
    numReviews: 8,
    featured: true
  },
  {
    name: "Indian 1000 Rupee Note 1954",
    description: "Rare Indian 1000 rupee note from 1954. Collector's item in excellent condition.",
    price: 5000.0,
    originalPrice: 6500.0,
    category: "BankNotes",
    subCategory: "Indian Currency",
    year: 1954,
    rarity: "Very Rare",
    condition: "Fine",
    images: [
      "https://images.unsplash.com/photo-1580519542036-c47de6196ba5?w=400&h=400&fit=crop"
    ],
    inStock: 2,
    rating: 4.9,
    numReviews: 5,
    featured: true
  },
  {
    name: "British India One Rupee 1917",
    description: "Silver one rupee coin from British India period. Historical significance and good condition.",
    price: 850.0,
    originalPrice: 1000.0,
    category: "Coins",
    subCategory: "Rupee",
    year: 1917,
    rarity: "Uncommon",
    condition: "Very Fine",
    images: [
      "https://images.unsplash.com/photo-1610375461246-83df859d849d?w=400&h=400&fit=crop"
    ],
    inStock: 8,
    rating: 4.6,
    numReviews: 15,
    featured: false
  },
  {
    name: "American Silver Eagle 2020",
    description: "Brilliant uncirculated American Silver Eagle. One troy ounce of .999 fine silver.",
    price: 35.0,
    originalPrice: 45.0,
    category: "Coins",
    subCategory: "Silver Eagle",
    year: 2020,
    rarity: "Common",
    condition: "Uncirculated",
    images: [
      "https://images.unsplash.com/photo-1621761191319-c6fb62004040?w=400&h=400&fit=crop"
    ],
    inStock: 50,
    rating: 4.7,
    numReviews: 25,
    featured: true
  },
  {
    name: "Vintage Indian Postage Stamp Collection",
    description: "Collection of 50 vintage Indian postage stamps from 1940s-1960s. Various designs and denominations.",
    price: 2500.0,
    originalPrice: 3000.0,
    category: "Stamps",
    subCategory: "Indian Stamps",
    year: 1950,
    rarity: "Rare",
    condition: "Fine",
    images: [
      "https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=400&h=400&fit=crop"
    ],
    inStock: 5,
    rating: 4.8,
    numReviews: 10,
    featured: true
  },
  {
    name: "Olympic Games Medal 1984",
    description: "Commemorative medal from 1984 Olympic Games. Bronze finish with original ribbon.",
    price: 1200.0,
    originalPrice: 1500.0,
    category: "Medals",
    subCategory: "Olympic",
    year: 1984,
    rarity: "Uncommon",
    condition: "Excellent",
    images: [
      "https://images.unsplash.com/photo-1567360425618-1594206637d2?w=400&h=400&fit=crop"
    ],
    inStock: 4,
    rating: 4.6,
    numReviews: 7,
    featured: false
  },
  {
    name: "Red Book Guide to US Coins 2024",
    description: "Latest edition of the most trusted reference for US coin values and grading.",
    price: 750.0,
    originalPrice: 950.0,
    category: "Books",
    subCategory: "Reference",
    year: 2024,
    rarity: "Common",
    condition: "New",
    images: [
      "https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=400&h=400&fit=crop"
    ],
    inStock: 20,
    rating: 4.9,
    numReviews: 30,
    featured: false
  },
  {
    name: "Professional Coin Holder Case",
    description: "Premium quality acrylic coin display case. Holds up to 20 coins safely.",
    price: 450.0,
    originalPrice: 600.0,
    category: "Accessories",
    subCategory: "Storage",
    year: 2024,
    rarity: "Common",
    condition: "New",
    images: [
      "https://images.unsplash.com/photo-1598662779094-110c2bad80b5?w=400&h=400&fit=crop"
    ],
    inStock: 35,
    rating: 4.5,
    numReviews: 18,
    featured: false
  },
  {
    name: "Magnifying Glass with LED",
    description: "Professional grade magnifying glass with LED light for coin inspection.",
    price: 320.0,
    originalPrice: 400.0,
    category: "Accessories",
    subCategory: "Tools",
    year: 2024,
    rarity: "Common",
    condition: "New",
    images: [
      "https://images.unsplash.com/photo-1632053002928-5c4e9c012e25?w=400&h=400&fit=crop"
    ],
    inStock: 40,
    rating: 4.7,
    numReviews: 22,
    featured: false
  }
];

// Connect to database
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ MongoDB Connected');
  } catch (error) {
    console.error('❌ MongoDB Connection Error:', error.message);
    process.exit(1);
  }
};

// Import data
const importData = async () => {
  try {
    await connectDB();

    // Clear existing data
    await Product.deleteMany();
    await User.deleteMany();
    await Category.deleteMany();

    console.log('🗑️  Data Deleted');

    // Create admin user
    const adminUser = await User.create({
      name: 'Admin User',
      email: 'admin@vintagecoin.com',
      password: 'Admin123',
      role: 'admin',
      phone: '+91 9876543210'
    });

    console.log('✅ Admin User Created');
    console.log('   Email: admin@vintagecoin.com');
    console.log('   Password: Admin123');

    // Create sample user
    const sampleUser = await User.create({
      name: 'Test User',
      email: 'user@example.com',
      password: 'User123',
      phone: '+91 9876543211'
    });

    console.log('✅ Sample User Created');
    console.log('   Email: user@example.com');
    console.log('   Password: User123');

    // Insert categories
    const createdCategories = await Category.insertMany(categories);
    console.log(`✅ ${createdCategories.length} Categories Created`);

    // Insert products
    const createdProducts = await Product.insertMany(products);

    console.log(`✅ ${createdProducts.length} Products Imported`);
    console.log('\n🎉 Data Import Complete!');
    console.log('\nNext Steps:');
    console.log('1. Start backend: npm run dev');
    console.log('2. Test API: http://localhost:5000/api/health');
    console.log('3. Get products: http://localhost:5000/api/products');
    console.log('4. Login as admin: POST http://localhost:5000/api/auth/login');

    process.exit();
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
};

// Delete data
const deleteData = async () => {
  try {
    await connectDB();

    await Product.deleteMany();
    await User.deleteMany();
    await Category.deleteMany();

    console.log('🗑️  Data Deleted Successfully');
    process.exit();
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
};

// Check command line arguments
if (process.argv[2] === '-d') {
  deleteData();
} else {
  importData();
}
