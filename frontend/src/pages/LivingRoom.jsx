import { useRef, useEffect, useState } from 'react';
import * as faceapi from '@vladmandic/face-api';
import gsap from 'gsap';
import * as tf from '@tensorflow/tfjs';

const sanitizeDescriptor = (descriptorString) => {
  if (!descriptorString) return null;

  const parts = descriptorString.split(',').map(Number);

  if (parts.length !== 128) {
    console.error(`sanitizeDescriptor: expected 128 values, got ${parts.length}`);
    return null;
  }

  // Check for NaN, Infinity, or values massively outside [-1, 1].
  // face-api.js FaceRecognitionNet descriptors are L2-normalized unit vectors,
  // so all values MUST be in [-1, 1]. Anything larger means the Float32Array
  // was serialized incorrectly (e.g. scientific notation overflow, wrong model).
  const maxAbs = Math.max(...parts.map(Math.abs));
  if (!isFinite(maxAbs) || maxAbs > 2) {
    console.error(
      `sanitizeDescriptor: descriptor values are out of range (max abs = ${maxAbs}). ` +
      `This entry was saved with corrupted serialization and must be re-registered. Skipping.`
    );
    return null;
  }

  return new Float32Array(parts);
};

export default function LivingRoom() {
  const videoRef = useRef();
  const canvasRef = useRef();
  const identifiedPersonRef = useRef(null);
  const isUnknownFaceRef = useRef(false);
  const faceMatcherRef = useRef(null);
<<<<<<< HEAD
  const intervalRef = useRef(null);
  
  // New Refs for Autonomous Flow
  const orbRef = useRef(null);
  const recognitionRef = useRef(null);
  const currentDescriptorRef = useRef(null);
  const isRegisteringRef = useRef(false);
  const cooldownRef = useRef(false);
  const streamRef = useRef(null);
  // Ref mirrors for values that must be read inside setInterval / speech callbacks
  // without going stale. Always update these alongside their state counterparts.
  const voiceStateRef = useRef("idle");
=======
  const intervalRef = useRef(null); // Add this at the top with your other refs
>>>>>>> face-differentiation-branch

  // App State
  const [isInitializing, setIsInitializing] = useState(true);
  const [identifiedPerson, setIdentifiedPerson] = useState(null);
  const [contextData, setContextData] = useState(null);

  // Vision State
  const [isUnknownFace, setIsUnknownFace] = useState(false);
  const [isCameraOn, setIsCameraOn] = useState(false);

  // Voice & Conversation State
  // voiceState: "idle" | "greeting" | "listeningForName" | "recordingContext"
  const [voiceState, setVoiceState] = useState("idle");

  // Helper: set voiceState AND keep the ref in sync atomically
  const setVoiceStateSynced = (val) => {
    voiceStateRef.current = val;
    setVoiceState(val);
  };
  const [conversationTranscript, setConversationTranscript] = useState("");
  const [orbState, setOrbState] = useState("idle");

  // --- DEBUG STATE (remove once recognition is confirmed working) ---
  const [debugInfo, setDebugInfo] = useState({
    matcherReady: false,
    matcherLabels: [],
    detectionCount: 0,
    lastMatchLabel: '—',
    lastMatchDistance: '—',
    descriptorSample: '—',
    savedDescriptorSample: '—',
  });

  const initializeFaceMatcher = async () => {
    try {
      const res = await fetch('http://localhost:5000/api/memories');
      if (res.ok) {
        const json = await res.json();
        console.log(`📦 DB returned ${json.data?.length ?? 0} memories`);
        if (json.success && Array.isArray(json.data)) {
          const labeledDescriptors = [];
          json.data.forEach(memory => {
            if (memory.name && memory.faceDescriptor) {
              const rawParts = memory.faceDescriptor.split(',').map(Number);
              const cleanArray = sanitizeDescriptor(memory.faceDescriptor);

              console.group(`🧠 Loading: ${memory.name}`);
              console.log('Raw string length (comma count):', rawParts.length);
              console.log('Raw[0] (pre-sanitize):', rawParts[0]);
              console.log('Clean[0] (post-sanitize):', cleanArray?.[0]);
              console.log('Clean array length:', cleanArray?.length);
              console.log('All values in [-1,1]?', cleanArray ? [...cleanArray].every(v => v >= -1 && v <= 1) : false);
              console.groupEnd();

              if (cleanArray && cleanArray.length === 128) {
                labeledDescriptors.push(new faceapi.LabeledFaceDescriptors(
                  memory.name,
                  [cleanArray]
                ));

                setDebugInfo(prev => ({
                  ...prev,
                  savedDescriptorSample: `[${cleanArray.slice(0, 3).map(v => v.toFixed(4)).join(', ')}...]`,
                }));
              } else {
                console.error(`❌ Descriptor rejected for ${memory.name}: length=${cleanArray?.length}`);
              }
            }
          });

          const labels = labeledDescriptors.map(l => l.label);
          if (labeledDescriptors.length > 0) {
            faceMatcherRef.current = new faceapi.FaceMatcher(labeledDescriptors, 0.6);
            console.log(`✅ FaceMatcher built with labels: [${labels.join(', ')}] @ threshold 0.6`);
            setDebugInfo(prev => ({ ...prev, matcherReady: true, matcherLabels: labels }));
          } else {
            console.warn('⚠️ No valid descriptors — FaceMatcher NOT built');
            setDebugInfo(prev => ({ ...prev, matcherReady: false, matcherLabels: [] }));
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
    // ADD THESE TWO LINES FIRST:
    await tf.setBackend('webgl');
    await tf.ready();

<<<<<<< HEAD
    await Promise.all([
      faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
      faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
      faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
    ]);

    console.log("All models loaded ✅");
    console.log("TF backend:", tf.getBackend()); // should say 'webgl'
    setIsInitializing(false);
  } catch (error) {
    console.error("Error loading models:", error);
  }
};
    loadModels();
  }, []);

  // Set up continuous GSAP Anti-Gravity Orb animation
  useEffect(() => {
    if (orbRef.current) {
      gsap.to(orbRef.current, {
        y: -15,
        yoyo: true,
        repeat: -1,
        ease: "sine.inOut",
        duration: 2
      });
    }
  }, [orbRef.current, orbState]);

  useEffect(() => {
    if (isCameraOn) startVideo();
    else stopVideo();
  }, [isCameraOn]);

=======
        console.log("All models loaded ✅");
        initializeFaceMatcher();
        setIsInitializing(false);
      } catch (error) {
        console.error("Error loading models:", error);
      }
    };
    loadModels();
  }, []);

