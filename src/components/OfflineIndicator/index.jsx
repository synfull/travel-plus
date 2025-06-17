import { motion, AnimatePresence } from 'framer-motion'
import { useOffline } from '@hooks/useOffline'

export default function OfflineIndicator() {
  const { isOnline, syncPending } = useOffline()

  return (
    <AnimatePresence>
      {(!isOnline || syncPending) && (
        <motion.div
          initial={{ y: -100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -100, opacity: 0 }}
          transition={{ type: 'spring', damping: 20 }}
          className="fixed top-0 left-0 right-0 z-50"
        >
          <div className={`
            px-4 py-3 text-center text-sm font-medium
            ${isOnline 
              ? 'bg-gradient-to-r from-yellow-500/90 to-orange-500/90' 
              : 'bg-gradient-to-r from-red-500/90 to-pink-500/90'
            }
            backdrop-blur-md
          `}>
            <div className="flex items-center justify-center gap-2">
              {!isOnline ? (
                <>
                  <svg className="w-4 h-4 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636a9 9 0 010 12.728m0 0l-2.829-2.829m2.829 2.829L21 21M15.536 8.464a5 5 0 010 7.072m0 0l-2.829-2.829m-4.243 2.829a4.978 4.978 0 01-1.414-2.83m-1.414 5.658a9 9 0 01-2.167-9.238m7.824 2.167a1 1 0 111.414 1.414m-1.414-1.414L3 3m8.293 8.293l1.414 1.414" />
                  </svg>
                  <span>You're offline - Some features may be limited</span>
                </>
              ) : syncPending ? (
                <>
                  <svg className="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  <span>Syncing your data...</span>
                </>
              ) : null}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}