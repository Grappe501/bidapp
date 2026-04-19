/**
 * Prints the deterministic UUID for the bundled S000000479 seed project.
 * Use for VITE_DEFAULT_PROJECT_ID after `npm run db:seed`.
 */
import { MOCK_PROJECT } from "../src/data/mockProject";
import { uuidFromSeed } from "../src/server/lib/deterministic-uuid";

console.log(uuidFromSeed(`project:${MOCK_PROJECT.id}`));
