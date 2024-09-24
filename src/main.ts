import { FabricRenderer } from "./renderer_fabric";
import { OptimizedFabricRenderer } from "./renderer_fabric_optimized";
import { Canvas2DRenderer } from "./renderer_dom";
import { MP4Demuxer } from "./mp4_demuxer";

// Status UI. Messages are batched per animation frame.
let pendingStatus: Record<string, string> | null = null;
let fpsDisplay: HTMLElement | null = null;

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
  if (pendingStatus && pendingStatus["render"]) {
    updateFPSDisplay(pendingStatus["render"]);
  }
  pendingStatus = null;
}

function updateFPSDisplay(fpsMessage: string) {
  if (!fpsDisplay) {
    fpsDisplay = document.getElementById("fpsDisplay");
  }
  if (fpsDisplay) {
    fpsDisplay.textContent = fpsMessage;
  }
}

// Rendering
let renderer:
  | FabricRenderer
  | OptimizedFabricRenderer
  | Canvas2DRenderer
  | null = null;
let pendingFrames: [VideoFrame | null, VideoFrame | null] = [null, null];
let startTime: number | null = null;
let frameCount = 0;

function renderFrame(frame: VideoFrame, index: number) {
  if (!pendingFrames[index]) {
    // Schedule rendering in the next animation frame.
    requestAnimationFrame(renderAnimationFrame);
  } else {
    // Close the current pending frame before replacing it.
    pendingFrames[index]?.close();
  }
  // Set or replace the pending frame.
  pendingFrames[index] = frame;
}

function renderAnimationFrame() {
  if (!renderer || (!pendingFrames[0] && !pendingFrames[1])) return;
  renderer.draw(pendingFrames[0], pendingFrames[1]);
  pendingFrames = [null, null];
}

// Startup
function start() {
  const dataUri1 = "http://localhost:5173/avc.mp4";
  const dataUri2 = "http://localhost:5173/avc.mp4";

  // Get the renderer type from the query parameter
  const urlParams = new URLSearchParams(window.location.search);
  const rendererType = urlParams.get("type");

  // Pick a renderer to use based on the query parameter
  if (rendererType === "fabric") {
    renderer = new FabricRenderer();
  } else if (rendererType === "optimized") {
    renderer = new OptimizedFabricRenderer();
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

  // Set up two VideoDecoders
  const setupDecoder = (index: number) => {
    return new VideoDecoder({
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
        renderFrame(frame, index);
      },
      error(e) {
        console.log(`ERROR: decode ${index}: `, e);
      },
    });
  };

  const decoder1 = setupDecoder(0);
  const decoder2 = setupDecoder(1);

  // Fetch and demux the media data for both videos
  new MP4Demuxer(dataUri1, {
    onConfig(config) {
      setStatus(
        "decode1",
        `${config.codec} @ ${config.codedWidth}x${config.codedHeight}`
      );
      decoder1.configure(config);
    },
    onChunk(chunk) {
      decoder1.decode(chunk);
    },
    setStatus,
  });

  new MP4Demuxer(dataUri2, {
    onConfig(config) {
      setStatus(
        "decode2",
        `${config.codec} @ ${config.codedWidth}x${config.codedHeight}`
      );
      decoder2.configure(config);
    },
    onChunk(chunk) {
      decoder2.decode(chunk);
    },
    setStatus,
  });
}

start();
