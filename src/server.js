
import app from "./app.js";
import { env, assertRequiredEnv } from "./config/env.js";
import { connectDB } from "./config/db.js";
import { startBookingStatusJob } from "./jobs/bookingStatus.job.js";

async function startServer() {
  try {
    assertRequiredEnv();
    await connectDB();
    startBookingStatusJob(); 

    app.listen(env.port, () => {
      console.log(`GearHive API is running on http://localhost:${env.port}`);
    });
  } catch (error) {
    console.error("Could not start the server:", error.message);
    process.exit(1);
  }
}

startServer();
