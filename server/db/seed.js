// server/db/seed.js
// Populates the database with starter content so the site isn't empty on first run.
// Safe to re-run — it checks if data already exists before inserting.
// Run manually with: npm run seed

require('dotenv').config();
const store = require('./store');

async function seedProperties() {
  const existing = await store.getAll('properties');
  if (existing.length > 0) {
    console.log(`Properties already has ${existing.length} rows — skipping seed.`);
    return;
  }

  const sampleProperties = [
    {
      title: 'Spacious 3BHK Builder Floor',
      bhk: '3BHK',
      locality: 'Janakpuri, West Delhi',
      price_value: 9500000,
      price_label: '95 Lakh',
      area_sqft: 1450,
      floor: '2nd Floor',
      facing: 'East Facing',
      bathrooms: 3,
      status: 'Available',
      units_available: 4,
      is_featured: true,
      description: 'A well-ventilated 3BHK builder floor with modular kitchen, covered parking, and close proximity to Janakpuri District Centre.',
      amenities: ['Modular Kitchen', 'Covered Parking', 'Power Backup', 'Lift'],
      images: [],
      created_at: new Date().toISOString()
    },
    {
      title: 'Premium 4BHK Independent Floor',
      bhk: '4BHK',
      locality: 'Rajouri Garden, West Delhi',
      price_value: 18500000,
      price_label: '1.85 Cr',
      area_sqft: 2200,
      floor: '3rd Floor (Top)',
      facing: 'North-East Facing',
      bathrooms: 4,
      status: 'Available',
      units_available: 2,
      is_featured: true,
      description: 'Top-floor 4BHK with private terrace, premium fittings, and walking distance to Rajouri Garden metro station.',
      amenities: ['Private Terrace', 'Premium Fittings', 'CCTV Security', 'Lift', 'Power Backup'],
      images: [],
      created_at: new Date().toISOString()
    },
    {
      title: 'Compact 2BHK Family Home',
      bhk: '2BHK',
      locality: 'Vikaspuri, West Delhi',
      price_value: 6200000,
      price_label: '62 Lakh',
      area_sqft: 950,
      floor: 'Ground Floor',
      facing: 'South Facing',
      bathrooms: 2,
      status: 'Available',
      units_available: 7,
      is_featured: false,
      description: 'Ideal starter home for a small family — ground floor for easy access, located in a quiet residential pocket of Vikaspuri.',
      amenities: ['Parking', 'Water Storage Tank', '24x7 Water Supply'],
      images: [],
      created_at: new Date().toISOString()
    },
    {
      title: 'Modern 3BHK with Terrace',
      bhk: '3BHK',
      locality: 'Tilak Nagar, West Delhi',
      price_value: 11000000,
      price_label: '1.10 Cr',
      area_sqft: 1600,
      floor: '4th Floor (Top + Terrace)',
      facing: 'West Facing',
      bathrooms: 3,
      status: 'Available',
      units_available: 1,
      is_featured: true,
      description: 'Top floor with full terrace rights, recently renovated interiors, near Tilak Nagar market and metro.',
      amenities: ['Terrace Rights', 'Renovated Interiors', 'Near Metro', 'Lift'],
      images: [],
      created_at: new Date().toISOString()
    },
    {
      title: 'Elegant 4BHK Builder Floor',
      bhk: '4BHK',
      locality: 'Paschim Vihar, West Delhi',
      price_value: 21000000,
      price_label: '2.10 Cr',
      area_sqft: 2400,
      floor: '1st Floor',
      facing: 'East Facing',
      bathrooms: 4,
      status: 'Sold',
      is_featured: false,
      description: 'Spacious east-facing floor with servant room, double-height lobby, and dedicated parking for two cars.',
      amenities: ['Servant Room', 'Double-Height Lobby', '2 Car Parking', 'Power Backup'],
      images: [],
      created_at: new Date().toISOString()
    },
    {
      title: 'Cozy 2BHK Near Metro',
      bhk: '2BHK',
      locality: 'Uttam Nagar, West Delhi',
      price_value: 5400000,
      price_label: '54 Lakh',
      area_sqft: 850,
      floor: '1st Floor',
      facing: 'North Facing',
      bathrooms: 2,
      status: 'Available',
      units_available: 3,
      is_featured: false,
      description: 'Budget-friendly 2BHK just 5 minutes walk from Uttam Nagar metro station, great for first-time buyers.',
      amenities: ['Near Metro', 'Parking', 'Gated Society'],
      images: [],
      created_at: new Date().toISOString()
    }
  ];

  for (const p of sampleProperties) {
    await store.insert('properties', p);
  }
  console.log(`Inserted ${sampleProperties.length} sample properties.`);
}

