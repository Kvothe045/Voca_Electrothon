"use client";
import React from "react";
import TopicsCard from "../components/topics-card";
import Header from "../components/hero-section"; // Ensure you have your Header component

const topics = [
  { topic: "Topic 1", imageUrl: "https://via.placeholder.com/500x400?text=Topic+1" },
  { topic: "Topic 2", imageUrl: "https://via.placeholder.com/500x400?text=Topic+2" },
  { topic: "Topic 3", imageUrl: "https://via.placeholder.com/500x400?text=Topic+3" },
  { topic: "Topic 4", imageUrl: "https://via.placeholder.com/500x400?text=Topic+4" },
  { topic: "Topic 5", imageUrl: "https://via.placeholder.com/500x400?text=Topic+5" },
  { topic: "Topic 6", imageUrl: "https://via.placeholder.com/500x400?text=Topic+6" },
  { topic: "Topic 7", imageUrl: "https://via.placeholder.com/500x400?text=Topic+7" },
  { topic: "Topic 8", imageUrl: "https://via.placeholder.com/500x400?text=Topic+8" },
  { topic: "Topic 9", imageUrl: "https://via.placeholder.com/500x400?text=Topic+9" },
  { topic: "Topic 10", imageUrl: "https://via.placeholder.com/500x400?text=Topic+10" },
];

const TopicsPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-black text-white">
      <Header />
      <main className="container mx-auto pt-24 px-4 pb-8">
        <h1 className="text-4xl font-bold text-center mb-12">Choose Your Topic</h1>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
          {topics.map((item, index) => (
            <TopicsCard key={index} topic={item.topic} imageUrl={item.imageUrl} />
          ))}
        </div>
      </main>
    </div>
  );
};

export default TopicsPage;
