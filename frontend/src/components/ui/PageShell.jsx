import { motion } from 'framer-motion'

const PAGE = {
  initial: { opacity: 0, y: 24, filter: 'blur(4px)' },
  animate: { opacity: 1, y: 0, filter: 'blur(0px)', transition: { duration: 0.45, ease: [.25,.46,.45,.94] } },
  exit:    { opacity: 0, y: -12, transition: { duration: 0.2 } },
}

export default function PageShell({ children }) {
  return (
    <motion.div className="wrap" variants={PAGE} initial="initial" animate="animate" exit="exit">
      {children}
    </motion.div>
  )
}
