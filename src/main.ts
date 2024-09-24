import { FabricRenderer } from "./renderer_fabric";
import { Canvas2DRenderer } from "./renderer_dom";
import { MP4Demuxer } from "./mp4_demuxer";

// Status UI. Messages are batched per animation frame.
let pendingStatus: Record<string, string> | null = null;

function setStatus(type: string, message: string) {
  if (pendingStatus) {
    pendingStatus[type] = message;
  } else {
    pendingStatus = { [type]: message };
    self.requestAnimationFrame(statusAnimationFrame);
  }
}

function statusAnimationFrame() {
  console.log(pendingStatus);
  pendingStatus = null;
}

// Rendering. Drawing is limited to once per animation frame.
let renderer: FabricRenderer | Canvas2DRenderer | null = null;
let pendingFrame: VideoFrame | null = null;
let startTime: number | null = null;
let frameCount = 0;

function renderFrame(frame: VideoFrame) {
  if (!pendingFrame) {
    // Schedule rendering in the next animation frame.
    requestAnimationFrame(renderAnimationFrame);
  } else {
    // Close the current pending frame before replacing it.
    pendingFrame.close();
  }
  // Set or replace the pending frame.
  pendingFrame = frame;
}

function renderAnimationFrame() {
  if (!renderer || !pendingFrame) return;
  renderer.draw(pendingFrame);
  pendingFrame = null;
}

// Startup.
function start() {
  const dataUri = "http://localhost:5173/avc.mp4";

  // Get the renderer type from the query parameter
  const urlParams = new URLSearchParams(window.location.search);
  const rendererType = urlParams.get("type");

  // Pick a renderer to use based on the query parameter
  if (rendererType === "fabric") {
    renderer = new FabricRenderer();
  } else if (rendererType === "canvas2d") {
    const domCanvas = document.getElementById(
      "videoCanvas"
    ) as HTMLCanvasElement;
    if (!domCanvas) return;
    renderer = new Canvas2DRenderer(domCanvas);
  } else {
    console.error('Invalid renderer type. Use "fabric" or "canvas2d".');
    return;
  }

  // Set up a VideoDecoder.
  const decoder = new VideoDecoder({
    output(frame) {
      // Update statistics.
      if (startTime == null) {
        startTime = performance.now();
      } else {
        const elapsed = (performance.now() - startTime) / 1000;
        const fps = ++frameCount / elapsed;
        setStatus("render", `${fps.toFixed(0)} fps`);
      }

      // Schedule the frame to be rendered.
      renderFrame(frame);
    },
    error(e) {
      console.log("ERROR: decode: ", e);
    },
  });

  // Fetch and demux the media data.
  const demuxer = new MP4Demuxer(dataUri, {
    onConfig(config) {
      setStatus(
        "decode",
        `${config.codec} @ ${config.codedWidth}x${config.codedHeight}`
      );
      decoder.configure(config);
    },
    onChunk(chunk) {
      decoder.decode(chunk);
    },
    setStatus,
  });
}

start();
