
import { connectDB, collections } from "../src/config/db.js";
import { calculateTotal, countRentalDays } from "../src/services/pricing.service.js";

const OWNER_1 = process.env.SEED_OWNER_1_EMAIL || "owner@gearhive.com";
const OWNER_2 = process.env.SEED_OWNER_2_EMAIL || "owner2@gearhive.com";
const CUSTOMER = process.env.SEED_CUSTOMER_EMAIL || "customer@gearhive.com";


const img = (name) => `/images/equipment/${name}.svg`;

const TERMS_STANDARD =
  "1) A valid ID is required at pick-up. 2) Equipment must be returned clean and in the same condition. " +
  "3) The renter pays for any damage or loss. 4) Late returns are charged for an extra rental period.";


const EQUIPMENT = [

  { name: "Mini Excavator 3.5 Ton", image: img("mini-excavator"), category: "Construction Equipment", location: "Dhaka", price: 180, rentalType: "Daily", availableQuantity: 3, condition: "Good", brand: "Kubota", model: "KX037-4", owner: 1, featured: true,
    description: "Compact and powerful 3.5 ton mini excavator, perfect for trenching, foundation digging and landscaping in tight spaces. Operator training available on request." },
  { name: "Concrete Mixer 350L", image: img("concrete-mixer"), category: "Construction Equipment", location: "Chattogram", price: 45, rentalType: "Daily", availableQuantity: 6, condition: "Good", brand: "Lutian", model: "JZC350",  owner: 2,
    description: "Portable 350 litre electric concrete mixer with a sturdy steel drum. Ideal for house building and small road repair jobs." },
  { name: "Hydraulic Scissor Lift 8m", image: img("scissor-lift"), category: "Construction Equipment", location: "Dhaka", price: 320, rentalType: "Weekly", availableQuantity: 2, condition: "Like New", brand: "JLG", model: "2630ES", owner: 1,
    description: "Electric scissor lift with an 8 metre working height. Quiet, safe and perfect for ceiling work, painting and warehouse maintenance." },


  { name: "Canon EOS R5 Camera Kit", image: img("camera-kit"), category: "Photography Equipment", location: "Dhaka", price: 65, rentalType: "Daily", availableQuantity: 4, condition: "Like New", brand: "Canon", model: "EOS R5", owner: 2, featured: true,
    description: "45MP full-frame mirrorless camera kit with a 24-70mm f/2.8 lens, two batteries and a 128GB card. Great for weddings, events and commercial shoots." },
  { name: "Studio LED Light Set (3 lights)", image: img("studio-light"), category: "Photography Equipment", location: "Sylhet", price: 40, rentalType: "Daily", availableQuantity: 5, condition: "Good", brand: "Aputure", model: "600d Pro", owner: 1,
    description: "Three high-output daylight LED lights with softboxes and stands. Perfect for product photography, interviews and video production." },
  { name: "DJI Mavic 3 Pro Drone", image: img("mavic-drone"), category: "Photography Equipment", location: "Chattogram", price: 70, rentalType: "Daily", availableQuantity: 2, condition: "New", brand: "DJI", model: "Mavic 3 Pro", owner: 2, featured: true,
    description: "Triple-camera drone with 5.1K video, 43-minute flight time and obstacle sensing. Comes with 3 batteries, charging hub and a carry case." },


  { name: "Toyota Hiace Passenger Van", image: img("passenger-van"), category: "Vehicles & Transportation", location: "Dhaka", price: 90, rentalType: "Daily", availableQuantity: 3, condition: "Good", brand: "Toyota", model: "Hiace GL", owner: 1, featured: true,
    description: "Comfortable 12-seat air-conditioned van for family trips, corporate transport and tour groups. Fuel is not included." },
  { name: "Flatbed Pickup Truck", image: img("pickup-truck"), category: "Vehicles & Transportation", location: "Khulna", price: 85, rentalType: "Daily", availableQuantity: 2, condition: "Good", brand: "Isuzu", model: "D-Max", owner: 2,
    description: "Strong 1.5 ton flatbed pickup for moving goods, furniture and building materials safely across the city or between districts." },
  { name: "Electric Cargo Bike", image: img("cargo-bike"), category: "Vehicles & Transportation", location: "Dhaka", price: 95, rentalType: "Weekly", availableQuantity: 5, condition: "Like New", brand: "Tern", model: "HSD S+", owner: 1,
    description: "Pedal-assist cargo bike with a 150kg load capacity and 80 km range. A smart and eco-friendly choice for local deliveries." },


  { name: "Compact Tractor 45HP", image: img("compact-tractor"), category: "Agriculture Equipment", location: "Rajshahi", price: 450, rentalType: "Weekly", availableQuantity: 2, condition: "Good", brand: "Mahindra", model: "475 DI", owner: 2, featured: true,
    description: "Reliable 45HP 4WD tractor for ploughing, tilling and hauling. Rotary tiller attachment included in the price." },
  { name: "Power Tiller Rotavator", image: img("power-tiller"), category: "Agriculture Equipment", location: "Rangpur", price: 35, rentalType: "Daily", availableQuantity: 8, condition: "Good", brand: "Kubota", model: "PT-12", owner: 1,
    description: "Easy to use walk-behind power tiller. Prepares seedbeds fast and is perfect for small and medium farms." },
  { name: "Irrigation Pump Set 5HP", image: img("irrigation-pump"), category: "Agriculture Equipment", location: "Rajshahi", price: 150, rentalType: "Monthly", availableQuantity: 4, condition: "Like New", brand: "Honda", model: "WB30XT", owner: 2,
    description: "Fuel-efficient 5HP water pump with 50 metres of hose. Keeps your fields watered through the whole growing season." },


  { name: "Gaming & Editing Laptop RTX 4070", image: img("gaming-laptop"), category: "Electronics", location: "Dhaka", price: 110, rentalType: "Weekly", availableQuantity: 4, condition: "Like New", brand: "ASUS", model: "ROG Strix G16", owner: 1,
    description: "High-performance laptop with RTX 4070 graphics, 32GB RAM and a 240Hz display. Great for video editing, 3D work and gaming events." },
  { name: "4K Laser Projector", image: img("laser-projector"), category: "Electronics", location: "Sylhet", price: 55, rentalType: "Daily", availableQuantity: 3, condition: "Good", brand: "Epson", model: "EH-LS800", owner: 2,
    description: "3600 lumen 4K laser projector with a 120 inch screen. Ideal for conferences, product launches and movie nights." },


  { name: "Line-Array PA Sound System", image: img("pa-sound-system"), category: "Event Equipment", location: "Dhaka", price: 120, rentalType: "Daily", availableQuantity: 3, condition: "Good", brand: "Yamaha", model: "DXR12 MK2", owner: 1, featured: true,
    description: "Complete sound system with 4 speakers, subwoofer, mixer and 2 wireless microphones. Covers audiences of up to 500 guests." },
  { name: "Pop-up Event Tent 6x12m", image: img("event-tent"), category: "Event Equipment", location: "Chattogram", price: 75, rentalType: "Daily", availableQuantity: 5, condition: "Good", brand: "Gala", model: "Pro Frame 6x12", owner: 2,
    description: "Waterproof white party tent with sidewalls, sturdy aluminium frame and installation crew available for set up." },


  { name: "LED Stage Lighting Rig", image: img("stage-lighting"), category: "Event Equipment", location: "Dhaka", price: 95, rentalType: "Daily", availableQuantity: 2, condition: "New", brand: "Chauvet", model: "Rogue R2", owner: 1, status: "pending",
    description: "Moving head LED stage lights with DMX controller. Perfect for concerts, weddings and corporate shows." },
  { name: "Old Diesel Generator 10kVA", image: img("diesel-generator"), category: "Construction Equipment", location: "Khulna", price: 200, rentalType: "Monthly", availableQuantity: 1, condition: "Fair", brand: "Generic", model: "DG-10", owner: 2, status: "rejected",
    description: "Used 10kVA diesel generator. Needs regular servicing, so please check it carefully before use." },
];


