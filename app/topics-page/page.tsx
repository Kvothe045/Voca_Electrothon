"use client";
import React from "react";
import { motion } from "framer-motion";
import TopicsCard from "../components/topics-card";
import Header from "../components/hero-section";
import Footer from "../components/footer";

const topics = [
  { topic: "Time Management", imageUrl: "/self.jpg" },
  { topic: "Social Media: Boon or Bane?", imageUrl: "/self.jpg" },
  { topic: "Why is failure important for success", imageUrl: "/self.jpg" },
  { topic: "The role of human humour in daily life", imageUrl: "/self.jpg" },
  { topic: "Degree equals success?", imageUrl: "/self.jpg" },
  { topic: "Self Confidence", imageUrl: "/self.jpg" },
  { topic: "Solo Travelling", imageUrl: "/self.jpg" },
  { topic: "Internet and human interactions", imageUrl: "/self.jpg" },
  { topic: "AI: Boon or Bane", imageUrl: "/self.jpg" },
  { topic: "Lonely vs Alone", imageUrl: "/self.jpg" },
];

const TopicsPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-800 via-gray-900 to-black text-white">
      <Header />
      
      <main className="container mx-auto pt-20 px-4 pb-12">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-12"
        >
          <h1 className="text-4xl font-bold text-center mb-3">Choose Your Topic</h1>
          <p className="text-center text-gray-300 max-w-2xl mx-auto">
            Select a topic below to practice your speaking skills and receive detailed feedback.
          </p>
        </motion.div>
        
        {/* Responsive grid layout for the cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {topics.map((item, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="transform hover:translate-x-2 transition-transform duration-300"
            >
              <TopicsCard topic={item.topic.trim()} imageUrl={item.imageUrl} />
            </motion.div>
          ))}
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default TopicsPage;
