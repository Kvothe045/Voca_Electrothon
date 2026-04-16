'use client';

import { useState, useEffect } from "react";
import { Analytics } from '@vercel/analytics/next';
import Script from "next/script";
import './globals.css';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [authorized, setAuthorized] = useState(false);
  const [isScriptLoaded, setIsScriptLoaded] = useState(false);

  useEffect(() => {
    if (sessionStorage.getItem("oa_demo_auth") === "true") {
      setAuthorized(true);
    }
  }, []);

  const handleCredentialResponse = (response: any) => {
    if (response.credential) {
      sessionStorage.setItem("oa_demo_auth", "true");
      setAuthorized(true);
    }
  };

  useEffect(() => {
    if (!authorized && typeof window !== "undefined") {
      const initGoogle = () => {
        if ((window as any).google) {
          (window as any).google.accounts.id.initialize({
            client_id: "1051843740052-muvp11nh1327gmbq64dlmbn15foj8no4.apps.googleusercontent.com",
            callback: handleCredentialResponse,
          });
          (window as any).google.accounts.id.renderButton(
            document.getElementById("google_btn"),
            { 
              theme: "outline", 
              size: "large", 
              shape: "pill",
              width: "280" 
            }
          );
          setIsScriptLoaded(true);
        }
      };

      const timer = setTimeout(initGoogle, 1000);
      return () => clearTimeout(timer);
    }
  }, [authorized]);

  return (
    <html lang="en">
      <head>
        <title>Voca | Communication Analyser</title>
        <Script 
          src="https://accounts.google.com/gsi/client" 
          strategy="beforeInteractive" 
        />
        <style>{`
          @keyframes fadeIn {
            from { opacity: 0; transform: translateY(10px); }
            to { opacity: 1; transform: translateY(0); }
          }
          .animate-fade { animation: fadeIn 0.8s ease-out forwards; }
          .bg-spotlight {
            background: radial-gradient(circle at 50% 50%, #1e293b 0%, #020617 100%);
            min-height: 100vh;
          }
        `}</style>
      </head>
      <body className="bg-spotlight">
        {!authorized ? (
          <div style={{
            height: '100vh', width: '100vw', display: 'flex', alignItems: 'center', justifyContent: 'center',
            position: 'fixed', top: 0, left: 0, zIndex: 9999, overflow: 'hidden'
          }}>
            <div className="animate-fade" style={{
              background: 'rgba(255, 255, 255, 0.03)',
              backdropFilter: 'blur(16px)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              padding: '48px 32px',
              borderRadius: '24px',
              textAlign: 'center',
              maxWidth: '450px',
              width: '90%',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
            }}>
              <div style={{
                width: '64px', height: '64px', background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                borderRadius: '16px', margin: '0 auto 24px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '24px', fontWeight: 'bold', color: 'white', boxShadow: '0 0 20px rgba(37, 99, 235, 0.4)'
              }}>
                V
              </div>

              <h1 style={{ 
                color: '#f8fafc', fontSize: '28px', fontWeight: '800', marginBottom: '12px', 
                letterSpacing: '-0.025em', lineHeight: '1.2' 
              }}>
                Voca Analyser
              </h1>
              
              <p style={{ color: '#94a3b8', fontSize: '15px', marginBottom: '32px', lineHeight: '1.6' }}>
                Vocal Optimisation & Communication Analyser.<br />
                <span style={{ color: '#64748b' }}>Authorized access for Electrothon Demo.</span>
              </p>

              <div style={{ 
                display: 'flex', justifyContent: 'center', minHeight: '44px'
              }}>
                <div id="google_btn" style={{ opacity: isScriptLoaded ? 1 : 0, transition: 'opacity 0.5s ease' }}></div>
              </div>
            </div>

            <div style={{ position: 'absolute', bottom: '24px', color: '#475569', fontSize: '12px', letterSpacing: '0.05em' }}>
              POWERED BY VOCA AI • 2026
            </div>
          </div>
        ) : (
          <>
            {children}
            <Analytics />
          </>
        )}
      </body>
    </html>
  );
}
