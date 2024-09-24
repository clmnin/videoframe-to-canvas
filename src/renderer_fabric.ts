import { fabric } from "fabric";

function initializeCanvas() {
  const canvas = new fabric.Canvas("videoCanvas", {
    width: 640,
    height: 480,
  });
  return canvas;
}

export class FabricRenderer {
  canvas: fabric.Canvas | null = null;
  imgInstance: fabric.Image | null = null;

  constructor() {
    this.canvas = initializeCanvas();
  }

  async draw(frame: VideoFrame) {
    if (this.canvas) {
      // Adjust canvas size if needed
      this.canvas.setDimensions({
        width: frame.displayWidth,
        height: frame.displayHeight,
      });

      // Create a temporary canvas to draw the VideoFrame
      const tempCanvas = document.createElement("canvas");
      tempCanvas.width = frame.displayWidth;
      tempCanvas.height = frame.displayHeight;
      const ctx = tempCanvas.getContext("2d");

      if (ctx) {
        // Draw the VideoFrame onto the temporary canvas
        ctx.drawImage(frame, 0, 0);

        if (!this.imgInstance) {
          // Create a new Fabric.js Image object
          this.imgInstance = new fabric.Image(tempCanvas, {
            left: 0,
            top: 0,
          });
          this.canvas.add(this.imgInstance);
        } else {
          // Update the existing Fabric.js Image object
          this.imgInstance.setElement(tempCanvas);
          this.imgInstance.setCoords();
        }

        this.canvas.renderAll();
      }

      frame.close();
    }
  }
}
