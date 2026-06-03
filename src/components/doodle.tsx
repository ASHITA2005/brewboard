import { Coffee, Heart, Sparkles } from "lucide-react";

export function DoodleCup({ className = "" }: { className?: string }) {
  return (
    <div className={`doodle-cup ${className}`} aria-hidden="true">
      <Coffee size={72} strokeWidth={2.5} />
      <Sparkles className="doodle-sparkle" size={28} />
      <Heart className="doodle-heart" size={24} />
    </div>
  );
}
