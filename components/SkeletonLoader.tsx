import React from 'react';
import { motion } from 'framer-motion';

const shimmer = {
    initial: { opacity: 0.5 },
    animate: { opacity: 1, transition: { duration: 1, repeat: Infinity, repeatType: "reverse" as const } }
};

export const SkeletonCard: React.FC = () => (
    <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="glass-card rounded-xl p-6 h-48 w-full border border-white/20 shadow-sm"
    >
        <motion.div variants={shimmer} initial="initial" animate="animate" className="h-6 w-1/3 bg-slate-200/50 rounded mb-4" />
        <motion.div variants={shimmer} initial="initial" animate="animate" className="h-32 w-full bg-slate-100/50 rounded" />
    </motion.div>
);

export const SkeletonRow: React.FC = () => (
    <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex items-center gap-4 py-4 px-6 border-b border-white/10"
    >
        <div className="w-1/4">
            <motion.div variants={shimmer} initial="initial" animate="animate" className="h-4 w-3/4 bg-slate-200/50 rounded mb-2" />
            <motion.div variants={shimmer} initial="initial" animate="animate" className="h-3 w-1/2 bg-slate-100/50 rounded" />
        </div>
        <div className="flex-1">
            <motion.div variants={shimmer} initial="initial" animate="animate" className="h-4 w-1/2 bg-slate-200/50 rounded" />
        </div>
        <div className="flex-1">
            <motion.div variants={shimmer} initial="initial" animate="animate" className="h-4 w-2/3 bg-slate-200/50 rounded" />
        </div>
        <div className="w-24">
            <motion.div variants={shimmer} initial="initial" animate="animate" className="h-8 w-full bg-slate-200/50 rounded" />
        </div>
    </motion.div>
);

export const SkeletonPanel: React.FC = () => (
    <div className="w-full h-full flex flex-col p-8 space-y-6 overflow-hidden">
        <div className="space-y-4">
            <motion.div variants={shimmer} initial="initial" animate="animate" className="h-8 w-1/3 bg-slate-200/50 rounded" />
            <motion.div variants={shimmer} initial="initial" animate="animate" className="h-4 w-1/4 bg-slate-100/50 rounded" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <SkeletonCard />
            <SkeletonCard />
        </div>
        <div className="flex-1 glass-card rounded-xl overflow-hidden p-4 space-y-4">
            {[1, 2, 3, 4, 5].map(i => <SkeletonRow key={i} />)}
        </div>
    </div>
);
