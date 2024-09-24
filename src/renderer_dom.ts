export class Canvas2DRenderer {
  canvas: HTMLCanvasElement | null = null;
  ctx: CanvasRenderingContext2D | null = null;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d");
  }

  draw(frame1: VideoFrame | null, frame2: VideoFrame | null) {
    if (this.canvas && this.ctx) {
      const width = Math.max(
        frame1?.displayWidth || 0,
        frame2?.displayWidth || 0
      );
      const height = Math.max(
        frame1?.displayHeight || 0,
        frame2?.displayHeight || 0
      );

      this.canvas.width = width * 2;
      this.canvas.height = height * 2;

      if (frame1) {
        this.ctx.drawImage(frame1, 0, 0, width, height);
        frame1.close();
      }

      if (frame2) {
        this.ctx.drawImage(frame2, width, height, width, height);
        frame2.close();
      }
    }
  }
}
