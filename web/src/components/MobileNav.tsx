"use client";
import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

export function MobileNav({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* Hamburger — only on mobile */}
      <button
        className="fixed top-4 left-4 z-50 flex h-9 w-9 items-center justify-center rounded-lg border border-line bg-panel/80 backdrop-blur-sm md:hidden"
        onClick={() => setOpen((v) => !v)}
        aria-label="Toggle menu"
      >
        <span className="flex flex-col gap-1.5">
          <span className={`block h-0.5 w-5 bg-white/70 transition-all duration-200 ${open ? "translate-y-2 rotate-45" : ""}`} />
          <span className={`block h-0.5 w-5 bg-white/70 transition-all duration-200 ${open ? "opacity-0" : ""}`} />
          <span className={`block h-0.5 w-5 bg-white/70 transition-all duration-200 ${open ? "-translate-y-2 -rotate-45" : ""}`} />
        </span>
      </button>

      {/* Overlay */}
      <AnimatePresence>
        {open && (
          <motion.div
            className="fixed inset-0 z-40 bg-black/50 md:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Sidebar drawer */}
      <div
        className={`fixed inset-y-0 left-0 z-40 transition-transform duration-300 md:relative md:translate-x-0 ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
        onClick={() => setOpen(false)}
      >
        {children}
      </div>
    </>
  );
}
