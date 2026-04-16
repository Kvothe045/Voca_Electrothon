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

  // 1. Check if user is already logged in for this session
  useEffect(() => {
    if (sessionStorage.getItem("oa_demo_auth") === "true") {
      setAuthorized(true);
    }
  }, []);

  // 2. Handle the Google OAuth Response
  const handleCredentialResponse = (response: any) => {
    if (response.credential) {
      sessionStorage.setItem("oa_demo_auth", "true");
      setAuthorized(true);
    }
  };

  // 3. Initialize Google Login Button
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
            { theme: "filled_blue", size: "large", text: "signin_with" }
          );
        }
      };

      // Delay slightly to ensure script is fully ready
      const timer = setTimeout(initGoogle, 1000);
      return () => clearTimeout(timer);
    }
  }, [authorized]);

  return (
    <html lang="en">
      <head>
        <title>Voca Demo | Electrothon</title>
        <meta name="description" content="Authorized Access Only" />
        <Script 
          src="https://accounts.google.com/gsi/client" 
          strategy="beforeInteractive" 
        />
      </head>
      <body>
        {!authorized ? (
          /* The "Bouncer" Overlay */
          <div style={{
            height: '100vh', 
            width: '100vw', 
            display: 'flex', 
            flexDirection: 'column', 
            alignItems: 'center', 
            justifyContent: 'center',
            backgroundColor: '#000', 
            color: '#fff', 
            position: 'fixed', 
            top: 0, 
            left: 0, 
            zIndex: 9999,
            textAlign: 'center',
            padding: '20px'
          }}>
            <h2 style={{ marginBottom: '10px', fontSize: '24px', fontWeight: 'bold' }}>
              Voca- Vocal Optimisation & Communication Analyser
            </h2>
            <p style={{ marginBottom: '30px', color: '#888', maxWidth: '400px' }}>
              Please sign in with Google to view the project.
            </p>
            <div id="google_btn"></div>
          </div>
        ) : (
          /* The Actual App */
          <>
            {children}
            <Analytics />
          </>
        )}
      </body>
    </html>
  );
}



give a better UI/UX modern
in this single file edit itself
