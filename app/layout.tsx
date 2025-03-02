import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { updateLastActive, clearKeysIfTimedOut, migrateExistingKeys, resetAllApiKeys } from '@/utils/apiKeyEncryption';

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Multi-Chat Interface",
  description: "Chat with multiple AI models simultaneously",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Initialize session timeout on client side
  if (typeof window !== 'undefined') {
    // Check for reset flag in URL
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.has('reset_keys')) {
      resetAllApiKeys();
      // Remove the parameter from URL
      urlParams.delete('reset_keys');
      const newUrl = window.location.pathname + (urlParams.toString() ? '?' + urlParams.toString() : '');
      window.history.replaceState({}, '', newUrl);
    }
    
    // Migrate existing keys to new encryption format
    migrateExistingKeys();
    
    // Check for session timeout and clear keys if needed
    clearKeysIfTimedOut();
    
    // Update last active timestamp
    updateLastActive();
    
    // Add event listeners to update last active timestamp
    window.addEventListener('click', updateLastActive);
    window.addEventListener('keypress', updateLastActive);
    window.addEventListener('scroll', updateLastActive);
    window.addEventListener('mousemove', updateLastActive);
  }
  
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable}`}>
        {children}
      </body>
    </html>
  )
}
