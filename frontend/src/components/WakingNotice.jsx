import { AnimatePresence, motion } from 'motion/react';

/** Shown when a request is slow because the free server is waking from sleep. */
export default function WakingNotice({ show, className = '' }) {
  return (
    <AnimatePresence>
      {show && (
        <motion.p
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          role="status"
          className={`text-center text-[13px] leading-relaxed text-ink-3 ${className}`}
        >
          Waking up the server. It sleeps when nobody's using it, so the first visit can take up to a minute.
        </motion.p>
      )}
    </AnimatePresence>
  );
}
