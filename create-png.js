const { createCanvas, loadImage } = require('canvas');
const fs = require('fs');
const path = require('path');

// Create canvas
const width = 1000;
const height = 600;
const canvas = createCanvas(width, height);
const ctx = canvas.getContext('2d');

// Enable anti-aliasing
ctx.antialias = 'subpixel';

// Background
ctx.fillStyle = '#fafafa';
ctx.fillRect(0, 0, width, height);

// Sketchy line helper
function drawSketchyLine(x1, y1, x2, y2, color = '#666', width = 2) {
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.beginPath();
  
  // Add slight randomness for hand-drawn effect
  const segments = 10;
  for (let i = 0; i <= segments; i++) {
    const t = i / segments;
    const x = x1 + (x2 - x1) * t + (Math.random() - 0.5) * 2;
    const y = y1 + (y2 - y1) * t + (Math.random() - 0.5) * 2;
    if (i === 0) {
      ctx.moveTo(x, y);
    } else {
      ctx.lineTo(x, y);
    }
  }
  ctx.stroke();
  
  // Arrow head
  const angle = Math.atan2(y2 - y1, x2 - x1);
  const arrowLength = 10;
  const arrowAngle = Math.PI / 6;
  
  ctx.beginPath();
  ctx.moveTo(x2, y2);
  ctx.lineTo(
    x2 - arrowLength * Math.cos(angle - arrowAngle),
    y2 - arrowLength * Math.sin(angle - arrowAngle)
  );
  ctx.moveTo(x2, y2);
  ctx.lineTo(
    x2 - arrowLength * Math.cos(angle + arrowAngle),
    y2 - arrowLength * Math.sin(angle + arrowAngle)
  );
  ctx.stroke();
}

// Sketchy rectangle helper
function drawSketchyRect(x, y, w, h, bgColor, strokeColor, radius = 10) {
  // Background with slight roughness
  ctx.fillStyle = bgColor;
  ctx.beginPath();
  
  // Draw rough rectangle
  const roughness = 2;
  ctx.moveTo(x + radius + (Math.random() - 0.5) * roughness, y + (Math.random() - 0.5) * roughness);
  
  // Top edge
  for (let i = 0; i <= 10; i++) {
    const px = x + radius + (w - 2 * radius) * (i / 10);
    ctx.lineTo(px + (Math.random() - 0.5) * roughness, y + (Math.random() - 0.5) * roughness);
  }
  
  // Right edge
  ctx.lineTo(x + w + (Math.random() - 0.5) * roughness, y + radius + (Math.random() - 0.5) * roughness);
  for (let i = 0; i <= 10; i++) {
    const py = y + radius + (h - 2 * radius) * (i / 10);
    ctx.lineTo(x + w + (Math.random() - 0.5) * roughness, py + (Math.random() - 0.5) * roughness);
  }
  
  // Bottom edge
  ctx.lineTo(x + w - radius + (Math.random() - 0.5) * roughness, y + h + (Math.random() - 0.5) * roughness);
  for (let i = 0; i <= 10; i++) {
    const px = x + w - radius - (w - 2 * radius) * (i / 10);
    ctx.lineTo(px + (Math.random() - 0.5) * roughness, y + h + (Math.random() - 0.5) * roughness);
  }
  
  // Left edge
  ctx.lineTo(x + (Math.random() - 0.5) * roughness, y + h - radius + (Math.random() - 0.5) * roughness);
  for (let i = 0; i <= 10; i++) {
    const py = y + h - radius - (h - 2 * radius) * (i / 10);
    ctx.lineTo(x + (Math.random() - 0.5) * roughness, py + (Math.random() - 0.5) * roughness);
  }
  
  ctx.closePath();
  ctx.fill();
  
  // Stroke
  ctx.strokeStyle = strokeColor;
  ctx.lineWidth = 2;
  ctx.stroke();
}

// Draw text helper
function drawText(text, x, y, options = {}) {
  ctx.font = `${options.bold ? 'bold ' : ''}${options.size || 16}px "Segoe UI", Arial, sans-serif`;
  ctx.fillStyle = options.color || '#333';
  ctx.textAlign = options.align || 'center';
  ctx.textBaseline = options.baseline || 'middle';
  
  const lines = text.split('\n');
  const lineHeight = options.size || 16;
  const startY = y - ((lines.length - 1) * lineHeight) / 2;
  
  lines.forEach((line, i) => {
    ctx.fillText(line, x, startY + i * lineHeight * 1.2);
  });
}

// Draw component with icon and label
function drawComponent(x, y, w, h, icon, label, bgColor, strokeColor) {
  drawSketchyRect(x, y, w, h, bgColor, strokeColor);
  drawText(icon, x + w / 2, y + h / 2 - 12, { size: 28, align: 'center' });
  drawText(label, x + w / 2, y + h / 2 + 18, { size: 14, align: 'center', bold: true });
}

