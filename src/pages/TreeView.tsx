import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Plus, ZoomIn, ZoomOut, Users } from "lucide-react";
import { Button } from "@/components/ui/button";

const TreeView = () => {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 glass-heavy border-b border-border">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link to="/dashboard">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
            </Link>
            <h1 className="font-display text-lg font-semibold">Smith Family Tree</h1>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm">
              <Users className="w-4 h-4 mr-2" />
              Invite
            </Button>
            <Button variant="default" size="sm">
              <Plus className="w-4 h-4 mr-2" />
              Add Person
            </Button>
          </div>
        </div>
      </header>

      {/* Tree Canvas */}
      <main className="pt-16 h-screen overflow-hidden">
        <div className="relative w-full h-full bg-gradient-hero">
          {/* Zoom controls */}
          <div className="absolute bottom-6 right-6 flex flex-col gap-2 z-10">
            <Button variant="outline" size="icon" className="bg-card shadow-soft">
              <ZoomIn className="w-4 h-4" />
            </Button>
            <Button variant="outline" size="icon" className="bg-card shadow-soft">
              <ZoomOut className="w-4 h-4" />
            </Button>
          </div>

          {/* Tree Visualization */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full h-full flex items-center justify-center p-8"
          >
            <svg className="w-full max-w-4xl h-auto" viewBox="0 0 800 500">
              {/* Connection lines */}
              <path d="M400 120 L400 180" className="tree-connector" strokeWidth="3" />
              <path d="M400 220 L250 220 L250 280" className="tree-connector" strokeWidth="3" />
              <path d="M400 220 L550 220 L550 280" className="tree-connector" strokeWidth="3" />
              <path d="M250 360 L150 360 L150 420" className="tree-connector" strokeWidth="3" />
              <path d="M250 360 L350 360 L350 420" className="tree-connector" strokeWidth="3" />

              {/* Person nodes */}
              <g className="cursor-pointer hover:opacity-90 transition-opacity">
                <rect x="325" y="40" width="150" height="80" rx="16" className="fill-card stroke-primary stroke-2 shadow-lg" />
                <circle cx="370" cy="80" r="20" className="fill-sage-light" />
                <text x="405" y="75" className="fill-foreground text-sm font-medium">Robert Smith</text>
                <text x="405" y="95" className="fill-muted-foreground text-xs">1945 - 2020</text>
              </g>

              <g className="cursor-pointer hover:opacity-90 transition-opacity">
                <rect x="175" y="180" width="150" height="80" rx="16" className="fill-card stroke-primary/50 stroke-2" />
                <circle cx="220" cy="220" r="20" className="fill-sage-light" />
                <text x="255" y="215" className="fill-foreground text-sm font-medium">John Smith</text>
                <text x="255" y="235" className="fill-muted-foreground text-xs">1970 - present</text>
              </g>

              <g className="cursor-pointer hover:opacity-90 transition-opacity">
                <rect x="475" y="180" width="150" height="80" rx="16" className="fill-card stroke-primary/50 stroke-2" />
                <circle cx="520" cy="220" r="20" className="fill-sage-light" />
                <text x="555" y="215" className="fill-foreground text-sm font-medium">Mary Johnson</text>
                <text x="555" y="235" className="fill-muted-foreground text-xs">1972 - present</text>
              </g>

              <g className="cursor-pointer hover:opacity-90 transition-opacity">
                <rect x="75" y="320" width="150" height="80" rx="16" className="fill-sage-light stroke-primary stroke-2" />
                <circle cx="120" cy="360" r="20" className="fill-primary/20" />
                <text x="155" y="355" className="fill-primary text-sm font-semibold">You</text>
                <text x="155" y="375" className="fill-primary/70 text-xs">1995 - present</text>
              </g>

              <g className="cursor-pointer hover:opacity-90 transition-opacity">
                <rect x="275" y="320" width="150" height="80" rx="16" className="fill-card stroke-primary/50 stroke-2" />
                <circle cx="320" cy="360" r="20" className="fill-sage-light" />
                <text x="355" y="355" className="fill-foreground text-sm font-medium">Emily Smith</text>
                <text x="355" y="375" className="fill-muted-foreground text-xs">1998 - present</text>
              </g>
            </svg>
          </motion.div>
        </div>
      </main>
    </div>
  );
};

export default TreeView;
