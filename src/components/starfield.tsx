'use client';

import React, { useEffect, useRef } from 'react';

interface Star {
    x: number;
    y: number;
    z: number;
    pz: number;
}

export function Starfield() {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        let width = 0;
        let height = 0;
        let stars: Star[] = [];
        let animationFrameId: number;

        const initStars = () => {
            width = window.innerWidth;
            height = window.innerHeight;
            canvas.width = width;
            canvas.height = height;

            stars = Array.from({ length: 800 }, () => ({
                x: Math.random() * width - width / 2,
                y: Math.random() * height - height / 2,
                z: Math.random() * width,
                pz: 0,
            }));
        };

        const update = () => {
            // Clear with trail effect
            ctx.fillStyle = "rgba(10, 10, 15, 0.4)";
            ctx.fillRect(0, 0, width, height);

            const cx = width / 2;
            const cy = height / 2;
            const speed = 0.5; // Slower, more premium feel

            stars.forEach((star) => {
                star.z -= speed;

                if (star.z <= 0) {
                    star.z = width;
                    star.x = Math.random() * width - width / 2;
                    star.y = Math.random() * height - height / 2;
                    star.pz = width;
                }

                const x = (star.x / star.z) * width + cx;
                const y = (star.y / star.z) * height + cy;

                const size = (1 - star.z / width) * 2; // Subtle star size

                ctx.fillStyle = "rgba(255, 255, 255, 0.8)";
                ctx.beginPath();
                ctx.arc(x, y, size, 0, Math.PI * 2);
                ctx.fill();

                star.pz = star.z;
            });

            animationFrameId = requestAnimationFrame(update);
        };

        initStars();
        update();

        const handleResize = () => initStars();
        window.addEventListener('resize', handleResize);

        return () => {
            cancelAnimationFrame(animationFrameId);
            window.removeEventListener('resize', handleResize);
        };
    }, []);

    return (
        <canvas
            ref={canvasRef}
            className="fixed inset-0 z-0 pointer-events-none"
            style={{ background: '#0a0a0f' }}
        />
    );
}