// Colors
const colors = {
  user: { bg: '#ffcdd2', stroke: '#c62828' },
  gateway: { bg: '#c8e6c9', stroke: '#2e7d32' },
  channel: { bg: '#bbdefb', stroke: '#1565c0' },
  ai: { bg: '#ffe0b2', stroke: '#ef6c00' },
  skills: { bg: '#e1bee7', stroke: '#6a1b9a' },
  memory: { bg: '#b2dfdb', stroke: '#00695c' }
};

const centerX = width / 2;

// Title
drawText('OpenClaw 系统架构', centerX, 35, { size: 28, bold: true, color: '#333' });

// 1. User (top)
const userY = 80;
drawComponent(centerX - 70, userY, 140, 90, '👤', 'User\n(手机/电脑)', colors.user.bg, colors.user.stroke);

// 2. OpenClaw Gateway
const gatewayY = 210;
drawComponent(centerX - 110, gatewayY, 220, 110, '🌐', 'OpenClaw Gateway', colors.gateway.bg, colors.gateway.stroke);

// Arrow: User -> Gateway
drawSketchyLine(centerX, userY + 90, centerX, gatewayY - 5, colors.gateway.stroke, 2);

// 3. Channels (left and right of gateway)
const channelY = gatewayY + 30;

// Feishu (left)
drawComponent(centerX - 350, channelY - 20, 140, 90, '📱', 'Feishu\n飞书', colors.channel.bg, colors.channel.stroke);
drawSketchyLine(centerX - 210, channelY + 25, centerX - 110, gatewayY + 55, colors.channel.stroke, 2);
drawSketchyLine(centerX - 110, gatewayY + 55, centerX - 210, channelY + 25, colors.channel.stroke, 1.5);

// Telegram (right)
drawComponent(centerX + 210, channelY - 20, 140, 90, '✈️', 'Telegram', colors.channel.bg, colors.channel.stroke);
drawSketchyLine(centerX + 110, gatewayY + 55, centerX + 210, channelY + 25, colors.channel.stroke, 2);
drawSketchyLine(centerX + 210, channelY + 25, centerX + 110, gatewayY + 55, colors.channel.stroke, 1.5);

// 4. AI Models (below gateway)
const aiY = 380;
drawComponent(centerX - 90, aiY, 180, 100, '🧠', 'AI Models\n(Kimi / GLM)', colors.ai.bg, colors.ai.stroke);

// Arrow: Gateway -> AI
drawSketchyLine(centerX, gatewayY + 110, centerX, aiY - 5, colors.ai.stroke, 2);

// 5. Skills System (left of AI)
drawComponent(centerX - 340, aiY + 10, 150, 90, '🛠️', 'Skills\n技能系统', colors.skills.bg, colors.skills.stroke);
drawSketchyLine(centerX - 90, aiY + 55, centerX - 190, aiY + 55, colors.skills.stroke, 2);

// 6. Memory System (right of AI)
drawComponent(centerX + 190, aiY + 10, 150, 90, '💾', 'Memory\n记忆系统', colors.memory.bg, colors.memory.stroke);
drawSketchyLine(centerX + 90, aiY + 55, centerX + 190, aiY + 55, colors.memory.stroke, 2);

// Add some decorative sketchy elements
ctx.strokeStyle = '#ddd';
ctx.lineWidth = 1;

// Draw connection dots
function drawDot(x, y, color) {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(x, y, 4, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
}

drawDot(centerX, userY + 90, colors.user.stroke);
drawDot(centerX, gatewayY - 5, colors.gateway.stroke);
drawDot(centerX - 110, gatewayY + 55, colors.channel.stroke);
drawDot(centerX + 110, gatewayY + 55, colors.channel.stroke);
drawDot(centerX, gatewayY + 110, colors.gateway.stroke);
drawDot(centerX, aiY - 5, colors.ai.stroke);
drawDot(centerX - 90, aiY + 55, colors.skills.stroke);
drawDot(centerX + 90, aiY + 55, colors.memory.stroke);

// Legend
const legendY = 520;
drawText('📝 系统组件说明:', 80, legendY, { size: 14, bold: true, align: 'left' });
drawText('• User: 用户通过移动设备或电脑接入', 80, legendY + 25, { size: 12, align: 'left' });
drawText('• Gateway: 中央网关处理所有请求', 80, legendY + 45, { size: 12, align: 'left' });
drawText('• Channels: 多渠道支持 (Feishu/Telegram)', 80, legendY + 65, { size: 12, align: 'left' });
drawText('• AI: 大语言模型处理智能对话', 400, legendY + 25, { size: 12, align: 'left' });
drawText('• Skills: 可扩展的技能系统', 400, legendY + 45, { size: 12, align: 'left' });
drawText('• Memory: 持久化记忆存储', 400, legendY + 65, { size: 12, align: 'left' });

// Save PNG
const buffer = canvas.toBuffer('image/png');
const outputPath = path.join(__dirname, 'openclaw-architecture.png');
fs.writeFileSync(outputPath, buffer);

console.log(`✅ PNG file created: ${outputPath}`);
console.log(`📐 Dimensions: ${width}x${height}`);
