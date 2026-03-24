import { motion } from "framer-motion";
import React from "react";

interface PublicPageHeaderProps {
  label?: string;
  title: string;
  description: string;
  icon?: React.ElementType;
  image?: string;
}

export const PublicPageHeader = ({ label, title, description, icon: Icon, image }: PublicPageHeaderProps) => {
  return (
    <div className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 overflow-hidden bg-[#0B0F14]">
      {/* Background image & overlays */}
      <div className="absolute inset-0 z-0">
         {image ? (
           <>
             <div 
               className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-60 scale-[1.02] transition-transform duration-2000"
               style={{ backgroundImage: `url('${image}')` }}
             />
             <div className="absolute inset-0 bg-gradient-to-r from-[#0B0F14] via-[#0B0F14]/70 to-transparent" />
             <div className="absolute inset-0 bg-gradient-to-t from-[#0B0F14] via-transparent to-transparent" />
           </>
         ) : (
           <>
             <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1639322537228-f710d846310a?q=80&w=2000&auto=format&fit=crop')] bg-cover bg-center opacity-[0.05]" />
             <div className="absolute inset-0 bg-gradient-to-b from-[#0B0F14]/50 via-[#0B0F14]/80 to-[#0B0F14]" />
           </>
         )}
         <div className="absolute bottom-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-[#D4AF37]/30 to-transparent" />
      </div>

      <div className="container relative z-10 px-6 max-w-5xl mx-auto text-left flex flex-col items-start">
        {label && (
           <motion.span
             initial={{ opacity: 0, y: 10 }}
             animate={{ opacity: 1, y: 0 }}
             transition={{ duration: 0.5 }}
             className="heading-gold !text-left mb-6"
           >
             {label}
           </motion.span>
        )}

        {Icon && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="w-16 h-16 rounded-2xl bg-[#D4AF37]/10 border border-[#D4AF37]/20 shadow-lg mb-8 flex items-center justify-center text-[#D4AF37]"
          >
            <Icon className="w-8 h-8" />
          </motion.div>
        )}

        <motion.h1
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6 }}
          className="text-4xl md:text-5xl lg:text-7xl font-extrabold text-white mb-8 tracking-tight max-w-4xl"
        >
          {title}
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="text-lg md:text-xl text-gray-400 max-w-2xl leading-relaxed"
        >
          {description}
        </motion.p>
      </div>
    </div>
  );
};
