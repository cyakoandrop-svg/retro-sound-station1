/**
 * Web Workerを利用した高精度・バックグラウンド耐性タイマー
 * ブラウザが別タブや最小化された際のsetInterval/setTimeoutの1000msスロットリングや停止を防止
 */
export class BackgroundTimer {
  private worker: Worker | null = null;
  private fallbackTimerId: number | null = null;
  private onTick: () => void;
  private intervalMs: number;
  private isRunning: boolean = false;

  constructor(onTick: () => void, intervalMs: number) {
    this.onTick = onTick;
    this.intervalMs = intervalMs;
    this.initWorker();
  }

  private initWorker() {
    try {
      // インラインWeb Workerの生成（別外部ファイルロードの依存やCORS問題を完全に排除）
      const workerBlob = new Blob([
        `let timerId = null;
         self.onmessage = function(e) {
           if (e.data.action === 'start') {
             if (timerId !== null) clearInterval(timerId);
             timerId = setInterval(function() {
               self.postMessage('tick');
             }, e.data.interval);
           } else if (e.data.action === 'stop') {
             if (timerId !== null) {
               clearInterval(timerId);
               timerId = null;
             }
           }
         };`
      ], { type: 'application/javascript' });

      const workerUrl = URL.createObjectURL(workerBlob);
      this.worker = new Worker(workerUrl);
      this.worker.onmessage = (e) => {
        if (e.data === 'tick' && this.isRunning) {
          this.onTick();
        }
      };
      // 不要になったBlob URLはrevoke
      URL.revokeObjectURL(workerUrl);
    } catch (e) {
      console.warn('Web Worker timer not supported or failed to initialize, using fallback timer', e);
      this.worker = null;
    }
  }

  public start() {
    this.isRunning = true;
    if (this.worker) {
      this.worker.postMessage({ action: 'start', interval: this.intervalMs });
    } else {
      if (this.fallbackTimerId !== null) clearInterval(this.fallbackTimerId);
      this.fallbackTimerId = window.setInterval(() => {
        if (this.isRunning) this.onTick();
      }, this.intervalMs);
    }
  }

  public stop() {
    this.isRunning = false;
    if (this.worker) {
      this.worker.postMessage({ action: 'stop' });
    }
    if (this.fallbackTimerId !== null) {
      clearInterval(this.fallbackTimerId);
      this.fallbackTimerId = null;
    }
  }

  public destroy() {
    this.stop();
    if (this.worker) {
      this.worker.terminate();
      this.worker = null;
    }
  }
}
