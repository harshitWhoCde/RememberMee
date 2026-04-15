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
  const currentDescriptorRef = useRef(null);
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
            faceMatcherRef.current = new faceapi.FaceMatcher(labeledDescriptors, 0.5);
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
        setIsInitializing(false);
      } catch (error) {
        console.error("Error loading models:", error);
      }
    };
    loadModels();
  }, []);

  useEffect(() => {
    if (isCameraOn) startVideo();
    else stopVideo();
  }, [isCameraOn]);

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
      } catch (err) {
        console.error("❌ Not JSON from DeepFace:", text);
        return;
      }

      if (!data.success) {
        identifiedPersonRef.current = null;
        return;
      }

      console.log("DeepFace Embedding Received:", data.embedding);

      // 2️⃣ Throttle API calls
      if (Date.now() - lastCallRef.current <= 2000) return;
      lastCallRef.current = Date.now();

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
      if (detections.length > 0 && !identifiedPerson && !isUnknownFace) {
        if (identifiedPersonRef.current !== "Verifying...") {
          console.log("Face detected! Sending to DeepFace...");
          console.log("Detections:", detections.length);
          identifiedPersonRef.current = "Verifying...";
          verifyWithDeepFace();
        }
      }

      // ✅ LOGIC: If frame is empty, reset the 'Verifying' block so it can try again later
      if (detections.length === 0 && !isUnknownFace && !identifiedPerson) {
        identifiedPersonRef.current = null;
      }
    }, 500);
  };

  // --- REGISTRATION LOGIC ---
  const handleRegisterVisitor = async (e) => {
    e.preventDefault();

    // Capture the face for the new embedding
    const canvas = document.createElement("canvas");
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    canvas.getContext("2d").drawImage(videoRef.current, 0, 0);
    const blob = await new Promise(res => canvas.toBlob(res, 'image/jpeg'));

    const formData = new FormData();
    formData.append("file", blob);

    try {
      // 1. Get embedding from Python
      const embedRes = await fetch("http://localhost:8000/embed", { method: "POST", body: formData });
      const embedData = await embedRes.json();

      if (embedData.success) {
        // 2. Save to MERN Backend
        const res = await fetch('http://localhost:5000/api/memory', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: newVisitorName,
            relation: newVisitorRelation,
            faceDescriptor: embedData.embedding, // Save the precise DeepFace embedding
            text: `${newVisitorName} is my ${newVisitorRelation}.`
          }),
        });

        if (res.ok) {
          setIsUnknownFace(false);
          setIdentifiedPerson(newVisitorName);
          identifiedPersonRef.current = newVisitorName;
          fetchContextFromBackend(newVisitorName);
        }
      }
    } catch (error) {
      console.error("Registration Error:", error);
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
    } catch (error) {
      console.error("Backend offline");
    }
  };

  const handleNotThisPerson = () => {
    setIdentifiedPerson(null);
    identifiedPersonRef.current = null;
    setContextData(null);

    // Force the unknown state to true
    setIsUnknownFace(true);

    // Ensure the current descriptor is captured for the new registration
    // This uses the ref we already have in the detection loop
  };

  return (
    <div className="px-12 h-full">
      <div className="grid grid-cols-10 gap-8 h-[calc(100vh-160px)]">

        {/* Left Column - Live Video Feed */}
        <section className="col-span-10 lg:col-span-6 xl:col-span-7 flex flex-col h-full relative">
          <div className="relative flex-1 bg-black rounded-lg overflow-hidden shadow-2xl border-4 border-surface-container-highest flex items-center justify-center">

            {isInitializing && <p className="text-white text-2xl animate-pulse absolute z-50">Loading AI Models...</p>}

            {/* The Video and Canvas must sit exactly on top of each other */}
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

            {/* Camera Controls UI */}
            <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-4 bg-black/40 backdrop-blur-xl p-2 rounded-full border border-white/20 z-20">
              <button className="p-3 text-white hover:bg-white/20 rounded-full transition-colors">
                <span className="material-symbols-outlined">videocam</span>
              </button>
              <button
                onClick={() => setIsCameraOn(prev => !prev)}
                className={`p-3 rounded-full transition-colors ${isCameraOn ? 'bg-red-600 hover:bg-red-700' : 'bg-green-600 hover:bg-green-700'
                  } text-white`}
              >
                <span className="material-symbols-outlined">
                  {isCameraOn ? 'power_settings_new' : 'videocam'}
                </span>
              </button>
            </div>

            {/* Live Indicator */}
            <div className="absolute top-8 left-8 flex items-center gap-3 bg-black/50 backdrop-blur-md text-white px-5 py-2.5 rounded-full border border-white/10 z-20">
              <span className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></span>
              <span className="text-sm font-bold tracking-widest uppercase">LIVE FEED</span>
            </div>
          </div>
        </section>

        {/* Right Column - MemoryHUD & Transcript */}
        <section className="col-span-10 lg:col-span-4 xl:col-span-3 flex flex-col gap-6 h-full">

          {/* MemoryHUD Component */}
          <div className="bg-surface-container-lowest p-6 rounded-lg shadow-xl shadow-blue-900/5 relative overflow-hidden border border-outline-variant/10 flex-shrink-0 transition-all">
            {isUnknownFace ? (
              <div className="relative z-10 animate-fade-in">
                <span className="inline-block bg-amber-100 text-amber-800 px-3 py-1 rounded-full text-xs font-bold mb-4 uppercase animate-pulse">
                  New Visitor Detected
                </span>
                <form onSubmit={handleRegisterVisitor} className="space-y-4 mt-2">
                  <div>
                    <label className="block text-sm font-medium text-on-surface-variant mb-1">Name</label>
                    <input
                      type="text"
                      value={newVisitorName}
                      onChange={(e) => setNewVisitorName(e.target.value)}
                      className="w-full px-4 py-3 bg-surface-container-low border border-outline-variant/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-on-surface"
                      placeholder="e.g., Sarah"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-on-surface-variant mb-1">Relationship</label>
                    <input
                      type="text"
                      value={newVisitorRelation}
                      onChange={(e) => setNewVisitorRelation(e.target.value)}
                      className="w-full px-4 py-3 bg-surface-container-low border border-outline-variant/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-on-surface"
                      placeholder="e.g., Daughter"
                      required
                    />
                  </div>
                  <div className="flex gap-3 mt-2">
                    <button
                      type="button"
                      onClick={() => {
                        isUnknownFaceRef.current = false;
                        setIsUnknownFace(false);
                        setNewVisitorName('');
                        setNewVisitorRelation('');
                      }}
                      className="w-1/3 bg-surface-container-high text-on-surface font-bold py-3 px-4 rounded-lg hover:bg-surface-container transition-colors shadow-sm border border-outline-variant/30"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="w-2/3 bg-primary text-on-primary font-bold py-3 px-4 rounded-lg hover:bg-primary/90 transition-colors shadow-md"
                    >
                      Register
                    </button>
                  </div>
                </form>
              </div>
            ) : identifiedPerson ? (
              <div className="relative z-10">
                <span className="inline-block bg-emerald-100 text-emerald-800 px-3 py-1 rounded-full text-xs font-bold mb-4 uppercase animate-pulse">
                  Face Detected
                </span>
                <h3 className="text-2xl font-headline font-extrabold text-blue-900 leading-tight mb-6 uppercase">
                  {identifiedPerson}
                </h3>{/* ADD THIS BUTTON HERE */}
                <button
                  onClick={handleNotThisPerson}
                  className="text-xs text-primary hover:underline font-bold mb-4 block"
                >
                  Not {identifiedPerson}? Register as New
                </button>
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="bg-blue-100 p-2 rounded-full flex-shrink-0">
                      <span className="material-symbols-outlined text-blue-700 text-xl">memory</span>
                    </div>
                    <div>
                      <p className="text-on-surface-variant text-[10px] font-bold uppercase tracking-wider">Retrieved Context</p>
                      <p className="text-base font-medium text-on-surface leading-tight">
                        {contextData || "Scanning memories..."}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              // 3. Show this when NO ONE is detected
              <div className="flex flex-col items-center justify-center h-48 opacity-50">
                <span className="material-symbols-outlined text-5xl mb-2 text-gray-400">
                  person_off
                </span>
                <p className="text-center font-bold text-gray-500">No One in Frame</p>
              </div>
            )}
          </div>

          {/* Transcript Monitor (Mocked for layout) */}
          <div className="flex-1 bg-surface-container-low p-6 rounded-lg flex flex-col gap-4 border border-outline-variant/5 min-h-0">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-on-surface-variant text-lg">mic</span>
              <h4 className="text-on-surface-variant font-bold text-[10px] uppercase tracking-widest">Awaiting Audio...</h4>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}