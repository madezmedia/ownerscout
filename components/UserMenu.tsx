import React, { useState } from 'react';
import { useClerk, useUser } from '@clerk/clerk-react';
import { LogOut, User, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const UserMenu: React.FC = () => {
  const { user } = useUser();
  const { signOut } = useClerk();
  const [open, setOpen] = useState(false);

  if (!user) return null;

  const initials = `${user.firstName?.[0] ?? ''}${user.lastName?.[0] ?? ''}`.toUpperCase() || user.emailAddresses[0]?.emailAddress?.[0]?.toUpperCase() || 'U';

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 bg-white/80 backdrop-blur-sm border border-slate-200 rounded-xl px-3 py-2 hover:bg-white transition-all shadow-sm text-sm font-medium text-slate-700"
      >
        {user.imageUrl ? (
          <img src={user.imageUrl} alt="avatar" className="w-6 h-6 rounded-full" />
        ) : (
          <div className="w-6 h-6 rounded-full bg-indigo-600 text-white flex items-center justify-center text-xs font-bold">
            {initials}
          </div>
        )}
        <span className="hidden sm:inline max-w-[120px] truncate">
          {user.firstName || user.emailAddresses[0]?.emailAddress}
        </span>
        <ChevronDown size={14} className={`transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 mt-2 w-56 bg-white border border-slate-200 rounded-xl shadow-xl z-50 overflow-hidden"
          >
            <div className="px-4 py-3 border-b border-slate-100">
              <p className="text-xs text-slate-500">Signed in as</p>
              <p className="text-sm font-medium text-slate-800 truncate">
                {user.primaryEmailAddress?.emailAddress}
              </p>
            </div>
            <div className="p-1">
              <button
                onClick={() => { setOpen(false); signOut(); }}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 rounded-lg transition-colors"
              >
                <LogOut size={15} className="text-slate-400" />
                Sign out
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Click outside to close */}
      {open && (
        <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
      )}
    </div>
  );
};

export default UserMenu;
