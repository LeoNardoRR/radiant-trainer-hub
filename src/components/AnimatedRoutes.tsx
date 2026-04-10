import { useLocation, useOutlet } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";

const pageVariants = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.32, ease: [0.16, 1, 0.3, 1] } },
  exit:    { opacity: 0, y: -8,  transition: { duration: 0.18, ease: [0.4, 0, 1, 1] } },
};

/**
 * Wraps each route with AnimatePresence + motion so page changes
 * have a smooth fade-up / fade-out transition.
 */
const AnimatedRoutes = () => {
  const location = useLocation();
  const element  = useOutlet();

  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={location.pathname}
        variants={pageVariants}
        initial="initial"
        animate="animate"
        exit="exit"
        style={{ willChange: "opacity, transform" }}
      >
        {element}
      </motion.div>
    </AnimatePresence>
  );
};

export default AnimatedRoutes;
