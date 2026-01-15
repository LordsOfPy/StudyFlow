import { useState, useEffect, useRef, useCallback } from 'react';

type NoiseType = 'white' | 'pink' | 'brown';

export function useNoise() {
    const [isPlaying, setIsPlaying] = useState(false);
    const [volume, setVolume] = useState(0.5);
    const [type, setType] = useState<NoiseType>('brown');

    const audioContextRef = useRef<AudioContext | null>(null);
    const gainNodeRef = useRef<GainNode | null>(null);
    const sourceNodeRef = useRef<AudioBufferSourceNode | null>(null);

    const stop = useCallback(() => {
        if (sourceNodeRef.current) {
            sourceNodeRef.current.stop();
            sourceNodeRef.current.disconnect();
            sourceNodeRef.current = null;
        }
        setIsPlaying(false);
    }, []);

    const play = useCallback((noiseType: NoiseType = type) => {
        if (!audioContextRef.current) {
            audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
        }

        const ctx = audioContextRef.current;

        // Resume context if suspended (browser policy)
        if (ctx.state === 'suspended') {
            ctx.resume();
        }

        // Stop existing sound
        stop();

        const bufferSize = 2 * ctx.sampleRate;
        const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const output = buffer.getChannelData(0);

        // Generate noise
        if (noiseType === 'white') {
            for (let i = 0; i < bufferSize; i++) {
                output[i] = Math.random() * 2 - 1;
            }
        } else if (noiseType === 'pink') {
            let b0, b1, b2, b3, b4, b5, b6;
            b0 = b1 = b2 = b3 = b4 = b5 = b6 = 0.0;
            for (let i = 0; i < bufferSize; i++) {
                const white = Math.random() * 2 - 1;
                b0 = 0.99886 * b0 + white * 0.0555179;
                b1 = 0.99332 * b1 + white * 0.075076;
                b2 = 0.96900 * b2 + white * 0.1538520;
                b3 = 0.86650 * b3 + white * 0.3104856;
                b4 = 0.55000 * b4 + white * 0.5329522;
                b5 = -0.7616 * b5 - white * 0.0168980;
                output[i] = b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362;
                output[i] *= 0.11; // (roughly) compensate for gain
                b6 = white * 0.115926;
            }
        } else if (noiseType === 'brown') {
            let lastOut = 0;
            for (let i = 0; i < bufferSize; i++) {
                const white = Math.random() * 2 - 1;
                output[i] = (lastOut + (0.02 * white)) / 1.02;
                lastOut = output[i];
                output[i] *= 3.5; // (roughly) compensate for gain
            }
        }

        const noiseSource = ctx.createBufferSource();
        noiseSource.buffer = buffer;
        noiseSource.loop = true;

        const gainNode = ctx.createGain();
        gainNode.gain.value = volume;

        noiseSource.connect(gainNode);
        gainNode.connect(ctx.destination);

        sourceNodeRef.current = noiseSource;
        gainNodeRef.current = gainNode;

        noiseSource.start();
        setIsPlaying(true);
        setType(noiseType);
    }, [type, volume, stop]);

    // Handle volume changes
    useEffect(() => {
        if (gainNodeRef.current) {
            gainNodeRef.current.gain.value = volume;
        }
    }, [volume]);

    // Cleanup
    useEffect(() => {
        return () => {
            stop();
            if (audioContextRef.current) {
                audioContextRef.current.close();
            }
        };
    }, [stop]);

    const toggle = () => {
        if (isPlaying) {
            stop();
        } else {
            play();
        }
    };

    return { isPlaying, volume, setVolume, type, setType: (t: NoiseType) => { setType(t); if (isPlaying) play(t); }, toggle };
}
