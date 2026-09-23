import React, { useEffect, useRef } from "react";

function NetworkBackground() {
    const canvasRef = useRef(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext("2d");
        let w, h, nodes, animationId;

        const INK = [26, 26, 46];
        const EMBER = [255, 107, 53];
        const LINK_DIST = 170;

        function resize() {
            w = canvas.width = window.innerWidth;
            h = canvas.height = window.innerHeight;
        }

        function initNodes() {
            const count = Math.max(28, Math.floor((w * h) / 42000));
            nodes = Array.from({ length: count }, () => ({
                x: Math.random() * w,
                y: Math.random() * h,
                vx: (Math.random() - 0.5) * 0.25,
                vy: (Math.random() - 0.5) * 0.25,
                r: Math.random() * 1.8 + 1,
                ember: Math.random() < 0.22,
            }));
        }

        function handleResize() {
            resize();
            initNodes();
        }

        resize();
        initNodes();
        window.addEventListener("resize", handleResize);

        function step() {
            ctx.clearRect(0, 0, w, h);

            for (const n of nodes) {
                n.x += n.vx;
                n.y += n.vy;
                if (n.x < -20) n.x = w + 20;
                if (n.x > w + 20) n.x = -20;
                if (n.y < -20) n.y = h + 20;
                if (n.y > h + 20) n.y = -20;
            }

            for (let i = 0; i < nodes.length; i++) {
                for (let j = i + 1; j < nodes.length; j++) {
                    const a = nodes[i], b = nodes[j];
                    const dx = a.x - b.x, dy = a.y - b.y;
                    const dist = Math.sqrt(dx * dx + dy * dy);
                    if (dist < LINK_DIST) {
                        const alpha = (1 - dist / LINK_DIST) * 0.22;
                        const c = a.ember || b.ember ? EMBER : INK;
                        ctx.strokeStyle = `rgba(${c[0]},${c[1]},${c[2]},${alpha})`;
                        ctx.lineWidth = 1;
                        ctx.beginPath();
                        ctx.moveTo(a.x, a.y);
                        ctx.lineTo(b.x, b.y);
                        ctx.stroke();
                    }
                }
            }

            for (const n of nodes) {
                const c = n.ember ? EMBER : INK;
                ctx.beginPath();
                ctx.arc(n.x, n.y, n.r, 0, Math.PI * 2);
                ctx.fillStyle = `rgba(${c[0]},${c[1]},${c[2]},0.5)`;
                ctx.fill();
            }

            animationId = requestAnimationFrame(step);
        }
        step();

        return () => {
            window.removeEventListener("resize", handleResize);
            cancelAnimationFrame(animationId);
        };
    }, []);

    return <canvas id="mesh" ref={canvasRef}></canvas>;
}

export default NetworkBackground;