'use client';

import { useCallback, useRef, useState } from 'react';
import { getAccent, type MentorMetadata } from '@/lib/mentors/metadata';

interface Props {
  mentor: MentorMetadata;
  percentage: number;
  insightSlap: string;
  secondaryMentor?: { name: string; percentage: number } | null;
}

/**
 * Instagram Story boyutunda (1080x1920) paylaşım kartı oluşturur.
 * Canvas API ile render edilir, PNG olarak indirilir.
 */
export function StoryCard({ mentor, percentage, insightSlap, secondaryMentor }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [generating, setGenerating] = useState(false);

  const generate = useCallback(async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    setGenerating(true);

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const W = 1080;
    const H = 1920;
    canvas.width = W;
    canvas.height = H;

    const accent = getAccent(mentor.accentColor);

    // --- Background ---
    const bgGrad = ctx.createLinearGradient(0, 0, W * 0.3, H);
    bgGrad.addColorStop(0, '#070b14');
    bgGrad.addColorStop(0.4, '#0c1220');
    bgGrad.addColorStop(0.7, '#0f1528');
    bgGrad.addColorStop(1, '#0a1018');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, W, H);

    // --- Subtle radial glow ---
    const glow = ctx.createRadialGradient(W / 2, H * 0.35, 0, W / 2, H * 0.35, 500);
    glow.addColorStop(0, accent.hex + '15');
    glow.addColorStop(1, 'transparent');
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, W, H);

    // --- Portrait image ---
    try {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = () => reject();
        img.src = mentor.portraitUrl;
      });

      // Draw portrait in upper area with gradient fade
      const imgH = 800;
      const imgW = W;
      ctx.save();
      ctx.globalAlpha = 0.35;
      ctx.drawImage(img, 0, 100, imgW, imgH);
      ctx.globalAlpha = 1;

      // Fade overlay
      const fadeGrad = ctx.createLinearGradient(0, 100, 0, 100 + imgH);
      fadeGrad.addColorStop(0, 'rgba(7,11,20,0.3)');
      fadeGrad.addColorStop(0.6, 'rgba(7,11,20,0.7)');
      fadeGrad.addColorStop(1, 'rgba(7,11,20,1)');
      ctx.fillStyle = fadeGrad;
      ctx.fillRect(0, 100, imgW, imgH);
      ctx.restore();
    } catch {
      // Portrait yüklenemezse devam et
    }

    // --- Logo (text) ---
    ctx.font = '500 28px Outfit, system-ui, sans-serif';
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';
    ctx.fillText('mentor', W / 2 - 22, 80);
    ctx.fillStyle = accent.hex;
    ctx.fillText('iva', W / 2 + 42, 80);

    // --- "Zihninin Mimarı" title ---
    ctx.font = '600 42px Playfair Display, Georgia, serif';
    ctx.fillStyle = 'rgba(255,255,255,0.4)';
    ctx.textAlign = 'center';
    ctx.fillText('Zihninin Mimarı', W / 2, 680);

    // --- Mentor name ---
    ctx.font = '700 72px Playfair Display, Georgia, serif';
    ctx.fillStyle = accent.hex;
    ctx.fillText(mentor.name, W / 2, 780);

    // --- Title ---
    ctx.font = '500 24px Outfit, system-ui, sans-serif';
    ctx.fillStyle = 'rgba(255,255,255,0.35)';
    ctx.fillText(mentor.title.toUpperCase(), W / 2, 830);

    // --- Percentage ---
    ctx.font = '700 140px Playfair Display, Georgia, serif';
    ctx.fillStyle = accent.hex;
    ctx.fillText(`%${percentage}`, W / 2, 1020);

    // --- Secondary mentor ---
    if (secondaryMentor && secondaryMentor.percentage >= 15) {
      ctx.font = '400 26px Outfit, system-ui, sans-serif';
      ctx.fillStyle = 'rgba(255,255,255,0.3)';
      ctx.fillText(
        `Gölge mentor: ${secondaryMentor.name} %${secondaryMentor.percentage}`,
        W / 2,
        1080,
      );
    }

    // --- Divider ---
    ctx.strokeStyle = accent.hex + '30';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(W * 0.2, 1140);
    ctx.lineTo(W * 0.8, 1140);
    ctx.stroke();

    // --- Insight slap ---
    ctx.font = 'italic 600 36px Playfair Display, Georgia, serif';
    ctx.fillStyle = accent.hex;
    ctx.textAlign = 'center';

    // Word wrap for slap
    const slapWords = insightSlap.split(' ');
    const slapLines: string[] = [];
    let currentLine = '';
    for (const word of slapWords) {
      const testLine = currentLine ? `${currentLine} ${word}` : word;
      if (ctx.measureText(testLine).width > W * 0.75) {
        slapLines.push(currentLine);
        currentLine = word;
      } else {
        currentLine = testLine;
      }
    }
    if (currentLine) slapLines.push(currentLine);

    const slapStartY = 1220;
    ctx.fillText('"', W / 2 - ctx.measureText(slapLines[0] ?? '').width / 2 - 20, slapStartY);
    slapLines.forEach((line, i) => {
      ctx.fillText(line, W / 2, slapStartY + i * 52);
    });
    ctx.fillText('"', W / 2 + ctx.measureText(slapLines[slapLines.length - 1] ?? '').width / 2 + 20, slapStartY + (slapLines.length - 1) * 52);

    // --- CTA ---
    ctx.font = '500 28px Outfit, system-ui, sans-serif';
    ctx.fillStyle = 'rgba(255,255,255,0.25)';
    ctx.fillText('Sen kiminle yönetiliyorsun?', W / 2, 1520);

    // --- URL ---
    ctx.font = '500 32px Outfit, system-ui, sans-serif';
    ctx.fillStyle = accent.hex;
    ctx.fillText('mentoriva.com/test', W / 2, 1580);

    // --- Bottom bar ---
    ctx.fillStyle = accent.hex + '08';
    ctx.fillRect(0, H - 120, W, 120);
    ctx.fillStyle = 'rgba(255,255,255,0.15)';
    ctx.font = '400 20px Outfit, system-ui, sans-serif';
    ctx.fillText('Düşüncenin pusula olduğu yer', W / 2, H - 55);

    // --- Download ---
    const link = document.createElement('a');
    link.download = `mentoriva-${mentor.id}-sonuc.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();

    setGenerating(false);
  }, [mentor, percentage, insightSlap, secondaryMentor]);

  return (
    <div className="space-y-3">
      <button
        onClick={generate}
        disabled={generating}
        className="btn-primary w-full text-sm"
      >
        {generating ? 'Oluşturuluyor...' : 'Story kartı indir (1080x1920)'}
      </button>
      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
}
