declare module 'fix-webm-duration' {
  function fixWebmDuration(
    blob: Blob,
    durationMs: number,
    options?: { logger?: false | ((msg: string) => void) }
  ): Promise<Blob>;

  function fixWebmDuration(
    blob: Blob,
    durationMs: number,
    callback: (fixedBlob: Blob) => void,
    options?: { logger?: false | ((msg: string) => void) }
  ): void;

  export default fixWebmDuration;
}
