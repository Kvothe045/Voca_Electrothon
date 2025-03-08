"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import HeroSection from "./components/hero-section";
import { useRouter } from "next/navigation";

export default function VocaLandingPage() {
  const router = useRouter();
  const [wordOfTheDay, setWordOfTheDay] = useState("Eloquent");
  const [wordMeaning, setWordMeaning] = useState("Fluent or persuasive in speaking or writing");
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const correctAnswer = "option2";
  const [isScrolled, setIsScrolled] = useState(false);
  const [activeTopic, setActiveTopic] = useState(0);
  const [showAnimation, setShowAnimation] = useState(false);
  const debateRef = useRef(null);

  // Function to navigate to pages
  const navigateToTopics = () => {
    router.push("/topics-page");
  };

  const navigateToDebate = () => {
    router.push("/debate-page");
  };

  // Scroll to debate section
  const scrollToDebate = () => {
    debateRef.current?.scrollIntoView({ behavior: 'smooth' });
    setTimeout(() => setShowAnimation(true), 500);
    setTimeout(() => setShowAnimation(false), 3000);
  };

  // Words of the day rotation
  const words = [
    { word: "Eloquent", meaning: "Fluent or persuasive in speaking or writing" },
    { word: "Ameliorate", meaning: "Make something better" },
    { word: "Serendipity", meaning: "The occurrence of fortunate discoveries by accident" },
    { word: "Ubiquitous", meaning: "Present, appearing, or found everywhere" },
    { word: "Rhetorical", meaning: "Relating to or concerned with the art of rhetoric" },
    { word: "Articulate", meaning: "Having or showing the ability to speak fluently and coherently" },
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      const randomIndex = Math.floor(Math.random() * words.length);
      setWordOfTheDay(words[randomIndex].word);
      setWordMeaning(words[randomIndex].meaning);
    }, 7000);
    
    // Track scrolling for sticky button
    const handleScroll = () => {
      if (window.scrollY > 300) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };
    
    window.addEventListener('scroll', handleScroll);
    
    // Rotate through debate topics
    const topicInterval = setInterval(() => {
      setActiveTopic(prev => (prev + 1) % debateTopics.length);
    }, 4000);
    
    return () => {
      clearInterval(interval);
      clearInterval(topicInterval);
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  // Testimonials data
  const testimonials = [
    { 
      name: "Rohit Sharma", 
      role: "Marketing Executive",
      text: "VOCA has transformed my presentation skills. My confidence has soared in client meetings!",
      avatar: "👨‍💼"
    },
    { 
      name: "Abhirup Adhikari", 
      role: "Graduate Student",
      text: "As a non-native speaker, VOCA helped me perfect my pronunciation and expand my vocabulary.",
      avatar: "👩‍🎓"
    },
    { 
      name: "Rahul Patel", 
      role: "Software Engineer",
      text: "The real-time feedback during my technical interviews was invaluable. Highly recommend!",
      avatar: "👨‍💻"
    },
  ];

  // How to use steps
  const steps = [
    { 
      title: "Record",
      description: "Speak into your device or upload an audio file",
      icon: "🎤"
    },
    { 
      title: "Analyze", 
      description: "Our AI evaluates your speech patterns and grammar",
      icon: "🔍"
    },
    { 
      title: "Review",
      description: "Get detailed feedback on areas for improvement",
      icon: "📝"
    },
    { 
      title: "Improve",
      description: "Practice with our exercises tailored to your needs",
      icon: "🚀"
    }
  ];

  // Debate topics data with rich details
  const debateTopics = [
    {
      title: "AI Regulation & Ethics",
      description: "Explore the balance between innovation and safety in AI development",
      stats: "87% engagement rate",
      icon: "🤖",
      bgClass: "from-indigo-900/40 to-purple-900/40"
    },
    {
      title: "Climate Change Solutions",
      description: "Discuss practical approaches to the most pressing environmental challenges",
      stats: "92% completion rate",
      icon: "🌍",
      bgClass: "from-purple-900/40 to-pink-900/40"
    },
    {
      title: "Future of Education",
      description: "Debate how digital transformation is reshaping learning worldwide",
      stats: "76% user growth",
      icon: "🎓",
      bgClass: "from-blue-900/40 to-indigo-900/40"
    },
    {
      title: "Social Media Impact",
      description: "Examine the benefits and drawbacks of our connected digital lives",
      stats: "81% return users",
      icon: "📱",
      bgClass: "from-violet-900/40 to-purple-900/40"
    }
  ];

  // Features for the debate platform
  const debateFeatures = [
    {
      title: "AI-Powered Feedback",
      description: "Receive real-time analysis of your argument structure, logical fallacies, and persuasive techniques"
    },
    {
      title: "Structured Format",
      description: "Practice with professional debate formats including Oxford, Lincoln-Douglas, and Cross-Examination"
    },
    {
      title: "Global Community",
      description: "Connect with debate partners from around the world and across different expertise levels"
    }
  ];

  // Stats for visual impact
  const debateStats = [
    { number: "500+", label: "Debate Topics" },
    { number: "24/7", label: "Practice Access" },
    { number: "85%", label: "Skill Improvement" }
  ];

  return (
    <div className="min-h-screen bg-[#0a0a0e] text-white overflow-x-hidden">
      {/* Floating Navigation Dots */}
      <div className="fixed right-8 top-1/2 -translate-y-1/2 z-50 hidden md:flex flex-col gap-3">
        {['home', 'about', 'debate', 'practice', 'community', 'start'].map((section, i) => (
          <div 
            key={section}
            className={`w-3 h-3 rounded-full cursor-pointer transition-all duration-300 hover:w-4 hover:h-4 ${i === 2 ? 'bg-purple-500' : 'bg-gray-500'}`}
            onClick={() => i === 2 && scrollToDebate()}
          />
        ))}
      </div>
      
      {/* Sticky Free Trial Button */}
      {isScrolled && (
        <div className="fixed top-4 right-4 z-50 animate-bounceIn">
          <Button 
            className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white px-6 py-2 text-lg rounded-xl shadow-lg transform transition-all duration-300 hover:scale-105"
            onClick={navigateToTopics}
          >
            Start Free Trial
          </Button>
        </div>
      )}
      
      <main className="container mx-auto px-6 md:px-12">
        {/* Hero Section */}
        <HeroSection />

        {/* About VOCA Section */}
        <section className="py-24 flex flex-col md:flex-row items-center gap-16 bg-gradient-to-r from-gray-900 to-black rounded-2xl shadow-2xl px-8 my-16 border border-purple-500/20">
          <div className="md:w-1/2 text-center md:text-left">
            <h2 className="text-5xl font-bold mb-6 text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-500">VOCA</h2>
            <p className="text-xl text-gray-300 leading-relaxed">
              VOCA is an advanced AI-powered tool that enhances your communication skills by analyzing speech patterns, tone, facial expressions, and grammatical accuracy. It provides real-time feedback to help you improve effortlessly.
            </p>
            <div className="flex flex-wrap gap-4 mt-8">
              <Button 
                className="bg-purple-600 hover:bg-purple-700 text-white px-8 py-6 text-lg rounded-xl shadow-lg transform transition-all duration-300 hover:scale-105"
                onClick={navigateToTopics}
              >
                Start Trial
              </Button>
              <Button 
                className="bg-transparent border-2 border-purple-500 text-purple-400 hover:bg-purple-900/20 px-8 py-6 text-lg rounded-xl shadow-lg transform transition-all duration-300 hover:scale-105"
                onClick={scrollToDebate}
              >
                Explore Debate
              </Button>
            </div>
          </div>
          <div className="md:w-1/2 flex justify-center">
            <div className="relative w-full max-w-md">
              <div className="absolute -inset-2 rounded-2xl bg-gradient-to-r from-purple-600 to-pink-600 opacity-75 blur-lg animate-pulse-slow"></div>
              <img 
                src="/images/girl-speaking.png" 
                alt="Girl Speaking" 
                className="relative w-full rounded-2xl shadow-2xl object-cover aspect-[4/3] transition-transform duration-500 hover:scale-105" 
              />
            </div>
          </div>
        </section>

        {/* Debate Section */}
        <section ref={debateRef} className="pt-20 pb-16 rounded-2xl shadow-2xl my-16 border border-purple-500/20 overflow-hidden">
          <div className="px-8 max-w-7xl mx-auto">
            <h2 className="text-5xl font-bold mb-4 text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 inline-block">
              Master the Art of Debate
            </h2>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto mb-12">
              Elevate your critical thinking and persuasive skills with our AI-powered debate platform. 
              Perfect for students, professionals, and anyone looking to articulate ideas with clarity and conviction.
            </p>
            
            {/* Two column layout */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              {/* Left column: Interactive topic carousel */}
              <div className="rounded-2xl overflow-hidden">
                <div className="relative h-96 p-1 bg-gradient-to-r from-indigo-500/20 via-purple-500/20 to-pink-500/20 rounded-2xl overflow-hidden">
                  {debateTopics.map((topic, index) => (
                    <div 
                      key={index}
                      className={`absolute inset-0 bg-gradient-to-br ${topic.bgClass} rounded-2xl p-8 flex flex-col transition-all duration-700 ease-in-out ${index === activeTopic ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-full'}`}
                    >
                      <div className="flex items-center gap-4 mb-4">
                        <span className="text-4xl">{topic.icon}</span>
                        <h3 className="text-2xl font-bold">{topic.title}</h3>
                      </div>
                      <p className="text-gray-300 mb-6 text-lg">{topic.description}</p>
                      <div className="mt-auto">
                        <div className="bg-black/30 rounded-xl p-4 mb-6">
                          <p className="text-purple-300 font-medium">{topic.stats}</p>
                        </div>
                        <Button 
                          className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white py-4 text-lg rounded-xl shadow-lg transform transition-all duration-300 hover:scale-105"
                          onClick={navigateToDebate}
                        >
                          Join This Debate
                        </Button>
                      </div>
                    </div>
                  ))}
                  
                  {/* Navigation dots */}
                  <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex gap-2">
                    {debateTopics.map((_, index) => (
                      <button 
                        key={index} 
                        className={`w-3 h-3 rounded-full transition-all duration-300 ${activeTopic === index ? 'bg-white w-6' : 'bg-gray-600'}`}
                        onClick={() => setActiveTopic(index)}
                      />
                    ))}
                  </div>
                </div>
              </div>
              
              {/* Right column: Features and stats */}
              <div className="space-y-8">
                {/* Feature list */}
                <div className="space-y-6">
                  {debateFeatures.map((feature, index) => (
                    <div key={index} className="bg-black/30 p-6 rounded-xl border border-purple-500/20 transform transition-all duration-300 hover:scale-102 hover:border-purple-500/40">
                      <h4 className="text-xl font-semibold mb-2 text-purple-300">{feature.title}</h4>
                      <p className="text-gray-300">{feature.description}</p>
                    </div>
                  ))}
                </div>
                
                {/* Stats row */}
                <div className="grid grid-cols-3 gap-4 mt-8">
                  {debateStats.map((stat, index) => (
                    <div key={index} className="text-center p-4 bg-black/40 rounded-xl border border-purple-500/20">
                      <div className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400 mb-1">{stat.number}</div>
                      <div className="text-gray-400 text-sm">{stat.label}</div>
                    </div>
                  ))}
                </div>
                
                {/* Action button */}
                <div className="mt-8">
                  <Button 
                    className="w-full bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 hover:from-indigo-700 hover:via-purple-700 hover:to-pink-700 text-white py-6 text-xl rounded-xl shadow-lg transform transition-all duration-300 hover:scale-105 relative group overflow-hidden"
                    onClick={navigateToDebate}
                  >
                    <span className="relative z-10">Start Debating Now</span>
                    <span className="absolute inset-0 bg-gradient-to-r from-pink-600 via-purple-600 to-indigo-600 opacity-0 group-hover:opacity-100 transition-opacity duration-500 ease-in-out"></span>
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Word Mastery Section */}
        <section className="py-16 text-center rounded-2xl shadow-2xl my-16 border border-purple-500/20">
          <h2 className="text-3xl font-bold mb-10 text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-500">Vocabulary Mastery</h2>
          <div className="max-w-4xl mx-auto px-4">
            <div className="bg-black/40 rounded-2xl p-8 border border-purple-500/30 relative group">
              <div className="animate-pulse-slow mb-6">
                <p className="text-5xl text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400 font-bold relative inline-block">
                  {wordOfTheDay}
                </p>
              </div>
              <div className="bg-gray-900/80 rounded-xl p-4 transform transition-all duration-500 max-w-lg mx-auto">
                <p className="text-lg text-gray-300">{wordMeaning}</p>
              </div>
              <div className="mt-8 grid grid-cols-2 gap-4">
                <div className="bg-black/50 rounded-xl p-4 text-left border border-purple-500/20">
                  <p className="text-sm text-gray-400">Example in conversation:</p>
                  <p className="text-md text-gray-200 italic">"{wordOfTheDay === 'Eloquent' ? 'Her eloquent speech moved the entire audience.' : 'The technology became ubiquitous in less than a decade.'}"</p>
                </div>
                <div className="bg-black/50 rounded-xl p-4 text-left border border-purple-500/20">
                  <p className="text-sm text-gray-400">Related words:</p>
                  <p className="text-md text-gray-200">
                    {wordOfTheDay === 'Eloquent' ? 'Articulate, Fluent, Expressive' : 
                     wordOfTheDay === 'Ameliorate' ? 'Improve, Enhance, Upgrade' :
                     wordOfTheDay === 'Serendipity' ? 'Chance, Fortune, Luck' : 
                     'Omnipresent, Pervasive, Universal'}
                  </p>
                </div>
              </div>
            </div>
            <div className="flex justify-center mt-8 gap-4">
              <Button className="bg-purple-600 hover:bg-purple-700 text-white rounded-xl">
                Next Word
              </Button>
              <Button className="bg-transparent border border-purple-500 text-purple-400 hover:bg-purple-900/20 rounded-xl">
                Add to Flashcards
              </Button>
            </div>
          </div>
        </section>

        {/* Grammar Quiz Section */}
        <section className="py-16 text-center my-16">
          <h2 className="text-3xl font-bold mb-8 text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-500">Test Your Grammar</h2>
          <div className="max-w-lg mx-auto bg-gradient-to-br from-gray-800 to-gray-900 p-8 rounded-2xl shadow-2xl border border-purple-500/20 transition-transform duration-300 hover:scale-102">
            <div className="flex justify-between items-center mb-6">
              <span className="text-purple-400 font-medium">Question 1/5</span>
              <span className="text-gray-400">Basic Level</span>
            </div>
            
            <p className="text-xl mb-8 text-gray-200">She always _____ her homework before dinner.</p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[
                { option: "forgets", value: "option1" },
                { option: "completes", value: "option2" },
                { option: "skipping", value: "option3" },
              ].map(({ option, value }) => (
                <div
                  key={value}
                  className="transition-transform duration-200 hover:scale-105"
                >
                  <Button
                    className={`w-full py-3 text-lg rounded-xl ${
                      selectedAnswer === value 
                        ? (value === correctAnswer 
                          ? "bg-green-600 hover:bg-green-700" 
                          : "bg-red-600 hover:bg-red-700") 
                        : "bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800"}`}
                    onClick={() => setSelectedAnswer(value)}
                  >
                    {option}
                  </Button>
                </div>
              ))}
            </div>
            {selectedAnswer && (
              <div className="animate-fadeIn">
                <p className="text-xl mt-6 font-medium">
                  {selectedAnswer === correctAnswer 
                    ? "✅ Correct! You have a good understanding of verb usage." 
                    : "❌ Incorrect. The correct answer is 'completes'. Try again!"}
                </p>
              </div>
            )}
            
            {/* Progress bar */}
            <div className="mt-8 bg-gray-700 rounded-full h-2 overflow-hidden">
              <div className="bg-gradient-to-r from-purple-500 to-pink-500 h-2 w-1/5 rounded-full"></div>
            </div>
            
            {/* Skip and next buttons */}
            <div className="flex justify-between mt-6">
              <Button 
                variant="outline" 
                className="border border-gray-600 text-gray-400 hover:bg-gray-800"
              >
                Skip
              </Button>
              <Button 
                className={`bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white ${!selectedAnswer && 'opacity-50 cursor-not-allowed'}`}
                disabled={!selectedAnswer}
              >
                Next Question
              </Button>
            </div>
          </div>
        </section>

        {/* Testimonials Section */}
        <section className="py-16 text-center rounded-2xl shadow-2xl my-16 border border-purple-500/20">
          <h2 className="text-3xl font-bold mb-12 text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-500">What Our Users Say</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 px-4">
            {testimonials.map((testimonial, index) => (
              <div
                key={index}
                className="transform perspective-1000 transition-all duration-500 hover:scale-105 hover:-translate-y-2 hover:rotate-y-5"
              >
                <Card className="p-6 bg-gradient-to-br from-black/90 to-gray-900/90 backdrop-blur-sm border border-purple-700/50 rounded-xl shadow-2xl h-full flex flex-col">
                  <div className="flex items-center mb-6">
                    <div className="w-14 h-14 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-2xl">
                      {testimonial.avatar}
                    </div>
                    <div className="ml-4 text-left">
                      <p className="font-bold text-purple-400">{testimonial.name}</p>
                      <p className="text-gray-400 text-sm">{testimonial.role}</p>
                    </div>
                  </div>
                  <p className="text-lg flex-grow text-left">{testimonial.text}</p>
                  <div className="mt-4 flex">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <span key={star} className="text-yellow-400 text-xl">★</span>
                    ))}
                  </div>
                </Card>
              </div>
            ))}
          </div>
        </section>

        {/* How to Use the App Section */}
        <section className="py-16 text-center my-16">
          <h2 className="text-3xl font-bold mb-12 text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-500">How to Use VOCA</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {steps.map((step, index) => (
              <div
                key={index}
                className="group transition-all duration-500 hover:scale-105 hover:-translate-y-2"
              >
                <div className="p-8 bg-gradient-to-br from-gray-800 to-gray-900 border border-purple-500/20 rounded-xl text-white shadow-xl h-full flex flex-col items-center relative overflow-hidden">
                  {/* Step number indicator */}
                  <div className="absolute top-3 right-3 w-8 h-8 rounded-full bg-purple-800/50 flex items-center justify-center text-xs font-bold">
                    {index + 1}
                  </div>
                  
                  {/* Icon with highlight effect */}
                  <div className="text-5xl mb-4 relative">
                    <div className="absolute -inset-4 bg-purple-500/20 rounded-full blur-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    <span className="relative">{step.icon}</span>
                  </div>
                  
                  <h3 className="text-xl font-bold mb-3 text-purple-400">{step.title}</h3>
                  <p className="text-gray-300">{step.description}</p>
                  
                  {/* Animated arrow */}
                  {index < steps.length - 1 && (
                    <div className="absolute -right-4 top-1/2 transform -translate-y-1/2 text-2xl text-purple-500/70 hidden md:block">
                      →
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
          <Button 
            className="mt-12 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white px-10 py-6 text-lg rounded-xl shadow-lg transform transition-all duration-300 hover:scale-105"
            onClick={navigateToTopics}
          >
            Get Started with VOCA
          </Button>
        </section>

        {/* Call To Action - Final Section */}
        <section className="py-20 text-center my-16 relative">
          <div className="absolute inset-0 bg-gradient-to-br from-purple-900/30 to-pink-900/30 rounded-2xl"></div>
          <div className="relative z-10">
            <h2 className="text-4xl font-bold mb-6 text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-500">
              Start Your Communication Journey Today
            </h2>
            <p className="text-xl text-gray-300 max-w-2xl mx-auto mb-10">
              Join thousands of users who have transformed their communication skills with VOCA's AI-powered platform.
            </p>
            <Button 
              className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white px-12 py-8 text-2xl rounded-xl shadow-2xl transform transition-all duration-300 hover:scale-105"
              onClick={navigateToTopics}
            >
              Begin Your Free Trial
            </Button>
            <p className="mt-6 text-gray-400">No credit card required • 14-day free trial • Cancel anytime</p>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-black/50 border-t border-purple-500/20 py-12 mt-24">
        <div className="container mx-auto px-6 md:px-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <h3 className="text-xl font-bold mb-4 text-purple-400">VOCA</h3>
              <p className="text-gray-400">Revolutionizing language learning and communication skills with AI</p>
            </div>
            <div>
              <h4 className="text-lg font-semibold mb-4 text-gray-300">Features</h4>
              <ul className="space-y-2 text-gray-500">
                <li>Speech Analysis</li>
                <li>Debate Practice</li>
                <li>Vocabulary Building</li>
                <li>Grammar Assistance</li>
              </ul>
            </div>
            <div>
              <h4 className="text-lg font-semibold mb-4 text-gray-300">Resources</h4>
              <ul className="space-y-2 text-gray-500">
                <li>Help Center</li>
                <li>Blog</li>
                <li>Community</li>
                <li>Contact Support</li>
              </ul>
            </div>
            <div>
              <h4 className="text-lg font-semibold mb-4 text-gray-300">Legal</h4>
              <ul className="space-y-2 text-gray-500">
                <li>Privacy Policy</li>
                <li>Terms of Service</li>
                <li>Cookie Policy</li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 flex flex-col md:flex-row justify-between items-center">
            <p className="text-gray-500">© 2025 VOCA. All rights reserved.</p>
            <div className="flex space-x-6 mt-4 md:mt-0">
              {/* Social media icons would go here */}
              <span className="text-gray-500 cursor-pointer">Facebook</span>
              <span className="text-gray-500 cursor-pointer">Twitter</span>
              <span className="text-gray-500 cursor-pointer">Instagram</span>
              <span className="text-gray-500 cursor-pointer">LinkedIn</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}