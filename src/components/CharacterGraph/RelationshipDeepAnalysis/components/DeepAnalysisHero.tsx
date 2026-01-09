import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { X } from "lucide-react";
import { Button, Badge } from "@stolink/ui";
import type { RelationType } from "@/types";

interface DeepAnalysisHeroProps {
  sourceName: string;
  targetName: string;
  relationshipType: RelationType | string;
  strength: number;
  onClose: () => void;
  since?: string;
  className?: string;
}

export function DeepAnalysisHero({
  sourceName,
  targetName,
  relationshipType,
  strength,
  onClose,
  since,
  className,
}: DeepAnalysisHeroProps) {
  // Animation Variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1, delayChildren: 0.2 },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] },
    },
  };

  return (
    <div className={cn("relative z-10 p-8 pb-0", className)}>
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="flex flex-col gap-6"
      >
        {/* Top Bar */}
        <div className="flex justify-between items-start">
          <motion.div
            variants={itemVariants}
            className="flex items-center gap-3"
          >
            <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-black/5 backdrop-blur-sm border border-black/5">
              <span className="w-1.5 h-1.5 rounded-full bg-espresso-800 animate-pulse" />
              <span className="text-[10px] font-bold text-espresso-800 uppercase tracking-[0.2em]">
                Confidential Dossier
              </span>
            </div>
            {since && (
              <span className="text-[10px] text-espresso-400 font-medium tracking-wide">
                EST. {since}
              </span>
            )}
          </motion.div>

          <motion.div variants={itemVariants}>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="rounded-full hover:bg-black/5 transition-colors"
            >
              <X className="w-6 h-6 text-espresso-800" />
            </Button>
          </motion.div>
        </div>

        {/* Cinematic Title */}
        <motion.div variants={itemVariants} className="relative mt-4">
          <h1 className="text-6xl md:text-7xl font-serif font-black text-espresso-900 leading-[0.9] tracking-tight">
            <span className="block">{sourceName}</span>
            <span className="block text-transparent bg-clip-text bg-gradient-to-r from-espresso-200 to-espresso-300 italic font-light transform -skew-x-12 origin-left text-5xl md:text-6xl my-2">
              &mdash; versus &mdash;
            </span>
            <span className="block">{targetName}</span>
          </h1>
        </motion.div>

        {/* Stats Strip */}
        <motion.div
          variants={itemVariants}
          className="flex items-end gap-6 mt-4 pb-8 border-b border-black/5"
        >
          {/* Relationship Badge */}
          <div className="flex flex-col gap-1">
            <span className="text-[10px] uppercase font-bold text-espresso-400 tracking-wider">
              Archetype
            </span>
            <Badge className="text-sm px-4 py-1.5 bg-espresso-900 text-white border-none shadow-lg">
              {relationshipType}
            </Badge>
          </div>

          {/* Strength Meter */}
          <div className="flex flex-col gap-1 flex-1">
            <span className="text-[10px] uppercase font-bold text-espresso-400 tracking-wider">
              Bond Intensity
            </span>
            <div className="flex items-center gap-3">
              <div className="flex-1 h-2 bg-black/5 rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-espresso-900"
                  initial={{ width: 0 }}
                  animate={{ width: `${strength * 10}%` }}
                  transition={{ duration: 1, delay: 0.5, ease: "circOut" }}
                />
              </div>
              <span className="font-serif font-bold text-xl text-espresso-900 lining-nums">
                {strength}
                <span className="text-sm text-espresso-400 font-sans font-normal">
                  /10
                </span>
              </span>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}
