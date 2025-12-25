import { useEffect, useState, useRef } from 'react';

export function useAudioAnalyzer(audioElement: HTMLAudioElement | null) {
  const [volume, setVolume] = useState(0);
  const analyzerRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number>();
  const audioContextRef = useRef<AudioContext | null>(null);

  useEffect(() => {
    if (!audioElement) return;

    // Create Web Audio API context
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    audioContextRef.current = audioContext;

    try {
      const source = audioContext.createMediaElementSource(audioElement);
      const analyzer = audioContext.createAnalyser();

      analyzer.fftSize = 256;
      analyzer.smoothingTimeConstant = 0.8;

      source.connect(analyzer);
      analyzer.connect(audioContext.destination);

      analyzerRef.current = analyzer;

      // Analysis loop
      const dataArray = new Uint8Array(analyzer.frequencyBinCount);

      const analyze = () => {
        if (!analyzerRef.current) return;

        analyzerRef.current.getByteFrequencyData(dataArray);

        // Calculate average volume (focusing on speech frequencies 85-255 Hz range)
        const speechRange = dataArray.slice(10, 40); // Approximate speech range
        const average = speechRange.reduce((a, b) => a + b, 0) / speechRange.length;
        const normalized = Math.min(average / 128, 1.0); // 0-1 range

        setVolume(normalized);
        animationFrameRef.current = requestAnimationFrame(analyze);
      };

      analyze();

      return () => {
        if (animationFrameRef.current) {
          cancelAnimationFrame(animationFrameRef.current);
        }
        if (audioContextRef.current?.state !== 'closed') {
          audioContextRef.current?.close();
        }
      };
    } catch (error) {
      console.error('Error setting up audio analyzer:', error);
      return () => {
        if (audioContextRef.current?.state !== 'closed') {
          audioContextRef.current?.close();
        }
      };
    }
  }, [audioElement]);

  return volume;
}