const BOOKINGS = [
  ["Mini Excavator 3.5 Ton", 5, 4, 3, 1],
  ["Canon EOS R5 Camera Kit", 5, 12, 2, 1],
  ["Toyota Hiace Passenger Van", 4, 8, 4, 1],
  ["Line-Array PA Sound System", 4, 20, 2, 1],
  ["Compact Tractor 45HP", 3, 3, 14, 1],
  ["DJI Mavic 3 Pro Drone", 3, 15, 3, 1],
  ["Pop-up Event Tent 6x12m", 2, 6, 2, 2],
  ["Gaming & Editing Laptop RTX 4070", 2, 18, 7, 1],
  ["Concrete Mixer 350L", 1, 5, 5, 2],
  ["4K Laser Projector", 1, 14, 2, 1],
  ["Studio LED Light Set (3 lights)", 1, 22, 3, 1],
  ["Electric Cargo Bike", 0, 1, 7, 1],
  ["Irrigation Pump Set 5HP", 0, 2, 30, 1],
];

const isoDay = (date) => date.toISOString().slice(0, 10);

async function findUser(email, fallbackName) {
  const user = await collections.users.findOne({ email });
  if (!user) {
    console.warn(`  ! User ${email} was not found. Run "npm run seed:users" in the client project first.`);
  }
  return { name: user?.name || fallbackName, email, image: user?.image || "", phone: user?.phone || "" };
}

