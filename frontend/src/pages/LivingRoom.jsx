import { useRef, useEffect, useState } from 'react';
import * as faceapi from 'face-api.js';

const sanitizeDescriptor = (descriptor) => {
  if (!descriptor) return null;

  // 1. Convert to numbers (handle string or array)
  let parts;
  if (Array.isArray(descriptor)) {
    parts = descriptor.map(Number);
  } else if (typeof descriptor === 'string') {
    parts = descriptor.split(',').map(Number);
  } else {
    return null;
  }

  // 2. Check if the first number is huge (like 358924544)
  // Descriptors MUST be between -1 and 1.
  if (parts.length > 0 && Math.abs(parts[0]) > 10) {
    // If it's a billion-scale number, we shift the decimal point 9 places
    return new Float32Array(parts.map(val => val / 1000000000));
  }

  return new Float32Array(parts);
};


export default function LivingRoom() {
  const lastCallRef = useRef(0);
  const videoRef = useRef();
  const canvasRef = useRef();
  const identifiedPersonRef = useRef(null);
  const isUnknownFaceRef = useRef(false);
  const faceMatcherRef = useRef(null);
  const intervalRef = useRef(null); // Add this at the top with your other refs

  // App State
  const [isInitializing, setIsInitializing] = useState(true);
  const [identifiedPerson, setIdentifiedPerson] = useState(null);
  const [contextData, setContextData] = useState(null);
  const [isSummarizing, setIsSummarizing] = useState(false);
  const sessionActiveRef = useRef(false);
  const cooldownRef = useRef(false);
  // WebSocket STT refs (replaces SpeechRecognition)
  const wsRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const audioStreamRef = useRef(null);
  const wsReconnectTimerRef = useRef(null);
  const [voiceStateSynced, setVoiceStateSynced] = useState("idle");
  const voiceStateRef = useRef("idle");
  const [conversationTranscript, setConversationTranscript] = useState("");
  const finalTranscriptRef = useRef("");
  const transcriptUpdateTimeoutRef = useRef(null);

  // New states for Unknown Visitor Registration
  const [isUnknownFace, setIsUnknownFace] = useState(false);
  const [newVisitorName, setNewVisitorName] = useState('');
  const [newVisitorRelation, setNewVisitorRelation] = useState('');
  const [isCameraOn, setIsCameraOn] = useState(false);
  const streamRef = useRef(null); // To keep track of the stream so we can stop it

  const initializeFaceMatcher = async () => {
    try {
      const res = await fetch('http://localhost:5000/api/memories', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      if (res.ok) {
        const json = await res.json();
        if (json.success && Array.isArray(json.data)) {
          const labeledDescriptors = [];

          // Inside initializeFaceMatcher loop
          json.data.forEach(memory => {
            if (memory.name && memory.faceDescriptor) {
              const cleanArray = sanitizeDescriptor(memory.faceDescriptor);

              if (cleanArray && cleanArray.length === 128) {
                labeledDescriptors.push(new faceapi.LabeledFaceDescriptors(
                  memory.name,
                  [cleanArray]
                ));
                console.log(`Successfully loaded and sanitized: ${memory.name}`);
              }
            }
          });

          if (labeledDescriptors.length > 0) {
            // Threshold at 0.6 is standard
            faceMatcherRef.current = new faceapi.FaceMatcher(labeledDescriptors, 0.6);
            console.log("Matcher Ready: Strict Mode Enabled (0.5)");
          }
        }
      }
    } catch (error) {
      console.error("Initialization Error:", error);
    }
  };
  // 1. Load the AI Models when the component mounts
  useEffect(() => {
    const loadModels = async () => {
      const MODEL_URL = '/models';
      try {
        await Promise.all([
          faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
          faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
          faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
        ]);

        console.log("All models loaded ✅");
        initializeFaceMatcher();
        setIsInitializing(false);
      } catch (error) {
        console.error("Error loading models:", error);
      }
    };
    loadModels();
  }, []);

  const startVideo = () => {
    navigator.mediaDevices.getUserMedia({
      video: {
        width: 640,
        height: 480,
        facingMode: "user"
      }
    })
      .then((stream) => {
        console.log("MIC ACTIVE:", stream);
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
      });
  };

  const stopVideo = () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop());
    setIdentifiedPerson(null);
    identifiedPersonRef.current = null;
    setIsUnknownFace(false);
    voiceStateRef.current = "idle";
    setVoiceStateSynced("idle");
    sessionActiveRef.current = false;
  };

  useEffect(() => {
    if (isCameraOn) startVideo();
    else stopVideo();
  }, [isCameraOn]);

  // --- HYBRID VERIFICATION LOGIC ---
  const verifyWithInsightFace = async () => {
    if (!videoRef.current) return;

    const canvas = document.createElement("canvas");
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    canvas.getContext("2d").drawImage(videoRef.current, 0, 0);

    const blob = await new Promise(res =>
      canvas.toBlob(res, "image/jpeg", 0.95)
    );

    const formData = new FormData();
    formData.append("file", blob);

    try {
      // 1️⃣ Get embedding from InsightFace
      const response = await fetch("http://localhost:8000/embed", {
        method: "POST",
        body: formData,
      });

      const text = await response.text();

      let data;
      try {
        data = JSON.parse(text);
      } catch {
        console.error("❌ Not JSON from InsightFace:", text);
        return;
      }

      if (!data.success) {
        identifiedPersonRef.current = null;
        return;
      }

      console.log("InsightFace Embedding Received:", data.embedding);

      // 2️⃣ Throttle API calls
      // eslint-disable-next-line react-hooks/purity
      const now = Date.now();
      if (now - lastCallRef.current <= 2000) return;
      lastCallRef.current = now;

      // 3️⃣ Match face with backend
      const matchRes = await fetch(
        "http://localhost:5000/api/match-face",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${localStorage.getItem('token')}`
          },
          body: JSON.stringify({ embedding: data.embedding }),
        }
      );

      const matchData = await matchRes.json();

      console.log("Match result:", matchData);

      // 4️⃣ Handle result
      if (matchData.found) {
        setIdentifiedPerson(matchData.name);
        identifiedPersonRef.current = matchData.name;

        fetchContextFromBackend(matchData.name);

        if (voiceStateRef.current === "idle" && !wsRef.current) {
          // Allow microphone stream to stabilize first
          setTimeout(() => {
            startWhisperListening();
          }, 1500);
        }
      } else if (matchData.isUnknown) {
        setIsUnknownFace(true);
        isUnknownFaceRef.current = true;
        identifiedPersonRef.current = "Stranger";
      } else {
        identifiedPersonRef.current = null;
      }
    } catch (err) {
      console.error("InsightFace verification failed:", err);
      identifiedPersonRef.current = null;
    }
  };

  // ─────────────────────────────────────────────────────────────────────────
  // FASTER-WHISPER STT  (replaces SpeechRecognition entirely)
  // Architecture: MediaRecorder → raw PCM chunks → WebSocket → FastAPI
  //               → Faster-Whisper → partial/final JSON → React state
  // ─────────────────────────────────────────────────────────────────────────

  const STT_WS_URL = "ws://localhost:8000/ws/stt";
  // We send 16-bit PCM at 16 kHz mono.  MediaRecorder natively gives WebM/Opus,
  // so we decode with an AudioContext + ScriptProcessorNode to get raw PCM.
  const AUDIO_SAMPLE_RATE = 16000;
  const SCRIPT_BUFFER_SIZE = 4096; // samples per ScriptProcessor callback

  const stopWhisperListening = () => {
    console.log("🛑 Stopping Whisper STT...");

    // Stop ScriptProcessorNode audio capture
    if (mediaRecorderRef.current) {
      try { mediaRecorderRef.current.disconnect(); } catch (_) { }
      mediaRecorderRef.current = null;
    }
    // Close AudioContext
    if (audioStreamRef.current) {
      try { audioStreamRef.current.close(); } catch (_) { }
      audioStreamRef.current = null;
    }
    // Close WebSocket
    if (wsRef.current) {
      try { wsRef.current.close(); } catch (_) { }
      wsRef.current = null;
    }
    // Cancel any pending reconnect
    if (wsReconnectTimerRef.current) {
      clearTimeout(wsReconnectTimerRef.current);
      wsReconnectTimerRef.current = null;
    }
  };

  const startWhisperListening = async () => {
    if (voiceStateRef.current === "recordingContext" || wsRef.current) return;
    console.log("🎙️ Starting Faster-Whisper STT via WebSocket...");

    // Reset transcript for new session
    finalTranscriptRef.current = "";
    setConversationTranscript("");

    // ── 1. Request microphone (audio-only, optimised for speech) ──────────
    let micStream;
    try {
      micStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          channelCount: 1,
          sampleRate: AUDIO_SAMPLE_RATE,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
        video: false,
      });
    } catch (err) {
      console.error("🎤 Microphone access denied:", err);
      return;
    }

    // ── 2. Build AudioContext pipeline: mic → ScriptProcessor → PCM bytes ─
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)({
      sampleRate: AUDIO_SAMPLE_RATE,
    });
    audioStreamRef.current = audioCtx;

    const source = audioCtx.createMediaStreamSource(micStream);
    const processor = audioCtx.createScriptProcessor(SCRIPT_BUFFER_SIZE, 1, 1);
    mediaRecorderRef.current = processor;

    // Queue chunks to send; will flush once WS is open
    const pendingChunks = [];

    processor.onaudioprocess = (evt) => {

      // ===== AUDIO BUFFERING VARIABLES =====
      let audioChunks = [];
      let bufferedSamples = 0;

      const BUFFER_SECONDS = 3;
      const TARGET_SAMPLES = AUDIO_SAMPLE_RATE * BUFFER_SECONDS;

      // Voice Activity Detection threshold
      const SILENCE_THRESHOLD = 0.015;

      processor.onaudioprocess = (evt) => {

        const float32 = evt.inputBuffer.getChannelData(0);

        // ===== SIMPLE VAD =====
        let rms = 0;

        for (let i = 0; i < float32.length; i++) {
          rms += float32[i] * float32[i];
        }

        rms = Math.sqrt(rms / float32.length);

        // Ignore silence/noise
        if (rms < SILENCE_THRESHOLD) {
          return;
        }

        // ===== FLOAT32 → INT16 PCM =====
        const int16 = new Int16Array(float32.length);

        for (let i = 0; i < float32.length; i++) {
          int16[i] = Math.max(
            -32768,
            Math.min(32767, float32[i] * 32767)
          );
        }

        // Store chunk
        audioChunks.push(int16);

        bufferedSamples += int16.length;

        // ===== SEND ONLY AFTER 3 SECONDS =====
        if (bufferedSamples >= TARGET_SAMPLES) {

          // Merge all chunks
          const merged = new Int16Array(bufferedSamples);

          let offset = 0;

          for (const chunk of audioChunks) {
            merged.set(chunk, offset);
            offset += chunk.length;
          }

          const audioBuffer = merged.buffer;

          console.log(
            `📤 Sending ${BUFFER_SECONDS}s audio to Whisper`
          );

          if (
            wsRef.current &&
            wsRef.current.readyState === WebSocket.OPEN
          ) {
            wsRef.current.send(audioBuffer);
          } else {
            pendingChunks.push(audioBuffer);
          }

          // Reset buffer
          audioChunks = [];
          bufferedSamples = 0;
        }
      };
    };

    source.connect(processor);
    processor.connect(audioCtx.destination);

    // ── 3. Open WebSocket to FastAPI /ws/stt ─────────────────────────────
    const openWs = () => {
      const ws = new WebSocket(STT_WS_URL);
      ws.binaryType = "arraybuffer";
      wsRef.current = ws;

      ws.onopen = () => {
        console.log("✅ STT WebSocket open");
        // Flush any buffered chunks
        while (pendingChunks.length > 0) {
          ws.send(pendingChunks.shift());
        }
        sessionActiveRef.current = true;
        voiceStateRef.current = "recordingContext";
        setVoiceStateSynced("recordingContext");
      };

      ws.onmessage = (evt) => {
        try {
          const msg = JSON.parse(evt.data);
          if ((msg.type === "partial" || msg.type === "final") && msg.text) {
            finalTranscriptRef.current = msg.text;
            setConversationTranscript(msg.text);
            console.log(`[STT ${msg.type}]`, msg.text);
          }
          if (msg.type === "silence") {
            console.log("[STT] Silence detected by server");
          }
        } catch (_) { }
      };

      ws.onerror = (err) => {
        console.error("STT WebSocket error:", err);
      };

      ws.onclose = (evt) => {
        console.log("🔌 STT WebSocket closed:", evt.code, evt.reason);
        wsRef.current = null;

        // Auto-reconnect if session still active and person identified
        if (
          voiceStateRef.current === "recordingContext" &&
          identifiedPersonRef.current &&
          !cooldownRef.current
        ) {
          console.log("♻️ Reconnecting STT WebSocket in 1.5 s...");
          wsReconnectTimerRef.current = setTimeout(openWs, 1500);
        } else {
          // No person left or session ended
          if (!finalTranscriptRef.current.trim()) {
            voiceStateRef.current = "idle";
            setVoiceStateSynced("idle");
            sessionActiveRef.current = false;
          }
        }
      };
    };

    openWs();
  };

  // 3. The Real-Time Face Tracking Loop



  const handleVideoOnPlay = () => {
    if (intervalRef.current) clearInterval(intervalRef.current);

    intervalRef.current = setInterval(async () => {
      // ✅ REMOVED 'identifiedPerson' from the block list so the loop keeps drawing boxes
      if (!isCameraOn || isInitializing) return;

      if (cooldownRef.current) {
        // Clear the canvas boxes so the UI looks inactive
        if (!canvasRef.current) return;

        const ctx = canvasRef.current.getContext('2d');

        if (!ctx) return;
        ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
        return;
      }

      if (sessionActiveRef.current) {
        // Clear the canvas boxes so it looks clean, and pause detection
        if (!canvasRef.current) return;

        const ctx = canvasRef.current.getContext('2d');

        if (!ctx) return;
        ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
        return;
      }
      if (
        identifiedPersonRef.current ||
        isUnknownFaceRef.current
      ) {
        return;
      }

      const detections = await faceapi.detectAllFaces(
        videoRef.current,
        new faceapi.TinyFaceDetectorOptions({
          inputSize: 320,   // 🔥 increase detection resolution
          scoreThreshold: 0.5 // 🔥 lower = easier detection
        })
      );

      // Draw boxes for UI feedback
      if (
        videoRef.current &&
        videoRef.current.readyState === 4 &&
        canvasRef.current
      ) {
        const displaySize = { width: videoRef.current.videoWidth, height: videoRef.current.videoHeight };
        faceapi.matchDimensions(canvasRef.current, displaySize);
        const resized = faceapi.resizeResults(detections, displaySize);
        const ctx = canvasRef.current.getContext('2d');
        ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
        faceapi.draw.drawDetections(canvasRef.current, resized);
      }

      // ✅ LOGIC: If face exists AND we aren't currently showing a result/form
      if (detections.length > 0 && !identifiedPerson && !isUnknownFaceRef.current) {
        if (identifiedPersonRef.current !== "Verifying...") {
          console.log("Face detected! Sending to InsightFace...");
          console.log("Detections:", detections.length);
          identifiedPersonRef.current = "Verifying...";
          verifyWithInsightFace();
        }
      }

      // ✅ LOGIC: If frame is empty, reset the 'Verifying' block so it can try again later
      if (detections.length === 0 && !isUnknownFaceRef.current && !identifiedPerson) {
        identifiedPersonRef.current = null;
      }
    }, 500);
  };

  // New state for registration feedback
  const [isRegistering, setIsRegistering] = useState(false);

  // --- ENHANCED REGISTRATION LOGIC (MULTI-FRAME AVERAGING) ---
  const handleRegisterVisitor = async (e) => {
    e.preventDefault();
    if (isRegistering) return;

    setIsRegistering(true);

    try {
      if (!videoRef.current) throw new Error("Video stream not available");

      console.log("Registering visitor: Capturing multiple frames for averaging...");
      const embeddings = [];
      const numFrames = 3;

      for (let i = 0; i < numFrames; i++) {
        const canvas = document.createElement("canvas");
        canvas.width = videoRef.current.videoWidth;
        canvas.height = videoRef.current.videoHeight;
        canvas.getContext("2d").drawImage(videoRef.current, 0, 0);

        const blob = await new Promise((res, rej) => {
          canvas.toBlob((b) => {
            if (b) res(b);
            else rej(new Error("Failed to capture image from camera"));
          }, 'image/jpeg', 0.95);
        });

        const formData = new FormData();
        formData.append("file", blob);

        console.log(`Getting embedding for frame ${i + 1}/${numFrames}...`);
        const embedRes = await fetch("http://localhost:8000/embed", { method: "POST", body: formData });
        const embedData = await embedRes.json();

        if (embedData.success && embedData.embedding) {
          embeddings.push(embedData.embedding);
        } else {
          console.warn(`Frame ${i + 1} failed: ${embedData.error}`);
        }

        // Wait 300ms before next capture to get slight facial variations
        if (i < numFrames - 1) await new Promise(res => setTimeout(res, 300));
      }

      if (embeddings.length === 0) {
        throw new Error("Failed to extract stable face features. Please look directly at the camera and ensure good lighting.");
      }

      // Average the embeddings mathematically to create a highly stable anchor point
      const averagedEmbedding = embeddings[0].map((_, colIndex) =>
        embeddings.reduce((sum, row) => sum + row[colIndex], 0) / embeddings.length
      );

      console.log(`Successfully averaged ${embeddings.length} frames.`);

      console.log("Registering visitor: Saving to database...");
      // 2. Save to MERN Backend
      const res = await fetch('http://localhost:5000/api/memory', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          name: newVisitorName,
          relation: newVisitorRelation,
          faceDescriptor: averagedEmbedding,
          text: `${newVisitorName} is my ${newVisitorRelation}.`
        }),
      });

      const resData = await res.json();

      if (res.ok && resData.success) {
        console.log("Registration successful! ✅");
        setIsUnknownFace(false);
        isUnknownFaceRef.current = false;

        setIdentifiedPerson(newVisitorName);
        identifiedPersonRef.current = newVisitorName;
        sessionActiveRef.current = true;

        // Reload matcher so the new person is recognized immediately next time
        initializeFaceMatcher();
        fetchContextFromBackend(newVisitorName);
      } else {
        throw new Error(resData.error || "Failed to save memory to backend.");
      }
    } catch (error) {
      console.error("Registration Error ❌:", error);
      alert(error.message);
    } finally {
      setIsRegistering(false);
    }
  };

  // 4. Fetch the Context from your Node.js Backend
  const fetchContextFromBackend = async (name) => {
    try {
      const res = await fetch(`http://localhost:5000/api/memory/${encodeURIComponent(name)}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const data = await res.json();
      if (data.success) {
        setContextData(data.lastConversation);
      }
    } catch (error) {
      console.error("Failed to fetch past context:", error);
    }
  };

  const saveConversationContext = async (transcript) => {
    if (!identifiedPerson) return;

    if (!transcript || !transcript.trim()) {
      console.log("No text to save.");
      return;
    }

    const wordCount = transcript
      .trim()
      .split(/\s+/)
      .length;

    if (wordCount < 15) {
      console.log("⚠️ Transcript too short. Ignoring.");
      return;
    }

    console.log("💾 Initiating Save Sequence...");
    setIsSummarizing(true);

    // 1. Force the microphone to stop safely before saving
    stopWhisperListening();
    setVoiceStateSynced("idle");

    // 2. Put the camera on a strict Cooldown so it ignores the user while saving
    cooldownRef.current = true;

    try {
      const res = await fetch('http://localhost:5000/api/update-context', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          name: identifiedPersonRef.current, // CRITICAL: This must not be null!
          transcript: transcript
        })
      });

      if (!res.ok) {
        const errorData = await res.json();
        console.error("🚨 BACKEND SAVE FAILED:", errorData);
        setIsSummarizing(false);
        return;
      }

      const data = await res.json();
      if (data.success && data.memory && data.memory.lastConversation) {
        setContextData(data.memory.lastConversation);
      }

      console.log("✅ SAVED TO DB SUCCESSFULLY!");
    } catch (error) {
      console.error("Error saving conversation context:", error);
    } finally {
      setIsSummarizing(false);

      // 3. Reset the session, but KEEP the cooldown active for 5 seconds
      sessionActiveRef.current = false;
      setIdentifiedPerson(null);
      identifiedPersonRef.current = null;
      setConversationTranscript("");
      voiceStateRef.current = "idle";

      console.log("⏳ Room resetting. 5 second cooldown initiated...");
      setTimeout(() => {
        console.log("🟢 Cooldown finished. Camera is active again.");
        cooldownRef.current = false;
      }, 5000); // 5 seconds to walk away
    }
  };

  const handleNotThisPerson = () => {
    setIdentifiedPerson(null);
    identifiedPersonRef.current = null;
    setContextData(null);
    sessionActiveRef.current = false;

    // Force the unknown state to true
    setIsUnknownFace(true);
    isUnknownFaceRef.current = true;

    // Ensure the current descriptor is captured for the new registration
    // This uses the ref we already have in the detection loop
  };

  const recognitionState = isInitializing
    ? 'Loading models'
    : isSummarizing
      ? 'Summarizing Memory...'
      : isUnknownFace
        ? 'New visitor'
        : identifiedPerson
          ? 'Recognized'
          : isCameraOn
            ? 'Scanning'
            : 'Standby';

  return (
    <div className="h-full px-6 lg:px-8">
      <div className="grid min-h-[calc(100vh-130px)] grid-cols-12 gap-5">
        <section className="col-span-12 xl:col-span-8 flex min-h-[520px] flex-col">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-primary">Live room view</p>
              <h3 className="mt-1 font-headline text-2xl font-extrabold text-on-surface">Camera Recognition</h3>
            </div>
            <div className="flex items-center gap-2 rounded-xl border border-outline-variant/30 bg-surface-container-lowest px-3 py-2">
              <span className={`h-2.5 w-2.5 rounded-full ${isCameraOn ? 'bg-emerald-500 animate-pulse' : 'bg-outline-variant'}`}></span>
              <span className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">
                {isCameraOn ? 'Camera live' : 'Camera off'}
              </span>
            </div>
          </div>

          <div className="relative flex-1 overflow-hidden rounded-2xl border border-outline-variant/30 bg-[#07151f] shadow-xl shadow-primary/5">
            {isInitializing && (
              <div className="absolute inset-0 z-40 flex items-center justify-center bg-black/60">
                <div className="rounded-xl border border-white/15 bg-white/10 px-5 py-3 text-sm font-bold text-white backdrop-blur-md">
                  Loading AI models...
                </div>
              </div>
            )}

            <video
              ref={videoRef}
              autoPlay
              muted
              onPlay={handleVideoOnPlay}
              className="absolute top-0 left-0 w-full h-full object-cover"
            />
            <canvas
              ref={canvasRef}
              className="absolute top-0 left-0 w-full h-full object-cover z-10"
            />

            {!isCameraOn && !isInitializing && (
              <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-[#07151f] text-center">
                <span className="material-symbols-outlined mb-3 text-5xl text-primary-fixed-dim">videocam_off</span>
                <p className="font-headline text-xl font-extrabold text-white">Camera is paused</p>
                <p className="mt-1 max-w-sm text-sm text-white/60">Start the camera when someone is in the room.</p>
              </div>
            )}

            <div className="absolute left-5 top-5 z-30 flex items-center gap-2 rounded-xl border border-white/15 bg-black/45 px-3 py-2 text-white backdrop-blur-md">
              <span className={`h-2.5 w-2.5 rounded-full ${isCameraOn ? 'bg-red-500 animate-pulse' : 'bg-white/40'}`}></span>
              <span className="text-[11px] font-bold uppercase tracking-widest">Live Feed</span>
            </div>

            <div className="absolute bottom-5 left-1/2 z-30 flex -translate-x-1/2 items-center gap-2 rounded-2xl border border-white/15 bg-black/45 p-2 backdrop-blur-md">
              <button
                onClick={() => setIsCameraOn(prev => !prev)}
                className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold text-white transition-colors ${isCameraOn ? 'bg-error hover:bg-error/90' : 'bg-primary hover:bg-primary/90'
                  }`}
              >
                <span className="material-symbols-outlined text-xl">
                  {isCameraOn ? 'power_settings_new' : 'videocam'}
                </span>
                {isCameraOn ? 'Stop' : 'Start'}
              </button>
            </div>
          </div>
        </section>

        <section className="col-span-12 xl:col-span-4 flex min-h-[520px] flex-col gap-5">
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-2xl border border-outline-variant/20 bg-surface-container-lowest p-4">
              <p className="text-[11px] font-bold uppercase tracking-widest text-on-surface-variant">Recognition</p>
              <p className="mt-2 font-headline text-xl font-extrabold text-on-surface">{recognitionState}</p>
            </div>
            <div className="rounded-2xl border border-outline-variant/20 bg-surface-container-lowest p-4">
              <p className="text-[11px] font-bold uppercase tracking-widest text-on-surface-variant">Memory</p>
              <p className="mt-2 font-headline text-xl font-extrabold text-on-surface">
                {contextData ? 'Ready' : 'Idle'}
              </p>
            </div>
          </div>

          <div className="relative flex-shrink-0 overflow-hidden rounded-2xl border border-outline-variant/20 bg-surface-container-lowest p-5 shadow-lg shadow-primary/5 transition-all">
            {isUnknownFace ? (
              <div className="relative z-10">
                <span className="inline-flex items-center rounded-full bg-amber-100 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-amber-800">
                  New Visitor Detected
                </span>
                <h4 className="mt-4 font-headline text-xl font-extrabold text-on-surface">Register this face</h4>
                <form onSubmit={handleRegisterVisitor} className="mt-4 space-y-3">
                  <div>
                    <label className="mb-1 block text-sm font-semibold text-on-surface-variant">Name</label>
                    <input
                      type="text"
                      value={newVisitorName}
                      onChange={(e) => setNewVisitorName(e.target.value)}
                      className="w-full rounded-xl border border-outline-variant/40 bg-surface-container-low px-3 py-2.5 text-sm text-on-surface outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
                      placeholder="e.g., Sarah"
                      required
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-semibold text-on-surface-variant">Relationship</label>
                    <input
                      type="text"
                      value={newVisitorRelation}
                      onChange={(e) => setNewVisitorRelation(e.target.value)}
                      className="w-full rounded-xl border border-outline-variant/40 bg-surface-container-low px-3 py-2.5 text-sm text-on-surface outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
                      placeholder="e.g., Daughter"
                      required
                    />
                  </div>
                  <div className="flex gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => {
                        isUnknownFaceRef.current = false;
                        setIsUnknownFace(false);
                        setNewVisitorName('');
                        setNewVisitorRelation('');
                      }}
                      className="w-1/3 rounded-xl border border-outline-variant/30 bg-surface-container-high px-3 py-2.5 text-sm font-bold text-on-surface transition-colors hover:bg-surface-container"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isRegistering}
                      className={`w-2/3 rounded-xl px-3 py-2.5 text-sm font-bold text-on-primary transition-colors ${isRegistering ? 'bg-primary/50 cursor-not-allowed' : 'bg-primary hover:bg-primary/90'}`}
                    >
                      {isRegistering ? 'Registering...' : 'Register'}
                    </button>
                  </div>
                </form>
              </div>
            ) : identifiedPerson ? (
              <div className="relative z-10">
                <span className="inline-flex items-center rounded-full bg-emerald-100 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-emerald-800">
                  Face Detected
                </span>
                <h3 className="mt-4 font-headline text-2xl font-extrabold leading-tight text-on-surface">
                  {identifiedPerson}
                </h3>
                <button
                  onClick={handleNotThisPerson}
                  className="mb-4 mt-1 block text-xs font-bold text-primary hover:underline"
                >
                  Not {identifiedPerson}? Register as New
                </button>
                <div className="rounded-2xl bg-surface-container-low p-4">
                  <div className="flex items-start gap-3">
                    <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-primary-fixed">
                      <span className="material-symbols-outlined text-xl text-on-primary-fixed-variant">memory</span>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">Retrieved Memory</p>
                      <p className="mt-1 text-sm font-semibold leading-relaxed text-on-surface">
                        {contextData || "Scanning memories..."}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex h-44 flex-col items-center justify-center text-center">
                <span className="material-symbols-outlined mb-2 text-5xl text-outline">
                  person_off
                </span>
                <p className="font-headline text-lg font-extrabold text-on-surface">No one in frame</p>
                <p className="mt-1 text-sm text-on-surface-variant">Recognition will begin once a face appears.</p>
              </div>
            )}
          </div>

          <div className="flex min-h-0 flex-1 flex-col gap-4 rounded-2xl border border-outline-variant/20 bg-surface-container-low p-5">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-lg text-on-surface-variant">mic</span>
              <h4 className="text-[11px] font-bold uppercase tracking-widest text-on-surface-variant">Audio Monitor</h4>
            </div>
            <div className="flex flex-1 items-center justify-center rounded-2xl border border-dashed border-outline-variant/50 bg-surface-container-lowest/70 p-5 text-center">
              <div>
                {voiceStateSynced === "recordingContext" ? (
                  <>
                    <p className="font-headline text-lg font-extrabold text-on-surface">Listening...</p>
                    <p className="mt-2 text-sm text-on-surface-variant max-h-32 overflow-y-auto italic">
                      {conversationTranscript || "Say something..."}
                    </p>
                    {identifiedPerson && (
                      <button
                        onClick={() => {
                          voiceStateRef.current = "idle";
                          setVoiceStateSynced("idle");
                          stopWhisperListening();
                          saveConversationContext(conversationTranscript);
                        }}
                        disabled={isSummarizing || !conversationTranscript}
                        className="mt-4 rounded-xl bg-primary px-4 py-2 text-sm font-bold text-on-primary hover:bg-primary/90 disabled:opacity-50"
                      >
                        {isSummarizing ? "Summarizing..." : "End Conversation & Save"}
                      </button>
                    )}
                  </>
                ) : (
                  <>
                    <p className="font-headline text-lg font-extrabold text-on-surface">Awaiting audio</p>
                    <p className="mt-1 text-sm text-on-surface-variant">Conversation cues will appear here.</p>
                  </>
                )}
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
