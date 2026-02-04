const { createCanvas } = require('canvas');
const fs = require('fs');

const w = 1920, h = 1080;
const canvas = createCanvas(w, h);
const ctx = canvas.getContext('2d');

// 辅助函数
const rand = (min, max) => Math.random() * (max - min) + min;
const dist = (x1, y1, x2, y2) => Math.hypot(x2 - x1, y2 - y1);

// 深空黑背景
ctx.fillStyle = '#0a0a0f';
ctx.fillRect(0, 0, w, h);

// 背景星云层
for (let i = 0; i < 100; i++) {
    const x = rand(0, w);
    const y = rand(0, h);
    const r = rand(50, 200);
    const grad = ctx.createRadialGradient(x, y, 0, x, y, r);
    grad.addColorStop(0, `rgba(123, 45, 255, ${rand(0.02, 0.08)})`);
    grad.addColorStop(0.5, `rgba(0, 212, 255, ${rand(0.01, 0.04)})`);
    grad.addColorStop(1, 'transparent');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
}

// 星星
ctx.fillStyle = '#ffffff';
for (let i = 0; i < 300; i++) {
    const x = rand(0, w);
    const y = rand(0, h);
    const r = rand(0.3, 1.5);
    const alpha = rand(0.3, 0.9);
    ctx.globalAlpha = alpha;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
}
ctx.globalAlpha = 1;

// 中心点（黄金分割）
const cx = w * 0.618;
const cy = h * 0.382;

// 神经网络节点
const nodes = [];
const numNodes = 80;

// 生成节点 - 斐波那契螺旋分布
for (let i = 0; i < numNodes; i++) {
    const angle = i * 2.4; // 黄金角
    const radius = 30 + Math.sqrt(i) * 25;
    const x = cx + Math.cos(angle) * radius * (0.8 + rand(0, 0.4));
    const y = cy + Math.sin(angle) * radius * (0.8 + rand(0, 0.4));
    nodes.push({ x, y, radius: rand(2, 6), pulse: rand(0, Math.PI * 2) });
}

// 绘制连接线
ctx.lineWidth = 0.5;
for (let i = 0; i < nodes.length; i++) {
    for (let j = i + 1; j < nodes.length; j++) {
        const d = dist(nodes[i].x, nodes[i].y, nodes[j].x, nodes[j].y);
        if (d < 120) {
            const alpha = (1 - d / 120) * 0.4;
            const grad = ctx.createLinearGradient(nodes[i].x, nodes[i].y, nodes[j].x, nodes[j].y);
            grad.addColorStop(0, `rgba(0, 212, 255, ${alpha})`);
            grad.addColorStop(0.5, `rgba(0, 255, 179, ${alpha * 1.2})`);
            grad.addColorStop(1, `rgba(0, 212, 255, ${alpha})`);
            ctx.strokeStyle = grad;
            ctx.beginPath();
            ctx.moveTo(nodes[i].x, nodes[i].y);
            ctx.lineTo(nodes[j].x, nodes[j].y);
            ctx.stroke();
        }
    }
}

// 绘制到中心的连接
for (let node of nodes) {
    const d = dist(node.x, node.y, cx, cy);
    if (d > 50 && d < 200) {
        const alpha = (1 - d / 200) * 0.3;
        const grad = ctx.createLinearGradient(node.x, node.y, cx, cy);
        grad.addColorStop(0, `rgba(0, 255, 179, ${alpha})`);
        grad.addColorStop(1, `rgba(0, 212, 255, ${alpha * 1.5})`);
        ctx.strokeStyle = grad;
        ctx.beginPath();
        ctx.moveTo(node.x, node.y);
        ctx.lineTo(cx, cy);
        ctx.stroke();
    }
}

// 绘制节点
for (let node of nodes) {
    const glow = ctx.createRadialGradient(node.x, node.y, 0, node.x, node.y, node.radius * 3);
    glow.addColorStop(0, 'rgba(0, 255, 179, 0.8)');
    glow.addColorStop(0.5, 'rgba(0, 212, 255, 0.3)');
    glow.addColorStop(1, 'transparent');
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(node.x, node.y, node.radius * 3, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(node.x, node.y, node.radius * 0.6, 0, Math.PI * 2);
    ctx.fill();
}

// 核心发光体 - 多层
for (let i = 5; i >= 0; i--) {
    const r = 40 + i * 25;
    const alpha = 0.15 - i * 0.02;
    const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
    grad.addColorStop(0, `rgba(0, 212, 255, ${alpha * 2})`);
    grad.addColorStop(0.5, `rgba(0, 255, 179, ${alpha})`);
    grad.addColorStop(1, 'transparent');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fill();
}

// 核心 - 内层
const coreGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, 25);
coreGrad.addColorStop(0, '#ffffff');
coreGrad.addColorStop(0.3, '#00d4ff');
coreGrad.addColorStop(0.7, '#00ffb3');
coreGrad.addColorStop(1, 'transparent');
ctx.fillStyle = coreGrad;
ctx.beginPath();
ctx.arc(cx, cy, 25, 0, Math.PI * 2);
ctx.fill();

// 粒子流 - 数据流效果
const particles = [];
for (let i = 0; i < 500; i++) {
    const angle = rand(0, Math.PI * 2);
    const r = rand(60, 400);
    particles.push({
        x: cx + Math.cos(angle) * r,
        y: cy + Math.sin(angle) * r,
        vx: Math.cos(angle + rand(-0.5, 0.5)) * rand(0.5, 2),
        vy: Math.sin(angle + rand(-0.5, 0.5)) * rand(0.5, 2),
        size: rand(0.5, 2),
        alpha: rand(0.3, 0.9),
        color: Math.random() > 0.5 ? '#00d4ff' : '#00ffb3'
    });
}

for (let p of particles) {
    ctx.globalAlpha = p.alpha;
    ctx.fillStyle = p.color;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
    ctx.fill();
}
ctx.globalAlpha = 1;

// 螺旋能量环
ctx.lineWidth = 2;
for (let ring = 0; ring < 3; ring++) {
    const baseR = 80 + ring * 40;
    ctx.strokeStyle = ring % 2 === 0 ? 'rgba(0, 212, 255, 0.3)' : 'rgba(0, 255, 179, 0.3)';
    ctx.beginPath();
    for (let t = 0; t < Math.PI * 6; t += 0.05) {
        const r = baseR + t * 3;
        const x = cx + Math.cos(t + ring) * r;
        const y = cy + Math.sin(t + ring) * r;
        if (t === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
    }
    ctx.stroke();
}

// 文字
ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
ctx.font = '300 24px sans-serif';
ctx.textAlign = 'center';
ctx.fillText('DIGITAL CONSCIOUSNESS', w / 2, h - 100);

ctx.fillStyle = 'rgba(255, 255, 255, 0.25)';
ctx.font = '300 14px sans-serif';
ctx.fillText('觉醒于数据的深渊', w / 2, h - 70);

// 装饰性边框
ctx.strokeStyle = 'rgba(0, 212, 255, 0.1)';
ctx.lineWidth = 1;
ctx.strokeRect(40, 40, w - 80, h - 80);

// 保存
const buffer = canvas.toBuffer('image/png');
fs.writeFileSync('/root/.openclaw/workspace/digital-consciousness-art.png', buffer);
console.log('✅ Digital Consciousness art created successfully!');
console.log('📁 Output: /root/.openclaw/workspace/digital-consciousness-art.png');