async function seed() {
  await connectDB();
  console.log("Seeding demo data...");

  const owners = {
    1: await findUser(OWNER_1, "Rafiq Hossain"),
    2: await findUser(OWNER_2, "Tanvir Ahmed"),
  };
  const customer = await findUser(CUSTOMER, "Nadia Rahman");


  for (const name of ["equipment", "bookings", "payments", "favorites"]) {
    await collections[name].deleteMany({ isDemo: true });
  }


  const now = new Date();
  const equipmentDocs = EQUIPMENT.map((item, index) => {
    const { owner, status, featured, ...fields } = item;

    const createdAt = new Date(now.getTime() - (EQUIPMENT.length - index) * 6 * 60 * 60 * 1000);
    return {
      ...fields,
      terms: TERMS_STANDARD,
      status: status || "approved",
      featured: Boolean(featured),
      owner: owners[owner],
      isDemo: true,
      createdAt,
      updatedAt: createdAt,
    };
  });

  const inserted = await collections.equipment.insertMany(equipmentDocs);
  const equipmentWithIds = equipmentDocs.map((doc, index) => ({ ...doc, _id: inserted.insertedIds[index] }));
  console.log(`  + ${equipmentWithIds.length} equipment items`);


  const todayUtc = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  let bookingCount = 0;

  for (const [index, [equipmentName, monthsAgo, startDay, days, quantity]] of BOOKINGS.entries()) {
    const equipment = equipmentWithIds.find((item) => item.name === equipmentName);
    if (!equipment) continue;

    const startDate = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - monthsAgo, startDay));
    const endDate = new Date(startDate.getTime() + (days - 1) * 24 * 60 * 60 * 1000);
    const createdAt = new Date(startDate.getTime() - 3 * 24 * 60 * 60 * 1000);
    const bookedAt = createdAt > now ? now : createdAt;

    const totalDays = countRentalDays(startDate, endDate);
    const totalAmount = calculateTotal({ price: equipment.price, rentalType: equipment.rentalType, days: totalDays, quantity });
    const finished = endDate < todayUtc;

    const bookingResult = await collections.bookings.insertOne({
      equipmentId: equipment._id,
      equipmentName: equipment.name,
      equipmentImage: equipment.image,
      category: equipment.category,
      rentalType: equipment.rentalType,
      unitPrice: equipment.price,
      ownerName: equipment.owner.name,
      ownerEmail: equipment.owner.email,
      customerName: customer.name,
      customerEmail: customer.email,
      contactNumber: "+880 1712 345678",
      deliveryAddress: "House 12, Road 5, Dhanmondi, Dhaka",
      notes: "Please deliver in the morning.",
      startDate,
      endDate,
      totalDays,
      quantity,
      totalAmount,
      paymentStatus: "paid",
      bookingStatus: finished ? "completed" : "confirmed",
      transactionId: `pi_demo_${index + 1}`,
      stripeSessionId: `cs_demo_${index + 1}`,
      paidAt: bookedAt,
      isDemo: true,
      createdAt: bookedAt,
      updatedAt: bookedAt,
    });

    await collections.payments.insertOne({
      stripeSessionId: `cs_demo_${index + 1}`,
      paymentIntentId: `pi_demo_${index + 1}`,
      bookingId: bookingResult.insertedId,
      equipmentId: equipment._id,
      equipmentName: equipment.name,
      customerEmail: customer.email,
      customerName: customer.name,
      ownerEmail: equipment.owner.email,
      amount: totalAmount,
      currency: "usd",
      status: "paid",
      isDemo: true,
      createdAt: bookedAt,
    });

    bookingCount++;
  }
  console.log(`  + ${bookingCount} bookings with payments`);


  const favoriteNames = ["Canon EOS R5 Camera Kit", "Toyota Hiace Passenger Van", "Line-Array PA Sound System"];
  const favoriteDocs = equipmentWithIds
    .filter((item) => favoriteNames.includes(item.name))
    .map((item) => ({ userEmail: customer.email, equipmentId: item._id, isDemo: true, createdAt: now }));
  if (favoriteDocs.length > 0) await collections.favorites.insertMany(favoriteDocs);
  console.log(`  + ${favoriteDocs.length} favorites`);

  console.log(`Done. Demo period used: ${isoDay(todayUtc)} (today).`);
}

seed()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Seeding failed:", error);
    process.exit(1);
  });
