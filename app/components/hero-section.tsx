"use client"

import React from "react"
import Link from "next/link"
import { Diamond, BookOpen, ClipboardList, User } from "lucide-react"

const HeroSection: React.FC = () => {
  return (
    <nav className="bg-[#0a0a0e] p-4 flex justify-between items-center shadow-lg">
      {/* Logo & Brand */}
      <Link href="/" className="flex items-center gap-2 text-white text-xl font-bold hover:opacity-80 transition">
        <Diamond className="h-7 w-7 text-purple-500" /> 
        VOCA
      </Link>
      
      {/* Navigation Links */}
      <div className="flex items-center space-x-6 text-white">
        <Link href="/topics-page" className="flex items-center gap-1 hover:text-purple-400 transition">
          <BookOpen className="h-5 w-5" /> Topics
        </Link>
        
        <Link href="/report-page" className="flex items-center gap-1 hover:text-red-400 transition">
          <ClipboardList className="h-5 w-5" /> Report
        </Link>
        
        {/* Profile Icon */}
        <Link href="/profile" className="hover:opacity-80 transition">
          <User className="h-6 w-6 text-white" />
        </Link>
      </div>
    </nav>
  )
}

export default HeroSection