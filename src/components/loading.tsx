import { motion } from "motion/react";
export const PageLoader = () => {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-white p-4">
      <div className="flex flex-col items-center gap-6">
        <div className="flex flex-col items-center">
          <div className="mb-1 flex items-center gap-4">
            {/* Logo Icon - Refined SVG */}
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.5 }}
              className="relative h-20 w-20"
            >
              <svg
                viewBox="0 0 100 100"
                className="h-full w-full drop-shadow-lg"
              >
                {/* Handle */}
                <path
                  d="M35 25 C35 5, 65 5, 65 25"
                  fill="none"
                  stroke="#FF4081"
                  strokeWidth="5"
                  strokeLinecap="round"
                />

                {/* Stacked Items / Bag Layers */}
                {/* Top Layer - Pink */}
                <path
                  d="M15 30 Q10 30 10 40 L12 50 L88 50 L90 40 Q90 30 85 30 Z"
                  fill="#FF4081"
                />
                {/* Middle Layer - Yellow/Orange */}
                <path d="M12 52 L88 52 L86 68 L14 68 Z" fill="#FFC107" />
                {/* Bottom Layer - Blue */}
                <path
                  d="M14 70 L86 70 L82 85 Q80 90 70 90 L30 90 Q20 90 18 85 Z"
                  fill="#0D47A1"
                />

                {/* White separators for clean look */}
                <path d="M12 51 L88 51" stroke="white" strokeWidth="2" />
                <path d="M14 69 L86 69" stroke="white" strokeWidth="2" />

                {/* Small tag detail on the left */}
                <rect
                  x="5"
                  y="35"
                  width="10"
                  height="15"
                  rx="2"
                  fill="white"
                  stroke="#ddd"
                  strokeWidth="1"
                  transform="rotate(-10 10 42)"
                />
              </svg>
            </motion.div>

            {/* Logo Text */}
            <motion.div
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="flex items-baseline gap-2"
            >
              <h1
                className="font-script text-6xl text-[#FF4081]"
                style={{ fontFamily: '"Dancing Script", cursive' }}
              >
                Charity
              </h1>
              <h1
                className="font-script text-6xl text-black"
                style={{ fontFamily: '"Dancing Script", cursive' }}
              >
                Corner
              </h1>
            </motion.div>
          </div>

          {/* Tagline */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="mt-2 font-sans text-sm tracking-wider text-gray-500"
          >
            Shop. Give back. Change lives
          </motion.p>
        </div>

        {/* Loading Spinner */}
        <div className="relative mt-8 h-12 w-12">
          <motion.div className="h-full w-full rounded-full border-[5px] border-gray-100" />
          <motion.div
            className="absolute top-0 left-0 h-full w-full rounded-full border-[5px] border-transparent border-t-[#FF4081] border-r-[#FF4081]"
            animate={{ rotate: 360 }}
            transition={{
              duration: 1,
              repeat: Infinity,
              ease: "linear",
            }}
          />
        </div>
      </div>
    </div>
  );
};
