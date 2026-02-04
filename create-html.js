const fs = require('fs');
const path = require('path');

// Create a simple HTML file that renders the excalidraw diagram
function createHTML(excalidrawData) {
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>OpenClaw Architecture</title>
  <script src="https://unpkg.com/react@18/umd/react.production.min.js"></script>
  <script src="https://unpkg.com/react-dom@18/umd/react-dom.production.min.js"></script>
  <script src="https://unpkg.com/@excalidraw/excalidraw@0.17.0/dist/excalidraw.production.min.js"></script>
  <style>
    body { margin: 0; padding: 0; background: white; }
    #root { width: 1000px; height: 700px; }
  </style>
</head>
<body>
  <div id="root"></div>
  <script>
    const excalidrawData = ${JSON.stringify(excalidrawData)};
    
    const App = () => {
      return React.createElement(
        React.Fragment,
        null,
        React.createElement(
          ExcalidrawLib.Excalidraw,
          {
            initialData: excalidrawData,
            viewModeEnabled: true,
            gridModeEnabled: false,
            width: 1000,
            height: 700
          }
        )
      );
    };
    
    const root = ReactDOM.createRoot(document.getElementById('root'));
    root.render(React.createElement(App));
  </script>
</body>
</html>`;
}

// Read excalidraw file
const excalidrawPath = path.join(__dirname, 'openclaw-architecture.excalidraw');
const outputHTMLPath = path.join(__dirname, 'openclaw-architecture.html');

const excalidrawData = JSON.parse(fs.readFileSync(excalidrawPath, 'utf8'));
const html = createHTML(excalidrawData);

fs.writeFileSync(outputHTMLPath, html);
console.log(`HTML file created: ${outputHTMLPath}`);
