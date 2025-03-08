"use client";
import React from "react";
import Link from "next/link";

interface TopicsCardProps {
  topic: string;
  imageUrl: string;
}

const TopicsCard: React.FC<TopicsCardProps> = ({ topic, imageUrl }) => {
  return (
    <Link href={`/Recording-Page?topic=${encodeURIComponent(topic)}`}>
      <div className="group cursor-pointer transition-transform duration-300 hover:scale-105">
        <div className="flex flex-col bg-gray-800 border border-gray-700 rounded-xl overflow-hidden shadow-xl w-80 h-96">
          {/* Increased image container to 3/4 of the card height */}
          <div className="w-full h-3/4">
            <img
              src={imageUrl}
              alt={topic}
              className="w-full h-full object-cover"
            />
          </div>
          {/* Reduced text container with smaller text */}
          <div className="flex items-center justify-center p-4 h-1/4">
            <h3 className="text-2xl font-bold text-white text-center break-words">
              {topic}
            </h3>
          </div>
        </div>
      </div>
    </Link>
  );
};

export default TopicsCard;
