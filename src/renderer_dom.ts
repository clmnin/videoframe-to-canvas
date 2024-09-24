export class Canvas2DRenderer {
  canvas: HTMLCanvasElement | null = null;
  ctx: CanvasRenderingContext2D | null = null;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d");
  }

  draw(frame: VideoFrame) {
    if (this.canvas && this.ctx) {
      this.canvas.width = frame.displayWidth;
      this.canvas.height = frame.displayHeight;
      this.ctx.drawImage(frame, 0, 0, frame.displayWidth, frame.displayHeight);
      frame.close();
    }
  }
}
