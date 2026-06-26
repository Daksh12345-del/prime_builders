// server/db/seed.js
// Populates the data file with starter content so the site isn't empty on first run.
// Safe to re-run — it checks if data already exists before inserting.
// Run manually with: npm run seed

const store = require('./store');

function seedProperties() {
  const existing = store.getAll('properties');
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

  sampleProperties.forEach(p => store.insert('properties', p));
  console.log(`Inserted ${sampleProperties.length} sample properties.`);
}

function seedTestimonials() {
  const existing = store.getAll('testimonials');
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

  rows.forEach(t => store.insert('testimonials', t));
  console.log(`Inserted ${rows.length} testimonials.`);
}

function seedSettings() {
  const current = store.getSettings();
  const defaults = {
    whatsapp_1: '919310812957',
    whatsapp_2: '918587820230',
    instagram_url: 'https://www.instagram.com/primebuilders230',
    facebook_url: 'https://www.facebook.com/people/Prime-Builders/61590449296500/',
    office_address: 'West Delhi, New Delhi, India',
    office_hours: 'Mon - Sat: 10:00 AM - 7:00 PM',
    contact_email: 'info@primebuilder.in',
    properties_sold_count: '200',
    families_count: '850',
    years_experience: '12'
  };

  const toApply = {};
  for (const [key, value] of Object.entries(defaults)) {
    if (!(key in current)) toApply[key] = value;
  }

  if (Object.keys(toApply).length > 0) {
    store.setSettings(toApply);
    console.log('Site settings seeded.');
  } else {
    console.log('Site settings already present — skipping.');
  }
}

seedProperties();
seedTestimonials();
seedSettings();

console.log('Seeding complete.');
