/**
 * Database seed entry point.
 * Run with: npm run db:seed
 *
 * Service catalog and demo data will be populated in a later step.
 */
async function main(): Promise<void> {
  // Seed implementation — Step 4+
}

main()
  .catch((error: unknown) => {
    console.error("Seed failed:", error);
    process.exit(1);
  });
