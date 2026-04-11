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

  // Optimized Matcher Initialization
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

  // Optimized Detection Loop


  // 1. Load the AI Models when the component mounts
  useEffect(() => {
    const loadModels = async () => {
      const MODEL_URL = '/models';
      try {
        await Promise.all([
          faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
          faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
          faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL)
        ]);
        await initializeFaceMatcher();
        setIsInitializing(false);
        //startVideo();
      } catch (error) {
        console.error("Error loading AI models. Did you put them in public/models?", error);
      }
    };
    loadModels();
  }, []);

  useEffect(() => {
    if (isCameraOn) {
      startVideo();
    } else {
      stopVideo();
    }
  }, [isCameraOn]);

  // 2. Start the Webcam
  const startVideo = () => {
    navigator.mediaDevices.getUserMedia({ video: true })
      .then((currentStream) => {
        videoRef.current.srcObject = currentStream;
        streamRef.current = currentStream; // Store the stream to stop it later
      })
      .catch((err) => {
        console.error("Error accessing webcam:", err);
        setIsCameraOn(false);
      });
  };

  const stopVideo = () => {
    // 1. Kill the detection loop immediately
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    // 2. Stop the hardware tracks
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => {
        track.stop(); // This tells the hardware to turn off
      });
      streamRef.current = null;
    }

    // 3. Wipe the video element source
    if (videoRef.current) {
      videoRef.current.srcObject = null;
      videoRef.current.load(); // Forces the element to reset
    }

    // 4. Clear the UI
    setIdentifiedPerson(null);
    setIsUnknownFace(false);
  };

  // 3. The Real-Time Face Tracking Loop
  // 3. The Real-Time Face Tracking Loop
  const handleVideoOnPlay = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;

    // Safety Check: Ensure video is ready and has dimensions
    if (!video || !canvas || video.paused || video.ended || video.readyState < 2) return;

    // ✅ Clear any existing interval first (prevents duplicates)
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    intervalRef.current = setInterval(async () => {
      // ✅ Stop loop if camera is off
      if (!isCameraOn) {
        clearInterval(intervalRef.current);
        return;
      }

      // Additional safety inside loop
      if (!video || !canvas || isInitializing || !isCameraOn || isUnknownFace) return;

      try {
        const detections = await faceapi.detectAllFaces(
          video,
          new faceapi.TinyFaceDetectorOptions()
        ).withFaceLandmarks().withFaceDescriptors();

        // Only do math if the video actually has dimensions
        if (video.videoWidth > 0) {
          const displaySize = {
            width: video.videoWidth,
            height: video.videoHeight
          };

          faceapi.matchDimensions(canvas, displaySize);
          const resizedDetections = faceapi.resizeResults(detections, displaySize);

          const ctx = canvas.getContext('2d');
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          faceapi.draw.drawDetections(canvas, resizedDetections);
        }

        // ================= FACE MATCHING LOGIC =================
        if (detections.length > 0) {
          let rawDescriptor = detections[0].descriptor;

          // Camera sanitizer
          if (Math.abs(rawDescriptor[0]) > 10) {
            rawDescriptor = rawDescriptor.map(val => val / 1000000000);
          }

          const currentFaceDescriptor = new Float32Array(rawDescriptor);

          if (!isUnknownFace) {
            // ✅ FIX: Reset bestMatch at the START (prevents stale "Jacob")
            let bestMatch = { label: 'unknown', distance: 1.0 };

            if (faceMatcherRef.current) {
              const match = faceMatcherRef.current.findBestMatch(currentFaceDescriptor);

              console.log(`AI Confidence Distance: ${match.distance}`);

              const THRESHOLD = 0.42;

              if (match.label !== 'unknown' && match.distance < THRESHOLD) {
                bestMatch = match; // ✅ assign only if valid match
              }
            }

            // ✅ SINGLE SOURCE OF TRUTH (cleaned logic)
            if (bestMatch.label !== 'unknown') {
              // Recognized person (e.g., Jacob)
              if (identifiedPersonRef.current !== bestMatch.label) {
                identifiedPersonRef.current = bestMatch.label;
                setIdentifiedPerson(bestMatch.label);
                fetchContextFromBackend(bestMatch.label);
                setIsUnknownFace(false);
              }
            } else {
              // Stranger detected
              if (identifiedPersonRef.current !== "Stranger") {
                identifiedPersonRef.current = "Stranger";
                setIdentifiedPerson(null);
                setContextData(null);
                currentDescriptorRef.current = currentFaceDescriptor;
                setIsUnknownFace(true);
              }
            }
          }
        } else {
          // Handle empty frame
          if (identifiedPersonRef.current !== null || isUnknownFace) {
            identifiedPersonRef.current = null;
            setIdentifiedPerson(null);
            setContextData(null);

            isUnknownFaceRef.current = false;
            setIsUnknownFace(false);

            console.log("Frame is empty - Clearing HUD");
          }
        }
      } catch (err) {
        console.error("Detection loop error:", err);
        clearInterval(intervalRef.current); // prevent memory leaks
      }
    }, 200);
  };

  // Handle saving new visitor to backend
  const handleRegisterVisitor = async (e) => {
    e.preventDefault();
    try {
      // FORCE strings to keep their decimal points by using map(String)
      const descriptorString = Array.from(currentDescriptorRef.current)
        .map(num => num.toFixed(6)) // Force 6 decimal places
        .join(',');

      const res = await fetch('http://localhost:5000/api/memory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newVisitorName,
          relation: newVisitorRelation,
          text: `${newVisitorName} is my ${newVisitorRelation}.`,
          faceDescriptor: descriptorString
        }),
      });

      if (res.ok) {
        await initializeFaceMatcher();
        setIsUnknownFace(false);
        setIdentifiedPerson(newVisitorName);
        fetchContextFromBackend(newVisitorName);
        setNewVisitorName('');
        setNewVisitorRelation('');
      }
    } catch (error) {
      console.error("Error registering visitor:", error);
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