"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { ArrowRight, Play } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { APP_TAGLINE } from "@/lib/constants";
import { STATS } from "@/lib/landing-data";

export function HeroSection() {
  return (
    <section className="relative overflow-hidden">
      <div className="hero-glow absolute inset-0 -z-10" />
      <div className="grid-pattern absolute inset-0 -z-10 opacity-40" />

      <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 sm:py-28 lg:px-8 lg:py-32">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mx-auto max-w-3xl text-center"
        >
          <Badge variant="secondary" className="mb-6">
            🚀 Now with LangGraph Workflows
          </Badge>

          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
            Automate Your Business with{" "}
            <span className="gradient-text">Intelligent AI Agents</span>
          </h1>

          <p className="mt-6 text-lg text-muted-foreground sm:text-xl">{APP_TAGLINE}</p>

          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Button size="xl" asChild>
              <Link href="/signup">
                Start Free Trial
                <ArrowRight className="ml-1" />
              </Link>
            </Button>
            <Button size="xl" variant="outline" asChild>
              <Link href="/contact">
                <Play className="mr-1 h-4 w-4" />
                Book Demo
              </Link>
            </Button>
          </div>

          <p className="mt-4 text-sm text-muted-foreground">
            No credit card required · 14-day free trial · Cancel anytime
          </p>
        </motion.div>

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="mx-auto mt-16 grid max-w-4xl grid-cols-2 gap-8 sm:grid-cols-4"
        >
          {STATS.map((stat) => (
            <div key={stat.label} className="text-center">
              <div className="text-3xl font-bold text-primary sm:text-4xl">{stat.value}</div>
              <div className="mt-1 text-sm text-muted-foreground">{stat.label}</div>
            </div>
          ))}
        </motion.div>

        {/* Dashboard preview mockup */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.4 }}
          className="relative mx-auto mt-16 max-w-5xl"
        >
          <div className="rounded-xl border bg-card p-2 shadow-2xl shadow-primary/10">
            <div className="rounded-lg bg-muted/50 p-4">
              <div className="flex items-center gap-2 border-b border-border pb-4">
                <div className="h-3 w-3 rounded-full bg-red-400" />
                <div className="h-3 w-3 rounded-full bg-yellow-400" />
                <div className="h-3 w-3 rounded-full bg-green-400" />
                <span className="ml-4 text-xs text-muted-foreground">AI Automation Dashboard</span>
              </div>
              <div className="mt-4 grid gap-4 sm:grid-cols-3">
                {["Voice Agent", "Chat Agent", "Calling Agent"].map((agent) => (
                  <div
                    key={agent}
                    className="rounded-lg border bg-background p-4 transition-shadow hover:shadow-md"
                  >
                    <div className="mb-2 h-2 w-16 rounded-full bg-primary/20" />
                    <div className="text-sm font-medium">{agent}</div>
                    <div className="mt-2 h-1.5 w-full rounded-full bg-muted">
                      <div className="h-full w-3/4 rounded-full bg-primary" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
