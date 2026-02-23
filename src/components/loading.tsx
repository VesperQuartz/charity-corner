import { motion } from "motion/react";
import Image from "next/image";
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
              className="relative flex items-center justify-center"
            >
              <Image
                src="/logo-new.png"
                alt="Charity Corner"
                width={300}
                height={300}
              />
            </motion.div>
          </div>
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
