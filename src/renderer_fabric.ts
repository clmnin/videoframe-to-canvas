import { fabric } from "fabric";

function initializeCanvas() {
  const canvas = new fabric.Canvas("videoCanvas", {
    width: 1280,
    height: 960,
  });
  return canvas;
}

export class FabricRenderer {
  canvas: fabric.Canvas | null = null;
  imgInstances: [fabric.Image | null, fabric.Image | null] = [null, null];

  constructor() {
    this.canvas = initializeCanvas();
  }

  async draw(frame1: VideoFrame | null, frame2: VideoFrame | null) {
    if (this.canvas) {
      const width = Math.max(
        frame1?.displayWidth || 0,
        frame2?.displayWidth || 0
      );
      const height = Math.max(
        frame1?.displayHeight || 0,
        frame2?.displayHeight || 0
      );

      this.canvas.setDimensions({ width: width * 2, height: height * 2 });

      const drawFrame = async (frame: VideoFrame | null, index: number) => {
        if (frame) {
          const tempCanvas = document.createElement("canvas");
          tempCanvas.width = frame.displayWidth;
          tempCanvas.height = frame.displayHeight;
          const ctx = tempCanvas.getContext("2d");

          if (ctx) {
            ctx.drawImage(frame, 0, 0);

            if (!this.imgInstances[index]) {
              this.imgInstances[index] = new fabric.Image(tempCanvas, {
                left: index === 0 ? 0 : width,
                top: index === 0 ? 0 : height,
              });
              this.canvas?.add(this.imgInstances[index]!);
            } else {
              this.imgInstances[index]!.setElement(tempCanvas);
              this.imgInstances[index]!.setCoords();
            }
          }

          frame.close();
        }
      };

      await drawFrame(frame1, 0);
      await drawFrame(frame2, 1);

      this.canvas.renderAll();
    }
  }
}
