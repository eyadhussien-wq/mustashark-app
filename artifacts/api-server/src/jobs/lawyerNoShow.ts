import { logger } from "../lib/logger";
import { detectLawyerNoShows } from "../controllers/lawyerNoShow";

const INTERVAL_MS = 60 * 1000;
let timer: NodeJS.Timeout | null = null;

export function startLawyerNoShowJob() {
  if (timer) return;

  const run = async () => {
    try {
      const detected = await detectLawyerNoShows();
      if (detected > 0) logger.info({ detected }, "Lawyer no-show recovery job processed bookings");
    } catch (error) {
      logger.error({ err: error }, "Lawyer no-show recovery job failed");
    }
  };

  void run();
  timer = setInterval(() => void run(), INTERVAL_MS);
}
