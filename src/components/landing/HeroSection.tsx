import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { ArrowRight, Users, Calendar, Camera } from "lucide-react";
import { Button } from "@/components/ui/button";

const features = [
  { icon: Users, label: "Unlimited Family Members" },
  { icon: Calendar, label: "Shared Calendars" },
  { icon: Camera, label: "Photo Galleries" },
];

export function HeroSection() {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-gradient-hero">
      {/* Background decorative elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-sage-light/30 rounded-full blur-3xl animate-float" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-amber-light/20 rounded-full blur-3xl animate-float" style={{ animationDelay: "2s" }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-sage-light/10 rounded-full blur-3xl" />
      </div>

      <div className="container mx-auto px-4 pt-24 md:pt-32 pb-16 relative z-10">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-sage-light/50 border border-primary/20 mb-8">
              <span className="w-2 h-2 rounded-full bg-primary animate-pulse-soft" />
              <span className="text-sm font-medium text-primary">
                Start preserving your family legacy today
              </span>
            </div>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="font-display text-4xl md:text-6xl lg:text-7xl font-bold text-foreground leading-tight mb-6"
          >
            Where Every
            <span className="block gradient-text">Family Story</span>
            Comes to Life
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed"
          >
            Create beautiful, interactive family trees. Invite relatives to collaborate, 
            share photos, and never miss a birthday with shared calendars.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12"
          >
            <Link to="/signup">
              <Button variant="hero" size="xl" className="w-full sm:w-auto group">
                Start Your Tree
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
            <Link to="/features">
              <Button variant="heroOutline" size="xl" className="w-full sm:w-auto">
                See How It Works
              </Button>
            </Link>
          </motion.div>

          {/* Feature pills */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="flex flex-wrap items-center justify-center gap-4"
          >
            {features.map((feature, index) => (
              <div
                key={index}
                className="flex items-center gap-2 px-4 py-2 rounded-full bg-card border border-border shadow-soft"
              >
                <feature.icon className="w-4 h-4 text-primary" />
                <span className="text-sm font-medium text-foreground">
                  {feature.label}
                </span>
              </div>
            ))}
          </motion.div>
        </div>

        {/* Hero Image/Illustration placeholder */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.5 }}
          className="mt-16 md:mt-24 max-w-5xl mx-auto"
        >
          <div className="relative rounded-2xl overflow-hidden shadow-large border border-border/50">
            <div className="aspect-[16/9] bg-gradient-card flex items-center justify-center">
              {/* Tree visualization preview */}
              <div className="relative w-full h-full p-8">
                <svg className="w-full h-full" viewBox="0 0 800 400">
                  {/* Connection lines */}
                  <path d="M400 100 L400 160" className="tree-connector" />
                  <path d="M400 200 L250 200 L250 260" className="tree-connector" />
                  <path d="M400 200 L550 200 L550 260" className="tree-connector" />
                  <path d="M250 300 L150 300 L150 340" className="tree-connector" />
                  <path d="M250 300 L350 300 L350 340" className="tree-connector" />
                  <path d="M550 300 L450 300 L450 340" className="tree-connector" />
                  <path d="M550 300 L650 300 L650 340" className="tree-connector" />
                  
                  {/* Nodes */}
                  <g className="tree-node-group">
                    <rect x="340" y="40" width="120" height="60" rx="12" className="fill-card stroke-primary/30 stroke-2" />
                    <text x="400" y="75" textAnchor="middle" className="fill-foreground text-sm font-medium">Grandparents</text>
                  </g>
                  
                  <g className="tree-node-group">
                    <rect x="190" y="160" width="120" height="60" rx="12" className="fill-card stroke-primary/30 stroke-2" />
                    <text x="250" y="195" textAnchor="middle" className="fill-foreground text-sm font-medium">Parents</text>
                  </g>
                  
                  <g className="tree-node-group">
                    <rect x="490" y="160" width="120" height="60" rx="12" className="fill-card stroke-primary/30 stroke-2" />
                    <text x="550" y="195" textAnchor="middle" className="fill-foreground text-sm font-medium">Aunt & Uncle</text>
                  </g>
                  
                  <g className="tree-node-group">
                    <rect x="90" y="280" width="120" height="60" rx="12" className="fill-sage-light stroke-primary stroke-2" />
                    <text x="150" y="315" textAnchor="middle" className="fill-primary text-sm font-medium">You</text>
                  </g>
                  
                  <g className="tree-node-group">
                    <rect x="290" y="280" width="120" height="60" rx="12" className="fill-card stroke-primary/30 stroke-2" />
                    <text x="350" y="315" textAnchor="middle" className="fill-foreground text-sm font-medium">Sibling</text>
                  </g>
                  
                  <g className="tree-node-group">
                    <rect x="390" y="280" width="120" height="60" rx="12" className="fill-card stroke-primary/30 stroke-2" />
                    <text x="450" y="315" textAnchor="middle" className="fill-foreground text-sm font-medium">Cousin</text>
                  </g>
                  
                  <g className="tree-node-group">
                    <rect x="590" y="280" width="120" height="60" rx="12" className="fill-card stroke-primary/30 stroke-2" />
                    <text x="650" y="315" textAnchor="middle" className="fill-foreground text-sm font-medium">Cousin</text>
                  </g>
                </svg>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
