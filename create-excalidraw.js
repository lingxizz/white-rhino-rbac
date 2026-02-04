const fs = require('fs');
const path = require('path');

// Excalidraw file format helper
function generateExcalidrawFile(elements) {
  return {
    type: "excalidraw",
    version: 2,
    source: "https://excalidraw.com",
    elements: elements,
    appState: {
      gridSize: 20,
      viewBackgroundColor: "#ffffff"
    },
    files: {}
  };
}

// Generate a random id
function generateId() {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}

// Create a rectangle element
function createRectangle(x, y, width, height, text, options = {}) {
  const id = generateId();
  const groupId = options.groupId || null;
  const backgroundColor = options.backgroundColor || "#e3f2fd";
  const strokeColor = options.strokeColor || "#1976d2";
  
  const rect = {
    id: id,
    type: "rectangle",
    x: x,
    y: y,
    width: width,
    height: height,
    angle: 0,
    strokeColor: strokeColor,
    backgroundColor: backgroundColor,
    fillStyle: "hachure",
    strokeWidth: 2,
    strokeStyle: "solid",
    roughness: 1,
    opacity: 100,
    groupIds: groupId ? [groupId] : [],
    frameId: null,
    roundness: { type: 3, value: 16 },
    seed: Math.floor(Math.random() * 1000),
    version: 1,
    versionNonce: Math.floor(Math.random() * 1000000),
    isDeleted: false,
    boundElements: text ? [{ type: "text", id: id + "_text" }] : [],
    updated: Date.now(),
    link: null,
    locked: false
  };

  let elements = [rect];

  if (text) {
    const textId = id + "_text";
    const textEl = {
      id: textId,
      type: "text",
      x: x + width / 2,
      y: y + height / 2,
      width: width - 20,
      height: 30,
      angle: 0,
      strokeColor: strokeColor,
      backgroundColor: "transparent",
      fillStyle: "solid",
      strokeWidth: 2,
      strokeStyle: "solid",
      roughness: 1,
      opacity: 100,
      groupIds: groupId ? [groupId] : [],
      frameId: null,
      roundness: null,
      seed: Math.floor(Math.random() * 1000),
      version: 1,
      versionNonce: Math.floor(Math.random() * 1000000),
      isDeleted: false,
      boundElements: [],
      updated: Date.now(),
      link: null,
      locked: false,
      text: text,
      fontSize: 16,
      fontFamily: 1,
      textAlign: "center",
      verticalAlign: "middle",
      baseline: 17,
      containerId: id,
      originalText: text,
      lineHeight: 1.25
    };
    elements.push(textEl);
  }

  return { elements, id, centerX: x + width / 2, centerY: y + height / 2 };
}

// Create a circle element
function createCircle(x, y, diameter, text, options = {}) {
  const id = generateId();
  const groupId = options.groupId || null;
  const backgroundColor = options.backgroundColor || "#fff3e0";
  const strokeColor = options.strokeColor || "#f57c00";
  const radius = diameter / 2;
  
  const circle = {
    id: id,
    type: "ellipse",
    x: x - radius,
    y: y - radius,
    width: diameter,
    height: diameter,
    angle: 0,
    strokeColor: strokeColor,
    backgroundColor: backgroundColor,
    fillStyle: "hachure",
    strokeWidth: 2,
    strokeStyle: "solid",
    roughness: 1,
    opacity: 100,
    groupIds: groupId ? [groupId] : [],
    frameId: null,
    roundness: { type: 2 },
    seed: Math.floor(Math.random() * 1000),
    version: 1,
    versionNonce: Math.floor(Math.random() * 1000000),
    isDeleted: false,
    boundElements: text ? [{ type: "text", id: id + "_text" }] : [],
    updated: Date.now(),
    link: null,
    locked: false
  };

  let elements = [circle];

  if (text) {
    const textId = id + "_text";
    const textEl = {
      id: textId,
      type: "text",
      x: x,
      y: y,
      width: diameter - 20,
      height: 30,
      angle: 0,
      strokeColor: strokeColor,
      backgroundColor: "transparent",
      fillStyle: "solid",
      strokeWidth: 2,
      strokeStyle: "solid",
      roughness: 1,
      opacity: 100,
      groupIds: groupId ? [groupId] : [],
      frameId: null,
      roundness: null,
      seed: Math.floor(Math.random() * 1000),
      version: 1,
      versionNonce: Math.floor(Math.random() * 1000000),
      isDeleted: false,
      boundElements: [],
      updated: Date.now(),
      link: null,
      locked: false,
      text: text,
      fontSize: 14,
      fontFamily: 1,
      textAlign: "center",
      verticalAlign: "middle",
      baseline: 17,
      containerId: id,
      originalText: text,
      lineHeight: 1.25
    };
    elements.push(textEl);
  }

  return { elements, id, centerX: x, centerY: y };
}

