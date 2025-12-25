'use client';

import { useEffect, useRef, forwardRef } from 'react';
import { useRemoteParticipants } from '@livekit/components-react';

interface AgentAudioRendererProps {
  // Empty props interface for future extensibility
}

/**
 * Custom audio renderer that exposes the agent's audio element
 * for use with the audio analyzer (lip-sync)
 */
export const AgentAudioRenderer = forwardRef<HTMLAudioElement | null, AgentAudioRendererProps>(
  (props, ref) => {
    const participants = useRemoteParticipants();
    const audioRef = useRef<HTMLAudioElement>(null);

    useEffect(() => {
      // Find agent participant (usually the first remote participant)
      const agentParticipant = participants.find(
        (p) => p.identity.includes('agent') || participants.length === 1
      );

      if (!agentParticipant || !audioRef.current) return;

      // Get agent's audio track
      const audioPublication = Array.from(agentParticipant.audioTrackPublications.values())[0];

      if (audioPublication?.track) {
        audioPublication.track.attach(audioRef.current);
      }

      return () => {
        if (audioPublication?.track && audioRef.current) {
          audioPublication.track.detach(audioRef.current);
        }
      };
    }, [participants]);

    // Expose ref to parent
    useEffect(() => {
      if (typeof ref === 'function') {
        ref(audioRef.current);
      } else if (ref) {
        ref.current = audioRef.current;
      }
    }, [ref]);

    return <audio ref={audioRef} autoPlay playsInline />;
  }
);

AgentAudioRenderer.displayName = 'AgentAudioRenderer';