async function seedTestimonials() {
  const existing = await store.getAll('testimonials');
  if (existing.length > 0) {
    console.log(`Testimonials already has ${existing.length} rows — skipping seed.`);
    return;
  }

  const rows = [
    {
      name: 'Ramesh Gupta',
      locality: 'Janakpuri',
      quote: 'Prime Builder made the entire process simple. They were transparent about pricing and paperwork from day one.',
      rating: 5,
      sort_order: 1
    },
    {
      name: 'Sunita Arora',
      locality: 'Rajouri Garden',
      quote: 'Found our 4BHK within two weeks of contacting them. Good understanding of what we actually needed.',
      rating: 5,
      sort_order: 2
    },
    {
      name: 'Vikram Sehgal',
      locality: 'Tilak Nagar',
      quote: 'Honest advice on locality and resale value, not just a sales pitch. Would recommend to anyone buying in West Delhi.',
      rating: 4,
      sort_order: 3
    }
  ];

  for (const t of rows) {
    await store.insert('testimonials', t);
  }
  console.log(`Inserted ${rows.length} testimonials.`);
}

async function seedSettings() {
  const current = await store.getSettings();
  const defaults = {
    whatsapp_1: '919302812957',
    whatsapp_2: '918587820230',
    instagram_url: 'https://www.instagram.com/primebuilders230',
    facebook_url: 'https://www.facebook.com/people/Prime-Builders/61590449296500/',
    office_address: 'West Delhi, New Delhi, India',
    office_hours: 'Mon - Sat: 10:00 AM - 7:00 PM',
    contact_email: 'info@primebuilder.in',
    properties_sold_count: '200',
    families_count: '850',
    years_experience: '12',
    rera_number: '',
    google_review_url: '',
    google_rating: '',
    google_review_count: ''
  };

  const toApply = {};
  for (const [key, value] of Object.entries(defaults)) {
    if (!(key in current)) toApply[key] = value;
  }

  if (Object.keys(toApply).length > 0) {
    await store.setSettings(toApply);
    console.log('Site settings seeded.');
  } else {
    console.log('Site settings already present — skipping.');
  }
}

