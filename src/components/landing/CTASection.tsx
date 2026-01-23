import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { ArrowRight, TreeDeciduous } from "lucide-react";
import { Button } from "@/components/ui/button";

export function CTASection() {
  return (
    <section className="py-24 md:py-32 bg-gradient-hero relative overflow-hidden">
      {/* Decorative elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-0 left-1/4 w-64 h-64 bg-sage-light/30 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-80 h-80 bg-amber-light/20 rounded-full blur-3xl" />
      </div>

      <div className="container mx-auto px-4 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="max-w-3xl mx-auto text-center"
        >
          <div className="w-16 h-16 rounded-2xl bg-gradient-sage flex items-center justify-center mx-auto mb-8 shadow-glow">
            <TreeDeciduous className="w-8 h-8 text-primary-foreground" />
          </div>

          <h2 className="font-display text-3xl md:text-5xl font-bold text-foreground mb-6">
            Ready to Build Your
            <span className="block gradient-text">Family Legacy?</span>
          </h2>

          <p className="text-lg text-muted-foreground mb-10 max-w-xl mx-auto">
            Join thousands of families preserving their stories. Start your free trial today 
            and bring your family closer together.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link to="/signup">
              <Button variant="hero" size="xl" className="w-full sm:w-auto group">
                Start Your Free Trial
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
            <Link to="/features">
              <Button variant="heroOutline" size="xl" className="w-full sm:w-auto">
                Learn More
              </Button>
            </Link>
          </div>

          <p className="text-sm text-muted-foreground mt-6">
            No credit card required • 14-day free trial • Cancel anytime
          </p>
        </motion.div>
      </div>
    </section>
  );
}
