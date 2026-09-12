import { useEffect, useRef } from "react";

const TAU = Math.PI * 2;

function createParticles(width, height, count) {
  let seed = 5489;
  const random = () => {
    seed = (seed * 16807) % 2147483647;
    return (seed - 1) / 2147483646;
  };

  return Array.from({ length: count }, () => ({
    x: random() * width,
    y: random() * height,
    radius: random() * 1.15 + 0.18,
    alpha: random() * 0.34 + 0.05,
    drift: random() * 0.09 + 0.015,
    phase: random() * TAU,
  }));
}

function drawRibbon(ctx, width, height, time, config) {
  const {
    startX,
    startY,
    control1,
    control2,
    endX,
    endY,
    phase,
    intensity,
  } = config;

  ctx.save();
  ctx.globalCompositeOperation = "screen";

  for (let i = 0; i < 28; i += 1) {
    const spread = (i - 13.5) * 5.4;
    const wave = Math.sin(time * 0.00022 + phase + i * 0.14) * 18;
    const opacity = (1 - Math.abs(i - 13.5) / 15) * intensity;

    ctx.beginPath();
    ctx.moveTo(startX * width, startY * height + spread);
    ctx.bezierCurveTo(
      control1[0] * width,
      control1[1] * height + spread * 0.35 + wave,
      control2[0] * width,
      control2[1] * height - spread * 0.45 - wave,
      endX * width,
      endY * height + spread * 0.2,
    );
    ctx.strokeStyle = `rgba(232, 237, 244, ${Math.max(0, opacity)})`;
    ctx.lineWidth = i % 7 === 0 ? 1.35 : 0.52;
    ctx.shadowColor = "rgba(232, 237, 244, 0.78)";
    ctx.shadowBlur = 9 + opacity * 70;
    ctx.stroke();
  }

  ctx.restore();
}

export default function LiquidBackdrop() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d", { alpha: false });
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let frame = 0;
    let particles = [];
    let width = 0;
    let height = 0;
    let dpr = 1;

    const resize = () => {
      const bounds = canvas.getBoundingClientRect();
      width = Math.max(1, bounds.width);
      height = Math.max(1, bounds.height);
      dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      particles = createParticles(width, height, width < 720 ? 90 : 240);
    };

    const render = (time = 0) => {
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.fillStyle = "#030304";
      ctx.fillRect(0, 0, width, height);

      const haze = ctx.createRadialGradient(
        width * 0.5,
        height * 0.52,
        0,
        width * 0.5,
        height * 0.52,
        Math.max(width, height) * 0.66,
      );
      haze.addColorStop(0, "rgba(50, 54, 60, 0.2)");
      haze.addColorStop(0.46, "rgba(12, 13, 15, 0.16)");
      haze.addColorStop(1, "rgba(0, 0, 0, 0)");
      ctx.fillStyle = haze;
      ctx.fillRect(0, 0, width, height);

      particles.forEach((particle) => {
        const pulse = 0.72 + Math.sin(time * 0.00045 + particle.phase) * 0.28;
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.radius, 0, TAU);
        ctx.fillStyle = `rgba(225, 230, 238, ${particle.alpha * pulse})`;
        ctx.fill();

        if (!reduceMotion) {
          particle.x += particle.drift;
          if (particle.x > width + 2) particle.x = -2;
        }
      });

      drawRibbon(ctx, width, height, time, {
        startX: -0.08,
        startY: 0.78,
        control1: [0.17, 0.38],
        control2: [0.44, 0.48],
        endX: 1.08,
        endY: 0.18,
        phase: 0.2,
        intensity: width < 720 ? 0.22 : 0.12,
      });

      drawRibbon(ctx, width, height, time, {
        startX: 0.08,
        startY: 1.02,
        control1: [0.28, 0.58],
        control2: [0.7, 0.38],
        endX: 1.04,
        endY: 0.62,
        phase: 2.4,
        intensity: width < 720 ? 0.15 : 0.078,
      });

      if (width < 720) {
        drawRibbon(ctx, width, height, time, {
          startX: -0.16,
          startY: 0.26,
          control1: [0.2, 0.08],
          control2: [0.72, 0.7],
          endX: 1.14,
          endY: 0.5,
          phase: 4.1,
          intensity: 0.11,
        });
      }

      if (!reduceMotion) frame = window.requestAnimationFrame(render);
    };

    const handleVisibility = () => {
      if (document.hidden) {
        window.cancelAnimationFrame(frame);
      } else if (!reduceMotion) {
        frame = window.requestAnimationFrame(render);
      }
    };

    resize();
    render();
    window.addEventListener("resize", resize);
    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener("resize", resize);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, []);

  return <canvas ref={canvasRef} className="liquid-backdrop" aria-hidden="true" />;
}
