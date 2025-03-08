"use client";
import React from "react";
import Link from "next/link";
import { Mic, BookOpen, BarChart3, UserCircle, Sparkles, MessagesSquare } from "lucide-react";
const HeroSection: React.FC = () => {
return (
<header className="fixed top-0 left-0 right-0 z-50">
 {/* Navigation Bar */}
<div className="bg-black p-4 shadow-md">
<div className="flex items-center justify-between w-full">
 {/* Logo & Brand */}
<Link href="/" className="flex items-center gap-3 text-white text-2xl font-bold hover:opacity-90 transition">
<Sparkles className="h-8 w-8 text-purple-400" />
<span className="tracking-wider">VOCA</span>
</Link>
 {/* Navigation Links */}
<div className="flex items-center gap-6 text-white">
<Link href="/topics-page" className="flex items-center gap-2 hover:text-purple-300 transition">
<BookOpen className="h-5 w-5" />
<span className="font-medium">Topics</span>
</Link>
<Link href="/Recording-Page?topic=Self%20Introduction" className="flex items-center gap-2 hover:text-purple-300 transition">
<Mic className="h-5 w-5" />
<span className="font-medium">Practice</span>
</Link>
<Link href="/debate-page" className="flex items-center gap-2 hover:text-purple-300 transition">
<MessagesSquare className="h-5 w-5" />
<span className="font-medium">Debate</span>
</Link>
<Link href="/report-page" className="flex items-center gap-2 hover:text-purple-300 transition">
<BarChart3 className="h-5 w-5" />
<span className="font-medium">Reports</span>
</Link>
 {/* Profile Icon */}
<Link href="/profile">
<UserCircle className="h-6 w-6 text-white hover:text-purple-300 transition" />
</Link>
</div>
</div>
</div>
</header>
 );
};
export default HeroSection;