async function seedBlogPosts() {
  const existing = await store.getAll('blog_posts');
  if (existing.length > 0) {
    console.log(`Blog already has ${existing.length} posts — skipping seed.`);
    return;
  }

  const now = new Date().toISOString();
  const posts = [
    {
      title: 'A First-Time Buyer\'s Guide to West Delhi Localities',
      slug: 'first-time-buyer-guide-west-delhi-localities',
      excerpt: 'Janakpuri, Rajouri Garden, Tilak Nagar, Vikaspuri, Paschim Vihar, Uttam Nagar — each West Delhi locality has a different character and price range. Here\'s how to think about which one fits your budget and lifestyle.',
      body: `<p>West Delhi isn't one neighbourhood — it's six or seven distinct ones, each with its own pricing, connectivity, and character. If you're buying your first home here, the locality you choose matters almost as much as the flat itself.</p>
<h3>If connectivity is your top priority</h3>
<p>Uttam Nagar and Tilak Nagar both sit directly on the Blue Line, with Uttam Nagar having two stations of its own. These tend to be more budget-friendly entry points, especially for 2BHK homes.</p>
<h3>If you want more space and greenery</h3>
<p>Paschim Vihar and Rajouri Garden are known for wider roads, more established parks, and larger builder floors — usually at a higher price point, but with strong long-term resale value.</p>
<h3>If you want a balance of both</h3>
<p>Janakpuri and Vikaspuri sit in the middle: solid metro access, a mix of 2BHK to 4BHK options, and well-established residential infrastructure.</p>
<p>Whatever your priority, the right move is to walk a few blocks before deciding — paper specifications rarely tell the full story of how a locality actually feels to live in. We're happy to set up visits across multiple localities so you can compare directly.</p>`,
      cover_url: null,
      published: true,
      created_at: now,
      published_at: now
    },
    {
      title: 'Builder Floor vs Apartment: What Actually Matters in West Delhi',
      slug: 'builder-floor-vs-apartment-west-delhi',
      excerpt: 'Most of what\'s available across Janakpuri, Rajouri Garden, and nearby localities are independent builder floors rather than apartment-society units. Here\'s what that distinction means for you as a buyer.',
      body: `<p>If you're coming from a city where "apartment society" is the default, West Delhi's builder-floor market can take some getting used to. Here's the short version of what's different.</p>
<h3>Ownership and maintenance</h3>
<p>A builder floor usually means you own one full floor of a small building (often G+3 or G+4), rather than a unit within a large society. Maintenance is typically shared informally among the floor owners rather than managed by a registered RWA — worth asking about explicitly before you buy.</p>
<h3>Space and privacy</h3>
<p>Builder floors generally offer more carpet area per rupee than apartment-society flats in the same locality, plus fewer shared walls and more control over renovations.</p>
<h3>What to check before buying</h3>
<p>Always verify the floor's registry documents, sanctioned building plan, and whether the terrace/parking rights are clearly assigned in writing — these are the most common sources of dispute later. We walk every client through this checklist before they sign anything.</p>`,
      cover_url: null,
      published: true,
      created_at: now,
      published_at: now
    },
    {
      title: '5 Questions to Ask Before You Buy a Resale Home',
      slug: '5-questions-before-buying-resale-home',
      excerpt: 'Buying resale in West Delhi? These five questions will save you from the most common surprises after you\'ve already paid the token amount.',
      body: `<p>Resale homes move fast in West Delhi, and it's easy to get caught up in the excitement of a good price. Before you commit, make sure you've got clear answers to these five questions.</p>
<h3>1. Is the registry clean and in the seller's name?</h3>
<p>Always verify the chain of ownership goes back cleanly, with no pending litigation or unclear inheritance.</p>
<h3>2. Are there any outstanding dues?</h3>
<p>Property tax, electricity, water, and any society/floor maintenance dues should be cleared before registry — confirm this in writing.</p>
<h3>3. What's the actual carpet area versus the quoted area?</h3>
<p>Quoted "super area" numbers can be generous. Always ask for the carpet area and verify with a tape measure if needed.</p>
<h3>4. Is the building plan sanctioned and matching what's built?</h3>
<p>Unauthorized construction (extra floors, extended terraces) can cause problems at registry or resale later.</p>
<h3>5. Why is the seller actually selling?</h3>
<p>Not a legal question, but a useful one — it often reveals whether there's room to negotiate and whether the timeline is flexible.</p>
<p>If you'd like, we can walk through this checklist together for any specific property you're considering.</p>`,
      cover_url: null,
      published: true,
      created_at: now,
      published_at: now
    }
  ];

  for (const p of posts) {
    await store.insert('blog_posts', p);
  }
  console.log(`Inserted ${posts.length} blog posts.`);
}

async function runSeed() {
  await seedProperties();
  await seedTestimonials();
  await seedBlogPosts();
  await seedSettings();
  console.log('Seeding complete.');
}

runSeed().catch(err => {
  console.error('Seeding failed:', err);
  process.exit(1);
});
