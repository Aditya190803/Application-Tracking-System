'use client'

import React from 'react'

export const BackgroundAnimation = () => {
  return (
    <div className="fixed inset-0 -z-10 overflow-hidden bg-[#f8fafc]">
      {/* Base Grid Pattern */}
      <div className="absolute inset-0 mesh-grid opacity-30" />
      
      {/* Primary Gradient Orbs - Subtle Slate/Blue */}
      <div className="absolute top-[-20%] left-[-10%] h-[600px] w-[600px] rounded-full bg-secondary/40 animate-pulse-glow" />
      <div className="absolute top-[10%] right-[-15%] h-[700px] w-[700px] rounded-full bg-muted/30 animate-pulse-glow" style={{ animationDelay: '-2s' }} />
      <div className="absolute bottom-[-20%] left-[20%] h-[500px] w-[500px] rounded-full bg-secondary/20 animate-pulse-glow" style={{ animationDelay: '-4s' }} />
      
      {/* Secondary Floating Orbs */}
      <div className="absolute top-[40%] left-[10%] h-[200px] w-[200px] rounded-full bg-muted/10 blur-[80px] animate-float" />
      <div className="absolute top-[60%] right-[20%] h-[250px] w-[250px] rounded-full bg-secondary/10 blur-[80px] animate-float-delayed" />
      
      {/* Accent Lines */}
      <div className="absolute top-0 left-[20%] w-px h-[40%] bg-gradient-to-b from-transparent via-secondary/40 to-transparent" />
      <div className="absolute top-[30%] right-[30%] w-px h-[50%] bg-gradient-to-b from-transparent via-secondary/30 to-transparent" />
      
      {/* Corner Gradients */}
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-gradient-to-bl from-background/10 via-transparent to-transparent" />
      
      {/* Noise Texture Overlay */}
      <div 
        className="absolute inset-0 opacity-[0.02] pointer-events-none mix-blend-multiply"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
        }}
      />
    </div>
  )
}