// Create an arrow between two points
function createArrow(x1, y1, x2, y2, options = {}) {
  const id = generateId();
  
  return {
    id: id,
    type: "arrow",
    x: 0,
    y: 0,
    width: Math.abs(x2 - x1),
    height: Math.abs(y2 - y1),
    angle: 0,
    strokeColor: options.strokeColor || "#666666",
    backgroundColor: "transparent",
    fillStyle: "solid",
    strokeWidth: 2,
    strokeStyle: "solid",
    roughness: 1,
    opacity: 100,
    groupIds: [],
    frameId: null,
    roundness: { type: 2 },
    seed: Math.floor(Math.random() * 1000),
    version: 1,
    versionNonce: Math.floor(Math.random() * 1000000),
    isDeleted: false,
    boundElements: [],
    updated: Date.now(),
    link: null,
    locked: false,
    startBinding: null,
    endBinding: null,
    lastCommittedPoint: null,
    startArrowhead: null,
    endArrowhead: "arrow",
    points: [
      [x1, y1],
      [x2, y2]
    ]
  };
}

// Create text element
function createText(x, y, text, options = {}) {
  return {
    id: generateId(),
    type: "text",
    x: x,
    y: y,
    width: options.width || 200,
    height: 30,
    angle: 0,
    strokeColor: options.color || "#333333",
    backgroundColor: "transparent",
    fillStyle: "solid",
    strokeWidth: 2,
    strokeStyle: "solid",
    roughness: 1,
    opacity: 100,
    groupIds: [],
    frameId: null,
    roundness: null,
    seed: Math.floor(Math.random() * 1000),
    version: 1,
    versionNonce: Math.floor(Math.random() * 1000000),
    isDeleted: false,
    boundElements: [],
    updated: Date.now(),
    link: null,
    locked: false,
    text: text,
    fontSize: options.fontSize || 16,
    fontFamily: 1,
    textAlign: options.align || "center",
    verticalAlign: "middle",
    baseline: 17,
    containerId: null,
    originalText: text,
    lineHeight: 1.25
  };
}

