export interface PtyExitEvent {
  exitCode: number;
  signal?: number;
}

export interface PtyProcess {
  write(data: string): void;
  resize(cols: number, rows: number): void;
  kill(): void;
  onData(listener: (data: string) => void): { dispose(): void };
  onExit(listener: (event: PtyExitEvent) => void): { dispose(): void };
}

export interface SpawnOptions {
  command: string;
  args: string[];
  cwd: string;
  cols: number;
  rows: number;
  env: NodeJS.ProcessEnv;
}

export type PtyFactory = (options: SpawnOptions) => PtyProcess;