>>>>>>> face-differentiation-branch
  const startVideo = () => {
    navigator.mediaDevices.getUserMedia({
      video: {
        width: 640,
        height: 480,
        facingMode: "user"
      }
    })
      .then((stream) => {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
      });
  };

  const stopVideo = () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop());
    
    if (recognitionRef.current) {
        recognitionRef.current.stop();
    }
    
    setIdentifiedPerson(null);
    identifiedPersonRef.current = null;
    isUnknownFaceRef.current = false;
    setIsUnknownFace(false);
    setVoiceStateSynced("idle");
    setConversationTranscript("");
  };

<<<<<<< HEAD
  // --- PURE face-api.js RECOGNITION PIPELINE ---
  // Replaces the broken hybrid DeepFace approach.
  // All detection, landmark, descriptor extraction, and matching happens
  // entirely in the browser using the already-loaded face-api.js models.
  // No Python server, no /api/match-face route needed.
=======
  useEffect(() => {
    if (isCameraOn) startVideo();
    else stopVideo();
  }, [isCameraOn]);

  // --- HYBRID VERIFICATION LOGIC ---
  const verifyWithDeepFace = async () => {
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
      // 1️⃣ Get embedding from DeepFace
      const response = await fetch("http://localhost:8000/embed", {
        method: "POST",
        body: formData,
      });

      const text = await response.text();

      let data;
      try {
        data = JSON.parse(text);
      } catch {
        console.error("❌ Not JSON from DeepFace:", text);
        return;
      }

      if (!data.success) {
        identifiedPersonRef.current = null;
        return;
      }

      console.log("DeepFace Embedding Received:", data.embedding);

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
          headers: { "Content-Type": "application/json" },
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
      } else if (matchData.isUnknown) {
        setIsUnknownFace(true);
        identifiedPersonRef.current = "Stranger";
      } else {
        identifiedPersonRef.current = null;
      }
    } catch (err) {
      console.error("DeepFace verification failed:", err);
      identifiedPersonRef.current = null;
    }
  };
  // 3. The Real-Time Face Tracking Loop