// Main function to create OpenClaw architecture diagram
function createArchitectureDiagram() {
  const elements = [];
  
  // Define positions for components (centered layout)
  const centerX = 500;
  const startY = 80;
  const spacingY = 140;
  
  // Colors
  const colors = {
    user: { bg: "#ffebee", stroke: "#c62828" },
    gateway: { bg: "#e8f5e9", stroke: "#2e7d32" },
    channel: { bg: "#e3f2fd", stroke: "#1565c0" },
    ai: { bg: "#fff3e0", stroke: "#ef6c00" },
    skills: { bg: "#f3e5f5", stroke: "#6a1b9a" },
    memory: { bg: "#e0f2f1", stroke: "#00695c" }
  };
  
  // 1. User (top)
  const user = createRectangle(centerX - 60, startY, 120, 80, "👤 User\n(手机/电脑)", {
    backgroundColor: colors.user.bg,
    strokeColor: colors.user.stroke
  });
  elements.push(...user.elements);
  
  // 2. OpenClaw Gateway (below user)
  const gatewayY = startY + spacingY;
  const gateway = createRectangle(centerX - 100, gatewayY, 200, 100, "🌐 OpenClaw\nGateway", {
    backgroundColor: colors.gateway.bg,
    strokeColor: colors.gateway.stroke
  });
  elements.push(...gateway.elements);
  
  // Arrow from User to Gateway
  elements.push(createArrow(user.centerX, user.centerY + 40, gateway.centerX, gateway.centerY - 50, {
    strokeColor: colors.gateway.stroke
  }));
  
  // 3. Channels (left and right of gateway)
  const channelY = gatewayY + 50;
  
  // Feishu Channel (left)
  const feishu = createRectangle(centerX - 350, channelY - 30, 130, 80, "📱 Feishu\n飞书", {
    backgroundColor: colors.channel.bg,
    strokeColor: colors.channel.stroke
  });
  elements.push(...feishu.elements);
  
  // Arrow between Gateway and Feishu
  elements.push(createArrow(feishu.centerX + 65, feishu.centerY, gateway.centerX - 100, gateway.centerY, {
    strokeColor: colors.channel.stroke
  }));
  
  // Telegram Channel (right)
  const telegram = createRectangle(centerX + 220, channelY - 30, 130, 80, "✈️ Telegram", {
    backgroundColor: colors.channel.bg,
    strokeColor: colors.channel.stroke
  });
  elements.push(...telegram.elements);
  
  // Arrow between Gateway and Telegram
  elements.push(createArrow(gateway.centerX + 100, gateway.centerY, telegram.centerX - 65, telegram.centerY, {
    strokeColor: colors.channel.stroke
  }));
  
  // 4. AI Models (below gateway)
  const aiY = gatewayY + spacingY;
  const ai = createRectangle(centerX - 80, aiY, 160, 90, "🧠 AI Models\nKimi / GLM", {
    backgroundColor: colors.ai.bg,
    strokeColor: colors.ai.stroke
  });
  elements.push(...ai.elements);
  
  // Arrow from Gateway to AI
  elements.push(createArrow(gateway.centerX, gateway.centerY + 50, ai.centerX, ai.centerY - 45, {
    strokeColor: colors.ai.stroke
  }));
  
  // 5. Skills System (left of AI)
  const skills = createRectangle(centerX - 320, aiY + 10, 140, 80, "🛠️ Skills\n技能系统", {
    backgroundColor: colors.skills.bg,
    strokeColor: colors.skills.stroke
  });
  elements.push(...skills.elements);
  
  // Arrow between AI and Skills
  elements.push(createArrow(ai.centerX - 80, ai.centerY + 20, skills.centerX + 70, skills.centerY, {
    strokeColor: colors.skills.stroke
  }));
  
  // 6. Memory System (right of AI)
  const memory = createRectangle(centerX + 180, aiY + 10, 140, 80, "💾 Memory\n记忆系统", {
    backgroundColor: colors.memory.bg,
    strokeColor: colors.memory.stroke
  });
  elements.push(...memory.elements);
  
  // Arrow between AI and Memory
  elements.push(createArrow(ai.centerX + 80, ai.centerY + 20, memory.centerX - 70, memory.centerY, {
    strokeColor: colors.memory.stroke
  }));
  
  // Add title
  elements.push(createText(centerX, 20, "OpenClaw 系统架构", {
    fontSize: 24,
    width: 300,
    color: "#333333",
    align: "center"
  }));
  
  // Add legend/description boxes
  const legendY = aiY + 140;
  
  return elements;
}

// Generate and save
const elements = createArchitectureDiagram();
const excalidrawFile = generateExcalidrawFile(elements);

const outputPath = path.join(__dirname, "openclaw-architecture.excalidraw");
fs.writeFileSync(outputPath, JSON.stringify(excalidrawFile, null, 2));

console.log(`✅ Excalidraw file created: ${outputPath}`);
console.log(`📊 Total elements: ${elements.length}`);
