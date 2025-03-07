"use client";
import React from "react";
import Link from "next/link";

interface TopicsCardProps {
  topic: string;
  imageUrl: string;
}

const TopicsCard: React.FC<TopicsCardProps> = ({ topic, imageUrl }) => {
  return (
    <Link href={`/recording?topic=${encodeURIComponent(topic)}`}>
      <div className="group cursor-pointer transform transition-all duration-300 hover:scale-105 hover:shadow-2xl bg-gradient-to-r from-purple-500 to-blue-500 rounded-xl p-2">
        <div className="bg-white rounded-xl overflow-hidden">
          <div className="relative h-64 w-full">
            <img
              src={imageUrl}
              alt={topic}
              className="object-cover w-full h-full transition-transform duration-300 group-hover:scale-110"
            />
            <div className="absolute inset-0 bg-black opacity-0 group-hover:opacity-20 transition-opacity"></div>
          </div>
          <div className="p-6">
            <h3 className="text-2xl font-bold text-gray-800 text-center transition-colors duration-300 group-hover:text-blue-600">
              {topic}
            </h3>
          </div>
        </div>
      </div>
    </Link>
  );
};

export default TopicsCard;