>>>>>>> face-differentiation-branch

  const handleVideoOnPlay = () => {
    if (intervalRef.current) clearInterval(intervalRef.current);

    intervalRef.current = setInterval(async () => {
      // Read ONLY from refs — never from React state — to avoid stale closures.
      if (isRegisteringRef.current) return;
      if (cooldownRef.current) return;
      if (!videoRef.current || videoRef.current.readyState !== 4) return;
      if (!canvasRef.current) return;

      // Run full pipeline: detect faces + landmarks + 128-d descriptors in one pass.
      // withFaceLandmarks + withFaceDescriptors is required to get the descriptor
      // vector that FaceMatcher.findBestMatch() operates on.
      const detections = await faceapi
        .detectAllFaces(videoRef.current, new faceapi.TinyFaceDetectorOptions({
          inputSize: 320,
          scoreThreshold: 0.5,
        }))
        .withFaceLandmarks()
        .withFaceDescriptors();

      // Draw bounding boxes on the canvas overlay.
      const displaySize = { width: videoRef.current.videoWidth, height: videoRef.current.videoHeight };
      faceapi.matchDimensions(canvasRef.current, displaySize);
      const resized = faceapi.resizeResults(detections, displaySize);
      const ctx = canvasRef.current.getContext('2d');
      ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
      faceapi.draw.drawDetections(canvasRef.current, resized);

      const currentlyIdentified = identifiedPersonRef.current;
      const currentlyUnknown = isUnknownFaceRef.current;

      // Update live detection count in debug panel
      setDebugInfo(prev => ({ ...prev, detectionCount: detections.length }));

      if (detections.length === 0) {
        // No face in frame — reset so next appearance triggers fresh detection.
        if (!currentlyUnknown) {
          identifiedPersonRef.current = null;
        }
        return;
      }

      // A face is present but we already know who it is — nothing to do.
      if (currentlyIdentified && currentlyIdentified !== "Verifying...") return;
      if (currentlyUnknown) return;

      // Mark as verifying so we don't fire multiple concurrent checks.
      identifiedPersonRef.current = "Verifying...";

      // Take the descriptor of the largest (first) detected face.
      const descriptor = detections[0].descriptor;

      console.log('RAW DESCRIPTOR CHECK:', descriptor.constructor.name, descriptor.length, descriptor[0], descriptor[1], descriptor[2]);

      // Log live descriptor sample so we can compare it with the saved one
      setDebugInfo(prev => ({
        ...prev,
        descriptorSample: `[${descriptor.slice(0, 3).map(v => v.toFixed(4)).join(', ')}...]`,
      }));

      // If the FaceMatcher has been built (at least one person registered),
      // attempt a match. Otherwise treat as unknown immediately.
      if (faceMatcherRef.current) {
        const bestMatch = faceMatcherRef.current.findBestMatch(descriptor);
        console.log(`🔍 Best match: "${bestMatch.label}" @ distance ${bestMatch.distance.toFixed(3)}`);
        setDebugInfo(prev => ({
          ...prev,
          lastMatchLabel: bestMatch.label,
          lastMatchDistance: bestMatch.distance.toFixed(3),
        }));

        if (bestMatch.label !== 'unknown') {
          // ✅ RECOGNIZED
          const name = bestMatch.label;
          identifiedPersonRef.current = name;
          setIdentifiedPerson(name);
          isUnknownFaceRef.current = false;
          setIsUnknownFace(false);
          fetchContextFromBackend(name);
          if (voiceStateRef.current === "idle") {
            startContinuousListening();
          }
          return;
        }
      }

      // ❓ UNKNOWN — nobody in DB matched this face.
      // Store the raw Float32Array descriptor so handleAutoRegister can
      // serialize it directly without going through DeepFace.
      currentDescriptorRef.current = descriptor;
      isUnknownFaceRef.current = true;
      setIsUnknownFace(true);
      identifiedPersonRef.current = "Stranger";

      if (voiceStateRef.current === "idle" && !isRegisteringRef.current) {
        isRegisteringRef.current = true;
        handleUnknownFaceGreeting(descriptor);
      }
    }, 500);
  };

  // --- VOICE AUTOMATION LOGIC ---

  const handleUnknownFaceGreeting = (descriptor) => {
    isRegisteringRef.current = true;
    setVoiceStateSynced("greeting");
    // descriptor is the Float32Array from face-api.js, already stored in
    // currentDescriptorRef by the interval before this function was called.
    // We store it here too as a safety net in case the ref was overwritten.
    currentDescriptorRef.current = descriptor;

    const utterance = new SpeechSynthesisUtterance("Hello, I don't recognize you. What is your name?");
    utterance.onend = () => {
        // STATE 2: LISTENING FOR NAME
        startListeningForName();
    };
    window.speechSynthesis.speak(utterance);
  };

  const startListeningForName = () => {
    setVoiceStateSynced("listeningForName");
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
        console.warn("Speech recognition not supported in this browser.");
        return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = 'en-US';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      const cleanName = transcript.replace(/[.,]/g, '').trim();
      
      console.log("🎤 SPEECH CAPTURED:", cleanName);
      // Auto register the user with this name
      handleAutoRegister(cleanName);
    };

    recognition.onend = () => {
      // BUG FIX 2: Do NOT release isRegisteringRef here.
      // onend fires as soon as the mic closes — before the async DB save
      // in handleAutoRegister completes. Releasing the lock here creates a
      // race condition where the camera interval sees an unlocked, still-unknown
      // face and fires a second greeting cycle. The lock is released exclusively
      // inside handleAutoRegister once the save is fully confirmed.
    };

    recognition.start();
    recognitionRef.current = recognition;
  };

  const handleAutoRegister = async (name) => {
    try {
      // currentDescriptorRef holds the face-api.js Float32Array (128 values, -1 to 1)
      // captured by the interval at the moment the unknown face was detected.
      if (!currentDescriptorRef.current || currentDescriptorRef.current.length !== 128) {
        console.error("🚨 No valid descriptor captured — cannot register.");
        isRegisteringRef.current = false;
        return;
      }
      // SERIALIZATION FIX: Float32Array values must be rounded to 8 decimal
      // places before joining. A raw Float32Array converted with Array.from()
      // can produce values in scientific notation (e.g. 3.4e+38) for overflow
      // entries — these round-trip through JSON/MongoDB as billion-scale numbers
      // that no threshold correction can fix. parseFloat(toFixed(8)) forces each
      // value into a safe, human-readable decimal string within [-1, 1].
      const serializedDescriptor = Array.from(currentDescriptorRef.current)
        .map(v => parseFloat(v.toFixed(8)))
        .join(',');

      // Verify the values look sane before sending
      const sampleVals = Array.from(currentDescriptorRef.current).slice(0, 3).map(v => v.toFixed(4));
      console.log("🚀 SENDING TO DB:", { name, descriptorValues: currentDescriptorRef.current.length, sample: sampleVals });

      const res = await fetch('http://localhost:5000/api/memory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          name: name, 
          relation: 'Friend',
          text: `Met ${name} today.`,
          faceDescriptor: serializedDescriptor
        })
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        console.error("🚨 BACKEND REJECTED SAVE:", data);
        isRegisteringRef.current = false;
        return;
      }

      console.log("✅ SAVED TO DB SUCCESSFULLY!", data);
      await initializeFaceMatcher(); // Reload the brain

      // BUG FIX 3: Update isUnknownFaceRef alongside state so the interval
      // reads the correct value via its ref-based checks.
      isUnknownFaceRef.current = false;
      setIsUnknownFace(false);

      setIdentifiedPerson(name);
      identifiedPersonRef.current = name;
      fetchContextFromBackend(name);

      // Set cooldown BEFORE releasing the registering lock so the interval
      // cannot slip through the gap between the two assignments.
      cooldownRef.current = true;
      setTimeout(() => {
        cooldownRef.current = false;
      }, 8000); // 8-second grace period after registering

      // BUG FIX 2 (continued): Lock released here — only after DB save,
      // matcher reload, and cooldown are all in place.
      isRegisteringRef.current = false;

      // Turn on continuous recording for this new person
      startContinuousListening();
    } catch (error) {
      console.error("🚨 Registration Error (Network/Catch):", error);
      isRegisteringRef.current = false;
    }
  };

  const startContinuousListening = () => {
    setVoiceStateSynced("recordingContext");
    setConversationTranscript(""); // Reset on new continuous session
    
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    if (recognitionRef.current) {
        recognitionRef.current.stop();
    }

    const recognition = new SpeechRecognition();
    recognition.lang = 'en-US';
    recognition.continuous = true;
    recognition.interimResults = true;

    recognition.onresult = (event) => {
        let currentTranscript = '';
        for (let i = 0; i < event.results.length; i++) {
          currentTranscript += event.results[i][0].transcript;
        }
        setConversationTranscript(currentTranscript);
    };

    recognition.onend = () => {
      // BUG FIX 4: Read voiceStateRef (not voiceState) here.
      // voiceState is React state captured at closure creation — it is always
      // stale inside this callback. voiceStateRef is a ref and always current.
      if (voiceStateRef.current === "recordingContext") {
          recognition.start();
      }
    };

    recognition.start();
    recognitionRef.current = recognition;
  };

  const saveConversationContext = async () => {
      if (!conversationTranscript || !identifiedPerson) return;
      
      setOrbState("summarizing");

      try {
        const response = await fetch('http://localhost:5000/api/update-context', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ name: identifiedPerson, transcript: conversationTranscript })
        });
        
        if (response.ok) {
          setOrbState("saved");
          setConversationTranscript("");
          
          setTimeout(() => {
              setOrbState("idle");
          }, 4000);
        } else {
          setOrbState("idle");
        }
      } catch (error) {
        console.error("Error saving context", error);
        setOrbState("idle");
      }
  };

  const fetchContextFromBackend = async (name) => {
    try {
      const res = await fetch('http://localhost:5000/api/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: `Who is ${name}?` }),
      });
      const data = await res.json();
      if (data.success) {
        setContextData(data.response);
      }
    } catch {
      console.error("Backend offline");
    }
  };

  const handleNotThisPerson = () => {
    setIdentifiedPerson(null);
    identifiedPersonRef.current = null;
    setContextData(null);
    isUnknownFaceRef.current = true;
    setIsUnknownFace(true);
    
    // Switch to manual mode if automated flow failed
    setVoiceStateSynced("idle");
  };

  const recognitionState = isInitializing
    ? 'Loading models'
    : isUnknownFace
      ? 'New visitor'
      : identifiedPerson
        ? 'Recognized'
        : isCameraOn
          ? 'Scanning'
          : 'Standby';

  return (
<<<<<<< HEAD
    <div className="px-12 h-full">
      <div className="grid grid-cols-10 gap-8 h-[calc(100vh-160px)] relative">

        {/* GSAP Anti-Gravity Orb Feedback UI */}
        {(orbState === "summarizing" || orbState === "saved") && (
            <div 
                ref={orbRef} 
                className="absolute top-10 right-10 z-50 flex items-center gap-4 bg-surface-container-lowest/90 backdrop-blur-xl px-6 py-3 rounded-full border border-white/20 shadow-2xl transition-colors duration-500"
                style={{
                    backgroundColor: orbState === "summarizing" ? 'rgba(251, 146, 60, 0.2)' : 'rgba(34, 197, 94, 0.2)',
                    boxShadow: orbState === "summarizing" ? '0 0 40px rgba(251, 146, 60, 0.4)' : '0 0 40px rgba(34, 197, 94, 0.4)'
                }}
            >
                <div className={`w-4 h-4 rounded-full ${orbState === "summarizing" ? 'bg-orange-500 animate-ping' : 'bg-green-500'}`}></div>
                <span className={`font-bold tracking-wider ${orbState === "summarizing" ? 'text-orange-300' : 'text-green-300'}`}>
                    {orbState === "summarizing" ? "Summarizing Memory..." : "Memory Saved!"}
                </span>
            </div>
        )}
=======
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
>>>>>>> face-differentiation-branch

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
                className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold text-white transition-colors ${
                  isCameraOn ? 'bg-error hover:bg-error/90' : 'bg-primary hover:bg-primary/90'
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
<<<<<<< HEAD
              <div className="relative z-10 animate-fade-in flex flex-col items-center justify-center text-center py-6">
                <span className="inline-block bg-amber-100 text-amber-800 px-3 py-1 rounded-full text-xs font-bold mb-4 uppercase animate-pulse">
                  Unrecognized Face
                </span>
                
                {voiceState === "greeting" && (
                    <div className="space-y-4">
                        <span className="material-symbols-outlined text-5xl text-amber-500 animate-bounce">record_voice_over</span>
                        <h3 className="text-xl font-bold text-on-surface">Speaking...</h3>
                    </div>
                )}

                {voiceState === "listeningForName" && (
                    <div className="space-y-4">
                        <div className="relative w-16 h-16 mx-auto bg-amber-500/20 rounded-full flex items-center justify-center animate-pulse">
                            <span className="material-symbols-outlined text-3xl text-amber-600">mic</span>
                         </div>
                        <h3 className="text-xl font-bold text-on-surface">Listening for Name...</h3>
                    </div>
                )}
                 {voiceState === "idle" && (
                    <div className="space-y-4 mt-4">
                         <h3 className="text-lg font-bold text-on-surface">Manual mode enabled</h3>
                         <p className="text-sm text-on-surface-variant">Voice automated flow bypassed</p>
                    </div>
                )}
              </div>
            ) : identifiedPerson ? (
              <div className="relative z-10">
                <span className="inline-block bg-emerald-100 text-emerald-800 px-3 py-1 rounded-full text-xs font-bold mb-4 uppercase animate-pulse">
                  Known Person Detected
=======
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
                      className="w-2/3 rounded-xl bg-primary px-3 py-2.5 text-sm font-bold text-on-primary transition-colors hover:bg-primary/90"
                    >
                      Register
                    </button>
                  </div>
                </form>
              </div>
            ) : identifiedPerson ? (
              <div className="relative z-10">
                <span className="inline-flex items-center rounded-full bg-emerald-100 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-emerald-800">
                  Face Detected
>>>>>>> face-differentiation-branch
                </span>
                <h3 className="mt-4 font-headline text-2xl font-extrabold leading-tight text-on-surface">
                  {identifiedPerson}
                </h3>
                <button
                  onClick={handleNotThisPerson}
                  className="mb-4 mt-1 block text-xs font-bold text-primary hover:underline"
                >
                  Not {identifiedPerson}? Re-Register
                </button>
                <div className="rounded-2xl bg-surface-container-low p-4">
                  <div className="flex items-start gap-3">
                    <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-primary-fixed">
                      <span className="material-symbols-outlined text-xl text-on-primary-fixed-variant">memory</span>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">Retrieved Context</p>
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

<<<<<<< HEAD
          {/* Transcript Monitor */}
          <div className="flex-1 bg-surface-container-low p-6 rounded-lg flex flex-col gap-4 border border-outline-variant/5 min-h-0 relative overflow-hidden">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className={`material-symbols-outlined ${voiceState === "recordingContext" ? "text-red-500 animate-pulse" : "text-on-surface-variant"} text-lg`}>mic</span>
                <h4 className="text-on-surface-variant font-bold text-[10px] uppercase tracking-widest">
                    {voiceState === "recordingContext" ? "Recording Conversation..." : "Awaiting Audio..."}
                </h4>
              </div>
              
              {conversationTranscript && voiceState === "recordingContext" && (
                <button 
                  onClick={saveConversationContext}
                  className="px-4 py-1 text-[10px] font-bold uppercase tracking-wider bg-primary text-white rounded-full hover:bg-primary-container hover:text-on-primary-container transition-colors shadow-md"
                >
                    Save Memory
                </button>
              )}
            </div>
            
            <div className="flex-1 overflow-y-auto">
                <p className="text-on-surface italic text-sm leading-relaxed">
                    {conversationTranscript || "Transcript will appear here once you start speaking..."}
                </p>
            </div>
          </div>

          {/* 🔬 DEBUG PANEL — remove once recognition is confirmed working */}
          <div className="bg-black/80 text-green-400 font-mono text-[10px] p-3 rounded-lg border border-green-900 flex-shrink-0">
            <p className="text-green-300 font-bold mb-2 uppercase tracking-widest">🔬 Recognition Debug</p>
            <div className="space-y-1">
              <p>
                <span className="text-gray-500">Matcher ready:</span>{' '}
                <span className={debugInfo.matcherReady ? 'text-green-400' : 'text-red-400'}>
                  {debugInfo.matcherReady ? '✅ YES' : '❌ NO — no one in DB or descriptor invalid'}
                </span>
              </p>
              <p>
                <span className="text-gray-500">Loaded labels:</span>{' '}
                <span>{debugInfo.matcherLabels.length > 0 ? debugInfo.matcherLabels.join(', ') : '(none)'}</span>
              </p>
              <p>
                <span className="text-gray-500">Faces detected:</span>{' '}
                <span className={debugInfo.detectionCount > 0 ? 'text-green-400' : 'text-yellow-400'}>
                  {debugInfo.detectionCount}
                </span>
              </p>
              <p>
                <span className="text-gray-500">Last match:</span>{' '}
                <span className={debugInfo.lastMatchLabel === 'unknown' ? 'text-red-400' : 'text-green-400'}>
                  {debugInfo.lastMatchLabel}
                </span>
                {' @ distance '}
                <span className={parseFloat(debugInfo.lastMatchDistance) > 0.6 ? 'text-red-400' : 'text-green-400'}>
                  {debugInfo.lastMatchDistance}
                </span>
                <span className="text-gray-500"> (threshold: 0.6)</span>
              </p>
              <p className="text-gray-500 mt-1">Live descriptor:
                <span className="text-blue-300 ml-1">{debugInfo.descriptorSample}</span>
              </p>
              <p className="text-gray-500">Saved descriptor:
                <span className="text-purple-300 ml-1">{debugInfo.savedDescriptorSample}</span>
              </p>
              <p className="text-gray-400 text-[9px] mt-2 italic">
                If distance &gt; 0.6 = too far. Saved '—' = DB load failed. Live '—' = no face yet.
              </p>
=======
          <div className="flex min-h-0 flex-1 flex-col gap-4 rounded-2xl border border-outline-variant/20 bg-surface-container-low p-5">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-lg text-on-surface-variant">mic</span>
              <h4 className="text-[11px] font-bold uppercase tracking-widest text-on-surface-variant">Audio Monitor</h4>
            </div>
            <div className="flex flex-1 items-center justify-center rounded-2xl border border-dashed border-outline-variant/50 bg-surface-container-lowest/70 p-5 text-center">
              <div>
                <p className="font-headline text-lg font-extrabold text-on-surface">Awaiting audio</p>
                <p className="mt-1 text-sm text-on-surface-variant">Conversation cues will appear here.</p>
              </div>
>>>>>>> face-differentiation-branch
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
