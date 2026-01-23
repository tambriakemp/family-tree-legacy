import { motion } from "framer-motion";
import { 
  TreeDeciduous, 
  Users, 
  Calendar, 
  Camera, 
  Share2, 
  Shield,
  Sparkles,
  Heart
} from "lucide-react";

const features = [
  {
    icon: TreeDeciduous,
    title: "Interactive Family Trees",
    description: "Build beautiful, zoomable family trees with drag-and-drop simplicity. See your entire heritage at a glance.",
    color: "bg-sage-light text-primary",
  },
  {
    icon: Users,
    title: "Collaborative Building",
    description: "Invite family members to contribute. Everyone can add photos, stories, and connections to grow your tree together.",
    color: "bg-amber-light/50 text-amber-dark",
  },
  {
    icon: Calendar,
    title: "Shared Family Calendar",
    description: "Never miss a birthday again. Automatic birthday reminders plus custom family events everyone can see.",
    color: "bg-sage-light text-primary",
  },
  {
    icon: Camera,
    title: "Photo Galleries",
    description: "Upload and tag photos to family members. Build a visual history that tells your family's story.",
    color: "bg-amber-light/50 text-amber-dark",
  },
  {
    icon: Share2,
    title: "Easy Sharing",
    description: "Invite relatives via email with customizable permission levels. Control who can view or edit your tree.",
    color: "bg-sage-light text-primary",
  },
  {
    icon: Shield,
    title: "Private & Secure",
    description: "Your family data is encrypted and secure. Choose exactly who can access your family information.",
    color: "bg-amber-light/50 text-amber-dark",
  },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5 },
  },
};

export function FeaturesSection() {
  return (
    <section className="py-24 md:py-32 bg-card">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-sage-light/50 border border-primary/20 mb-6">
            <Sparkles className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium text-primary">
              Everything you need
            </span>
          </div>
          <h2 className="font-display text-3xl md:text-5xl font-bold text-foreground mb-4">
            Features Your Family Will Love
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            From building your tree to celebrating milestones together, FamilyFlow has everything 
            you need to preserve and share your family's legacy.
          </p>
        </motion.div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8"
        >
          {features.map((feature, index) => (
            <motion.div
              key={index}
              variants={itemVariants}
              className="group p-6 md:p-8 rounded-2xl bg-background border border-border hover:border-primary/30 transition-all duration-300 hover:shadow-medium"
            >
              <div className={`w-12 h-12 rounded-xl ${feature.color} flex items-center justify-center mb-5 group-hover:scale-110 transition-transform duration-300`}>
                <feature.icon className="w-6 h-6" />
              </div>
              <h3 className="font-display text-xl font-semibold text-foreground mb-3">
                {feature.title}
              </h3>
              <p className="text-muted-foreground leading-relaxed">
                {feature.description}
              </p>
            </motion.div>
          ))}
        </motion.div>

        {/* Social proof */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="mt-20 text-center"
        >
          <div className="inline-flex items-center gap-3 px-6 py-3 rounded-full bg-background border border-border shadow-soft">
            <div className="flex -space-x-2">
              {[1, 2, 3, 4, 5].map((i) => (
                <div
                  key={i}
                  className="w-8 h-8 rounded-full bg-sage-light border-2 border-background flex items-center justify-center"
                >
                  <span className="text-xs font-medium text-primary">
                    {String.fromCharCode(64 + i)}
                  </span>
                </div>
              ))}
            </div>
            <div className="flex items-center gap-1 text-sm">
              <Heart className="w-4 h-4 text-terracotta fill-terracotta" />
              <span className="font-medium text-foreground">10,000+</span>
              <span className="text-muted-foreground">families trust FamilyFlow</span>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
