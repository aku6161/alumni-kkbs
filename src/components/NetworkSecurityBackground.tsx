import React, { useEffect, useRef } from 'react';

export const NetworkSecurityBackground: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    // Mouse tracker
    let mouse = {
      x: width / 2,
      y: height / 2,
      targetX: width / 2,
      targetY: height / 2,
      isHovered: false,
    };

    const handleMouseMove = (e: MouseEvent) => {
      mouse.targetX = e.clientX;
      mouse.targetY = e.clientY;
      mouse.isHovered = true;
    };

    const handleMouseLeave = () => {
      mouse.isHovered = false;
      mouse.targetX = width / 2;
      mouse.targetY = height / 2;
    };

    const handleResize = () => {
      if (!canvas) return;
      const dpr = window.devicePixelRatio || 1;
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.scale(dpr, dpr);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseleave', handleMouseLeave);
    window.addEventListener('resize', handleResize);
    handleResize();

    // Node & Particle Configuration
    const NODE_COUNT = Math.min(Math.floor((width * height) / 14000), 85);
    const MAX_DISTANCE = 140;

    interface Node {
      x: number;
      y: number;
      z: number;
      vx: number;
      vy: number;
      radius: number;
      baseRadius: number;
      color: string;
      pulse: number;
      pulseSpeed: number;
    }

    interface Packet {
      fromIndex: number;
      toIndex: number;
      progress: number;
      speed: number;
      color: string;
    }

    interface FloatingCode {
      text: string;
      x: number;
      y: number;
      speed: number;
      opacity: number;
      size: number;
    }

    const colorPalette = [
      'rgba(0, 242, 254, ', // Cyan
      'rgba(56, 189, 248, ', // Sky Blue
      'rgba(99, 102, 241, ', // Indigo
      'rgba(14, 165, 233, ', // Electric Blue
      'rgba(168, 85, 247, ', // Purple
    ];

    const nodes: Node[] = [];
    for (let i = 0; i < NODE_COUNT; i++) {
      nodes.push({
        x: Math.random() * width,
        y: Math.random() * height,
        z: Math.random() * 0.8 + 0.2,
        vx: (Math.random() - 0.5) * 0.7,
        vy: (Math.random() - 0.5) * 0.7,
        radius: Math.random() * 2.5 + 1.5,
        baseRadius: Math.random() * 2.5 + 1.5,
        color: colorPalette[Math.floor(Math.random() * colorPalette.length)],
        pulse: Math.random() * Math.PI * 2,
        pulseSpeed: 0.03 + Math.random() * 0.04,
      });
    }

    // Data packets travelling between nodes
    const packets: Packet[] = [];
    const createPacket = () => {
      if (nodes.length < 2) return;
      const from = Math.floor(Math.random() * nodes.length);
      let to = Math.floor(Math.random() * nodes.length);
      let attempts = 0;
      while (to === from && attempts < 10) {
        to = Math.floor(Math.random() * nodes.length);
        attempts++;
      }
      const dx = nodes[from].x - nodes[to].x;
      const dy = nodes[from].y - nodes[to].y;
      if (Math.hypot(dx, dy) < MAX_DISTANCE * 1.5) {
        packets.push({
          fromIndex: from,
          toIndex: to,
          progress: 0,
          speed: 0.015 + Math.random() * 0.02,
          color: Math.random() > 0.4 ? '#00f2fe' : '#38bdf8',
        });
      }
    };

    // Hex and Binary strings floating
    const codeTexts = [
      '01011001', '0x7F4A', 'SEC:OK', 'AES-256', 'AUTH_GRANTED',
      '11001010', '0x3E9B', 'PORT_443', 'SYS_LOCK', 'KEY_VALID',
      '01100011', '0xFA12', 'NODE_SYNC', 'SHA-512', 'FIREWALL_ON',
      '10110100', '0x00FF', 'TLS_v1.3', 'IP_PROTECT', 'ENCRYPT_256'
    ];
    const floatingCodes: FloatingCode[] = [];
    for (let i = 0; i < 20; i++) {
      floatingCodes.push({
        text: codeTexts[Math.floor(Math.random() * codeTexts.length)],
        x: Math.random() * width,
        y: Math.random() * height,
        speed: 0.2 + Math.random() * 0.4,
        opacity: 0.15 + Math.random() * 0.35,
        size: 9 + Math.random() * 3,
      });
    }

    let scanLineY = 0;
    let lockAngle = 0;
    let ringAngle1 = 0;
    let ringAngle2 = 0;
    let ringAngle3 = 0;
    let time = 0;

    const render = () => {
      time += 0.016;

      // Smooth mouse interpolation for parallax
      mouse.x += (mouse.targetX - mouse.x) * 0.05;
      mouse.y += (mouse.targetY - mouse.y) * 0.05;

      const mouseOffsetX = (mouse.x - width / 2) * 0.04;
      const mouseOffsetY = (mouse.y - height / 2) * 0.04;

      // 1. Deep Cyber Dark Background Gradient
      ctx.fillStyle = '#030712';
      ctx.fillRect(0, 0, width, height);

      // Radial ambient cyber glows
      const bgGlow1 = ctx.createRadialGradient(
        width * 0.5 + mouseOffsetX * 1.5,
        height * 0.5 + mouseOffsetY * 1.5,
        10,
        width * 0.5,
        height * 0.5,
        Math.max(width, height) * 0.7
      );
      bgGlow1.addColorStop(0, 'rgba(6, 40, 78, 0.45)');
      bgGlow1.addColorStop(0.35, 'rgba(3, 20, 48, 0.35)');
      bgGlow1.addColorStop(0.7, 'rgba(2, 10, 28, 0.6)');
      bgGlow1.addColorStop(1, 'rgba(2, 6, 18, 0.95)');
      ctx.fillStyle = bgGlow1;
      ctx.fillRect(0, 0, width, height);

      // Cyan Accent Glow around center
      const centerGlow = ctx.createRadialGradient(
        width / 2 + mouseOffsetX,
        height * 0.48 + mouseOffsetY,
        20,
        width / 2,
        height * 0.48,
        320
      );
      centerGlow.addColorStop(0, 'rgba(0, 242, 254, 0.18)');
      centerGlow.addColorStop(0.4, 'rgba(14, 165, 233, 0.09)');
      centerGlow.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = centerGlow;
      ctx.fillRect(0, 0, width, height);

      // 2. Cyber Grid Trace Lines (Subtle Perspective Grid)
      ctx.save();
      ctx.strokeStyle = 'rgba(0, 242, 254, 0.04)';
      ctx.lineWidth = 1;
      const gridSize = 60;
      const startX = (mouseOffsetX * 0.5) % gridSize;
      const startY = (mouseOffsetY * 0.5) % gridSize;

      for (let x = startX; x < width; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }
      for (let y = startY; y < height; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }
      ctx.restore();

      // 3. Floating Digital Binary / Hex Code Streams
      ctx.save();
      ctx.font = '10px "Courier New", monospace, sans-serif';
      floatingCodes.forEach((fc) => {
        fc.y -= fc.speed;
        if (fc.y < -30) {
          fc.y = height + 20;
          fc.x = Math.random() * width;
          fc.text = codeTexts[Math.floor(Math.random() * codeTexts.length)];
        }
        ctx.fillStyle = `rgba(0, 242, 254, ${fc.opacity * (0.8 + 0.2 * Math.sin(time * 2 + fc.x))})`;
        ctx.fillText(fc.text, fc.x + mouseOffsetX * 0.3, fc.y + mouseOffsetY * 0.3);
      });
      ctx.restore();

      // 4. Update and Draw Interconnected Network Nodes
      for (let i = 0; i < nodes.length; i++) {
        const node = nodes[i];

        // Move
        node.x += node.vx * node.z;
        node.y += node.vy * node.z;
        node.pulse += node.pulseSpeed;

        // Bounce on boundaries
        if (node.x < 0) { node.x = 0; node.vx *= -1; }
        if (node.x > width) { node.x = width; node.vx *= -1; }
        if (node.y < 0) { node.y = 0; node.vy *= -1; }
        if (node.y > height) { node.y = height; node.vy *= -1; }

        // Mouse interaction (repel gently)
        const dmx = node.x - mouse.x;
        const dmy = node.y - mouse.y;
        const distMouse = Math.hypot(dmx, dmy);
        if (distMouse < 120 && distMouse > 0) {
          const force = (120 - distMouse) / 120;
          node.x += (dmx / distMouse) * force * 2.5;
          node.y += (dmy / distMouse) * force * 2.5;
        }

        // Draw connections to nearby nodes
        for (let j = i + 1; j < nodes.length; j++) {
          const other = nodes[j];
          const dx = node.x - other.x;
          const dy = node.y - other.y;
          const dist = Math.hypot(dx, dy);

          if (dist < MAX_DISTANCE) {
            const alpha = (1 - dist / MAX_DISTANCE) * 0.35 * node.z;
            ctx.beginPath();
            ctx.moveTo(node.x + mouseOffsetX * node.z, node.y + mouseOffsetY * node.z);
            ctx.lineTo(other.x + mouseOffsetX * other.z, other.y + mouseOffsetY * other.z);

            const gradient = ctx.createLinearGradient(
              node.x + mouseOffsetX * node.z,
              node.y + mouseOffsetY * node.z,
              other.x + mouseOffsetX * other.z,
              other.y + mouseOffsetY * other.z
            );
            gradient.addColorStop(0, `${node.color}${alpha})`);
            gradient.addColorStop(1, `${other.color}${alpha})`);

            ctx.strokeStyle = gradient;
            ctx.lineWidth = 1 * node.z;
            ctx.stroke();
          }
        }

        // Draw node dot with pulsing halo
        const currentRadius = node.baseRadius + Math.sin(node.pulse) * 0.8;
        const renderX = node.x + mouseOffsetX * node.z;
        const renderY = node.y + mouseOffsetY * node.z;

        // Glow ring
        ctx.beginPath();
        ctx.arc(renderX, renderY, currentRadius * 2.8, 0, Math.PI * 2);
        ctx.fillStyle = `${node.color}0.15)`;
        ctx.fill();

        // Solid core
        ctx.beginPath();
        ctx.arc(renderX, renderY, currentRadius, 0, Math.PI * 2);
        ctx.fillStyle = `${node.color}0.9)`;
        ctx.fill();

        // White hot center
        ctx.beginPath();
        ctx.arc(renderX, renderY, currentRadius * 0.45, 0, Math.PI * 2);
        ctx.fillStyle = '#ffffff';
        ctx.fill();
      }

      // 5. Spawn and render Data Packets along network
      if (Math.random() < 0.08 && packets.length < 16) {
        createPacket();
      }

      for (let p = packets.length - 1; p >= 0; p--) {
        const pkt = packets[p];
        pkt.progress += pkt.speed;

        if (pkt.progress >= 1) {
          packets.splice(p, 1);
          continue;
        }

        const fromNode = nodes[pkt.fromIndex];
        const toNode = nodes[pkt.toIndex];
        if (!fromNode || !toNode) {
          packets.splice(p, 1);
          continue;
        }

        const startX = fromNode.x + mouseOffsetX * fromNode.z;
        const startY = fromNode.y + mouseOffsetY * fromNode.z;
        const endX = toNode.x + mouseOffsetX * toNode.z;
        const endY = toNode.y + mouseOffsetY * toNode.z;

        const curX = startX + (endX - startX) * pkt.progress;
        const curY = startY + (endY - startY) * pkt.progress;

        // Glowing packet spark
        ctx.save();
        ctx.beginPath();
        ctx.arc(curX, curY, 3, 0, Math.PI * 2);
        ctx.fillStyle = '#ffffff';
        ctx.shadowColor = pkt.color;
        ctx.shadowBlur = 12;
        ctx.fill();

        // Packet trail
        const trailX = startX + (endX - startX) * Math.max(0, pkt.progress - 0.08);
        const trailY = startY + (endY - startY) * Math.max(0, pkt.progress - 0.08);
        ctx.beginPath();
        ctx.moveTo(curX, curY);
        ctx.lineTo(trailX, trailY);
        ctx.strokeStyle = pkt.color;
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.restore();
      }

      // 6. Central Futuristic Network Security Lock & HUD Radar
      const centerX = width / 2 + mouseOffsetX * 1.8;
      const centerY = height * 0.46 + mouseOffsetY * 1.8;

      ringAngle1 += 0.008;
      ringAngle2 -= 0.006;
      ringAngle3 += 0.012;
      lockAngle = Math.sin(time * 0.8) * 0.05;

      ctx.save();
      ctx.translate(centerX, centerY);

      // Outer HUD Ring 1: Segmented Arcs
      ctx.save();
      ctx.rotate(ringAngle1);
      ctx.strokeStyle = 'rgba(0, 242, 254, 0.35)';
      ctx.lineWidth = 1.5;
      ctx.setLineDash([18, 12, 6, 12]);
      ctx.beginPath();
      ctx.arc(0, 0, 160, 0, Math.PI * 2);
      ctx.stroke();

      // Outer tick marks
      ctx.setLineDash([]);
      for (let i = 0; i < 36; i += 3) {
        const rad = (i * Math.PI) / 18;
        const r1 = 160;
        const r2 = i % 6 === 0 ? 172 : 166;
        ctx.beginPath();
        ctx.moveTo(Math.cos(rad) * r1, Math.sin(rad) * r1);
        ctx.lineTo(Math.cos(rad) * r2, Math.sin(rad) * r2);
        ctx.strokeStyle = i % 6 === 0 ? 'rgba(0, 242, 254, 0.6)' : 'rgba(56, 189, 248, 0.25)';
        ctx.lineWidth = i % 6 === 0 ? 2 : 1;
        ctx.stroke();
      }
      ctx.restore();

      // Middle HUD Ring 2: Rotating Scanning Arcs & Target brackets
      ctx.save();
      ctx.rotate(ringAngle2);
      ctx.strokeStyle = 'rgba(14, 165, 233, 0.45)';
      ctx.lineWidth = 2.5;
      ctx.setLineDash([45, 30, 90, 30]);
      ctx.beginPath();
      ctx.arc(0, 0, 128, 0, Math.PI * 2);
      ctx.stroke();

      // Corner target brackets
      ctx.setLineDash([]);
      ctx.strokeStyle = 'rgba(0, 242, 254, 0.7)';
      ctx.lineWidth = 2;
      for (let k = 0; k < 4; k++) {
        const angle = (k * Math.PI) / 2;
        ctx.save();
        ctx.rotate(angle);
        ctx.beginPath();
        ctx.arc(0, 0, 138, -0.12, 0.12);
        ctx.stroke();
        ctx.restore();
      }
      ctx.restore();

      // Inner HUD Ring 3: Fast Revolving Data Matrix Ring
      ctx.save();
      ctx.rotate(ringAngle3);
      ctx.strokeStyle = 'rgba(99, 102, 241, 0.5)';
      ctx.lineWidth = 1.5;
      ctx.setLineDash([8, 14]);
      ctx.beginPath();
      ctx.arc(0, 0, 96, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();

      // Subtle Pulsing Radar Sweep in Center
      const radarAngle = (time * 1.5) % (Math.PI * 2);
      const sweepGradient = ctx.createConicGradient(radarAngle, 0, 0);
      sweepGradient.addColorStop(0, 'rgba(0, 242, 254, 0.15)');
      sweepGradient.addColorStop(0.12, 'rgba(0, 242, 254, 0.0)');
      sweepGradient.addColorStop(1, 'rgba(0, 242, 254, 0.0)');
      ctx.fillStyle = sweepGradient;
      ctx.beginPath();
      ctx.arc(0, 0, 160, 0, Math.PI * 2);
      ctx.fill();

      // 7. Futuristic Digital Security Padlock in Center
      ctx.save();
      ctx.rotate(lockAngle);

      // Padlock Shackle (Top U-Shape Arc)
      const lockPulse = Math.sin(time * 2.5);
      const shackleGlowColor = lockPulse > 0 ? 'rgba(0, 242, 254, 0.95)' : 'rgba(56, 189, 248, 0.8)';

      ctx.strokeStyle = shackleGlowColor;
      ctx.lineWidth = 7;
      ctx.lineCap = 'round';
      ctx.shadowColor = '#00f2fe';
      ctx.shadowBlur = 18;

      ctx.beginPath();
      // Shackle arch
      ctx.arc(0, -20, 28, Math.PI, 0, false);
      ctx.lineTo(28, 4);
      ctx.moveTo(-28, -20);
      ctx.lineTo(-28, 4);
      ctx.stroke();

      // Padlock Body (Rounded Cyber Rect)
      const bodyWidth = 74;
      const bodyHeight = 58;
      const bodyX = -bodyWidth / 2;
      const bodyY = -4;
      const radius = 10;

      // Body Gradient Background
      const lockBodyGrad = ctx.createLinearGradient(0, bodyY, 0, bodyY + bodyHeight);
      lockBodyGrad.addColorStop(0, 'rgba(10, 37, 74, 0.85)');
      lockBodyGrad.addColorStop(1, 'rgba(4, 18, 40, 0.95)');

      ctx.fillStyle = lockBodyGrad;
      ctx.beginPath();
      ctx.roundRect(bodyX, bodyY, bodyWidth, bodyHeight, radius);
      ctx.fill();

      // Padlock Body Neon Border
      ctx.strokeStyle = 'rgba(0, 242, 254, 0.9)';
      ctx.lineWidth = 2.5;
      ctx.shadowColor = '#00f2fe';
      ctx.shadowBlur = 14;
      ctx.stroke();

      // Inner Tech Grid on Padlock Body
      ctx.shadowBlur = 0;
      ctx.strokeStyle = 'rgba(0, 242, 254, 0.2)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(bodyX + 8, bodyY + 12);
      ctx.lineTo(bodyX + bodyWidth - 8, bodyY + 12);
      ctx.moveTo(bodyX + 8, bodyY + bodyHeight - 12);
      ctx.lineTo(bodyX + bodyWidth - 8, bodyY + bodyHeight - 12);
      ctx.stroke();

      // Center Keyhole (Glowing Neon Circle & Notch)
      ctx.save();
      ctx.fillStyle = '#00f2fe';
      ctx.shadowColor = '#00f2fe';
      ctx.shadowBlur = 16;
      ctx.beginPath();
      ctx.arc(0, bodyY + 22, 6.5, 0, Math.PI * 2);
      ctx.fill();

      ctx.beginPath();
      ctx.moveTo(-3.5, bodyY + 24);
      ctx.lineTo(3.5, bodyY + 24);
      ctx.lineTo(5, bodyY + 38);
      ctx.lineTo(-5, bodyY + 38);
      ctx.closePath();
      ctx.fill();

      // Bright white core inside keyhole
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(0, bodyY + 22, 2.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      // Cyber Security HUD Status Labels below lock
      ctx.font = 'bold 9px "Courier New", monospace, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillStyle = 'rgba(0, 242, 254, 0.95)';
      ctx.fillText('• NETWORK SECURITY LOCKED •', 0, 78);

      ctx.font = '8px "Courier New", monospace, sans-serif';
      ctx.fillStyle = 'rgba(56, 189, 248, 0.65)';
      ctx.fillText('ALUMNI KKBS // AES-256 ENCRYPTED', 0, 92);

      ctx.restore(); // end lock transform
      ctx.restore(); // end center transform

      // 8. Cyber Laser Scan Sweep (Vertical scan passing periodically)
      scanLineY += 1.8;
      if (scanLineY > height + 100) {
        scanLineY = -60;
      }

      const scanGrad = ctx.createLinearGradient(0, scanLineY - 40, 0, scanLineY + 10);
      scanGrad.addColorStop(0, 'rgba(0, 242, 254, 0)');
      scanGrad.addColorStop(0.85, 'rgba(0, 242, 254, 0.08)');
      scanGrad.addColorStop(1, 'rgba(0, 242, 254, 0.25)');

      ctx.fillStyle = scanGrad;
      ctx.fillRect(0, scanLineY - 40, width, 40);

      // Bright laser line
      ctx.beginPath();
      ctx.moveTo(0, scanLineY);
      ctx.lineTo(width, scanLineY);
      ctx.strokeStyle = 'rgba(0, 242, 254, 0.4)';
      ctx.lineWidth = 1;
      ctx.stroke();

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseleave', handleMouseLeave);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden select-none">
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full block"
      />
    </div>
  );
};
