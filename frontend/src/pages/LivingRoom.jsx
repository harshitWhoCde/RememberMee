import { useRef, useEffect, useState } from 'react';
import * as faceapi from 'face-api.js';

const sanitizeDescriptor = (descriptorString) => {
  if (!descriptorString) return null;

  // 1. Convert to numbers
  let parts = descriptorString.split(',').map(Number);

  // 2. Check if the first number is huge (like 358924544)
  // Descriptors MUST be between -1 and 1. 
  if (Math.abs(parts[0]) > 10) {
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

  // New states for Unknown Visitor Registration
  const [isUnknownFace, setIsUnknownFace] = useState(false);
  const [newVisitorName, setNewVisitorName] = useState('');
  const [newVisitorRelation, setNewVisitorRelation] = useState('');
  const [isCameraOn, setIsCameraOn] = useState(false);
  const streamRef = useRef(null); // To keep track of the stream so we can stop it

  const initializeFaceMatcher = async () => {
    try {
      const res = await fetch('http://localhost:5000/api/memories');
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
  };

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
        isUnknownFaceRef.current = true;
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


  const handleVideoOnPlay = () => {
    if (intervalRef.current) clearInterval(intervalRef.current);

    intervalRef.current = setInterval(async () => {
      // ✅ REMOVED 'identifiedPerson' from the block list so the loop keeps drawing boxes
      if (!isCameraOn || isInitializing) return;

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
          console.log("Face detected! Sending to DeepFace...");
          console.log("Detections:", detections.length);
          identifiedPersonRef.current = "Verifying...";
          verifyWithDeepFace();
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

  // --- REGISTRATION LOGIC ---
  const handleRegisterVisitor = async (e) => {
    e.preventDefault();
    if (isRegistering) return;

    setIsRegistering(true);

    try {
      if (!videoRef.current) throw new Error("Video stream not available");

      // Capture the face for the new embedding
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

      console.log("Registering visitor: Getting embedding...");
      // 1. Get embedding from Python
      const embedRes = await fetch("http://localhost:8000/embed", { method: "POST", body: formData });
      const embedData = await embedRes.json();

      if (!embedData.success) {
        throw new Error(embedData.error || "Failed to extract face features. Please look directly at the camera.");
      }

      console.log("Registering visitor: Saving to database...");
      // 2. Save to MERN Backend
      // Convert embedding array to comma-separated string for Mongoose compatibility
      const descriptorString = Array.isArray(embedData.embedding)
        ? embedData.embedding.join(',')
        : String(embedData.embedding);

      const res = await fetch('http://localhost:5000/api/memory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newVisitorName,
          relation: newVisitorRelation,
          faceDescriptor: embedData.embedding,
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
      const res = await fetch('http://localhost:5000/api/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: `Who is ${name}?` }),
      });
      const data = await res.json();
      if (data.success) {
        setContextData(data.response); // e.g., "Rahul is your son. You played chess."
      }
    } catch {
      console.error("Backend offline");
    }
  };

  const handleNotThisPerson = () => {
    setIdentifiedPerson(null);
    identifiedPersonRef.current = null;
    setContextData(null);

    // Force the unknown state to true
    setIsUnknownFace(true);
    isUnknownFaceRef.current = true;

    // Ensure the current descriptor is captured for the new registration
    // This uses the ref we already have in the detection loop
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
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}