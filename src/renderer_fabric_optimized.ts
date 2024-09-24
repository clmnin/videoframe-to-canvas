import { fabric } from "fabric";

export class OptimizedFabricRenderer {
  canvas: fabric.StaticCanvas;
  ctx: CanvasRenderingContext2D;
  imgElements: [HTMLCanvasElement, HTMLCanvasElement];

  constructor() {
    const canvasElement = document.getElementById(
      "videoCanvas"
    ) as HTMLCanvasElement;
    this.canvas = new fabric.StaticCanvas(canvasElement, {
      enableRetinaScaling: false,
      skipOffscreen: true,
    });
    this.ctx = this.canvas.getContext();

    // Pre-create canvases for video frames
    this.imgElements = [
      document.createElement("canvas"),
      document.createElement("canvas"),
    ];
  }

  draw(frame1: VideoFrame | null, frame2: VideoFrame | null) {
    const width = Math.max(
      frame1?.displayWidth || 0,
      frame2?.displayWidth || 0
    );
    const height = Math.max(
      frame1?.displayHeight || 0,
      frame2?.displayHeight || 0
    );

    // Set canvas size only if it has changed
    if (this.canvas.width !== width * 2 || this.canvas.height !== height * 2) {
      this.canvas.setDimensions({ width: width * 2, height: height * 2 });
    }

    // Clear the entire canvas
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    // Draw frames directly to the canvas context
    this.drawFrame(frame1, 0, width, height);
    this.drawFrame(frame2, 1, width, height);

    // Update Fabric.js objects to reflect the changes
    this.canvas.requestRenderAll();

    // Close frames
    frame1?.close();
    frame2?.close();
  }

  private drawFrame(
    frame: VideoFrame | null,
    index: number,
    width: number,
    height: number
  ) {
    if (frame) {
      const imgElement = this.imgElements[index];
      imgElement.width = frame.displayWidth;
      imgElement.height = frame.displayHeight;
      const imgCtx = imgElement.getContext("2d");

      if (imgCtx) {
        imgCtx.drawImage(frame, 0, 0);
        this.ctx.drawImage(
          imgElement,
          index === 0 ? 0 : width,
          index === 0 ? 0 : height,
          width,
          height
        );
      }
    }
  }
}
