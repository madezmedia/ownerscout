import React from 'react';
import { SignIn, SignUp } from '@clerk/clerk-react';
import { Zap } from 'lucide-react';
import { motion } from 'framer-motion';

interface SignInPageProps {
  mode?: 'sign-in' | 'sign-up';
}

const SignInPage: React.FC<SignInPageProps> = ({ mode = 'sign-in' }) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 flex flex-col items-center justify-center p-6">
      {/* Brand */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8 text-center"
      >
        <div className="flex items-center justify-center gap-3 mb-3">
          <div className="w-12 h-12 rounded-2xl bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-500/40">
            <Zap size={24} className="text-white fill-white" />
          </div>
          <h1 className="text-3xl font-bold text-white tracking-tight">OwnerScout</h1>
        </div>
        <p className="text-slate-400 text-sm">
          {mode === 'sign-in'
            ? 'Sign in to access your saved searches and prospecting tools.'
            : 'Create an account to start prospecting restaurants.'}
        </p>
      </motion.div>

      {/* Clerk component */}
      <motion.div
        initial={{ opacity: 0, scale: 0.97 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.1 }}
      >
        {mode === 'sign-in' ? (
          <SignIn
            appearance={{
              elements: {
                card: 'shadow-2xl',
                headerTitle: 'text-slate-900 font-bold',
                socialButtonsBlockButton: 'border border-slate-200 hover:bg-slate-50',
              },
            }}
          />
        ) : (
          <SignUp
            appearance={{
              elements: {
                card: 'shadow-2xl',
                headerTitle: 'text-slate-900 font-bold',
                socialButtonsBlockButton: 'border border-slate-200 hover:bg-slate-50',
              },
            }}
          />
        )}
      </motion.div>
    </div>
  );
};

export default SignInPage;
