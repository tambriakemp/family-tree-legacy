import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Plus, TreeDeciduous, Users, Calendar, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { Header } from "@/components/layout/Header";

const Dashboard = () => {
  const { user, isLoading, signOut } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isLoading && !user) {
      navigate("/login");
    }
  }, [user, isLoading, navigate]);

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header isAuthenticated={true} />
      
      <main className="container mx-auto px-4 pt-24 pb-12">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="font-display text-3xl font-bold text-foreground mb-2">
              Welcome back{user?.user_metadata?.full_name ? `, ${user.user_metadata.full_name}` : ""}!
            </h1>
            <p className="text-muted-foreground">Manage your family trees</p>
          </div>
          <Button variant="ghost" onClick={handleSignOut}>
            <LogOut className="w-4 h-4 mr-2" />
            Sign Out
          </Button>
        </div>

        {/* Create Tree Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          <Link to="/trees/new" className="group">
            <div className="h-48 rounded-2xl border-2 border-dashed border-primary/30 bg-sage-light/20 flex flex-col items-center justify-center gap-4 hover:border-primary hover:bg-sage-light/40 transition-all cursor-pointer">
              <div className="w-14 h-14 rounded-xl bg-gradient-sage flex items-center justify-center shadow-soft group-hover:shadow-glow transition-shadow">
                <Plus className="w-7 h-7 text-primary-foreground" />
              </div>
              <span className="font-medium text-primary">Create New Tree</span>
            </div>
          </Link>

          {/* Demo Tree Card */}
          <div className="h-48 rounded-2xl border border-border bg-card shadow-soft p-6 flex flex-col justify-between card-hover">
            <div className="flex items-start justify-between">
              <div className="w-12 h-12 rounded-xl bg-sage-light flex items-center justify-center">
                <TreeDeciduous className="w-6 h-6 text-primary" />
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Users className="w-4 h-4" />
                <span>12 members</span>
              </div>
            </div>
            <div>
              <h3 className="font-display text-lg font-semibold text-foreground mb-1">
                Smith Family Tree
              </h3>
              <p className="text-sm text-muted-foreground">Last updated 2 days ago</p>
            </div>
          </div>
        </motion.div>

        {/* Subscription Status */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mt-12 p-6 rounded-2xl bg-gradient-hero border border-border"
        >
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div>
              <h3 className="font-display text-xl font-semibold text-foreground mb-1">
                Free Trial
              </h3>
              <p className="text-muted-foreground">
                Upgrade to unlock unlimited trees and collaborators
              </p>
            </div>
            <Button variant="hero">Upgrade to Pro - $6/mo</Button>
          </div>
        </motion.div>
      </main>
    </div>
  );
};

export default Dashboard;
