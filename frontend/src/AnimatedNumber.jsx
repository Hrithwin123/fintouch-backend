import React, { useEffect, useRef } from 'react';
import { motion, AnimatePresence, useAnimation } from 'framer-motion';

function Digit({ place, value }) {
  return (
    <div className="relative flex justify-center w-[1ch] overflow-hidden">
      <AnimatePresence mode="popLayout">
        <motion.span
          key={`${place}-${value}`}
          initial={{ y: '100%', filter: 'blur(6px)', opacity: 0 }}
          animate={{ y: '0%', filter: 'blur(0px)', opacity: 1 }}
          exit={{ y: '-100%', filter: 'blur(6px)', opacity: 0 }}
          transition={{ type: 'spring', stiffness: 280, damping: 28, mass: 0.9 }}
          className="block tabular-nums"
        >
          {value}
        </motion.span>
      </AnimatePresence>
    </div>
  );
}

const AnimatedNumber = ({ value }) => {
  const controls = useAnimation();
  const prevValue = useRef(value);

  useEffect(() => {
    if (prevValue.current !== value && prevValue.current !== undefined) {
      controls.start({
        scale: [1, 1.04, 1],
        transition: { duration: 0.35, ease: 'easeOut' },
      });
    }
    prevValue.current = value;
  }, [value]);

  const valStr = value !== undefined && value !== null ? value.toString() : '0';
  const digits = valStr.split('');

  return (
    <motion.div
      animate={controls}
      className="flex items-center text-8xl md:text-[10rem] font-bold text-slate-900 tracking-tighter"
    >
      <span className="mr-4 text-brand-500">₹</span>
      <div className="flex items-center">
        {digits.map((digit, i) => {
          const place = digits.length - i;
          return <Digit key={place} place={place} value={digit} />;
        })}
      </div>
    </motion.div>
  );
};

export default AnimatedNumber;