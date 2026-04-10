import { useRef, useEffect, useState } from 'react';
import * as faceapi from 'face-api.js';

export default function LivingRoom() {
  const videoRef = useRef();
  const canvasRef = useRef();
  const identifiedPersonRef = useRef(null);
  const isUnknownFaceRef = useRef(false);
  const faceMatcherRef = useRef(null);
  const currentDescriptorRef = useRef(null);
  
  // App State
  const [isInitializing, setIsInitializing] = useState(true);
  const [identifiedPerson, setIdentifiedPerson] = useState(null);
  const [contextData, setContextData] = useState(null);

  // New states for Unknown Visitor Registration
  const [isUnknownFace, setIsUnknownFace] = useState(false);
  const [newVisitorName, setNewVisitorName] = useState('');
  const [newVisitorRelation, setNewVisitorRelation] = useState('');

  const initializeFaceMatcher = async () => {
    try {
      const res = await fetch('http://localhost:5000/api/memories');
      if (res.ok) {
        const json = await res.json();
        if (json.success === true && json.data && Array.isArray(json.data)) {
          console.log("Loaded memories from DB:", json.data);
          const labeledDescriptors = [];
          for (const memory of json.data) {
            if (memory.name) {
              if (memory.faceDescriptor && typeof memory.faceDescriptor === 'string') {
                // Split the string by commas and convert each piece to a Number
                const rawArray = memory.faceDescriptor.split(',').map(Number);
                
                // Validate and load
                if (rawArray.length === 128 && !rawArray.some(isNaN)) {
                  const float32Descriptor = new Float32Array(rawArray);
                  const labeledDescriptor = new faceapi.LabeledFaceDescriptors(memory.name, [float32Descriptor]);
                  labeledDescriptors.push(labeledDescriptor);
                } else {
                  console.warn(`Skipping corrupted biometric data for: ${memory.name}`);
                }
              }
            }
          }
          if (labeledDescriptors.length > 0) {
            faceMatcherRef.current = new faceapi.FaceMatcher(labeledDescriptors, 0.75);
          }
        }
      }
    } catch (error) {
      console.error("Error initializing face matcher:", error);
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
          faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL)
        ]);
        await initializeFaceMatcher();
        setIsInitializing(false);
        startVideo();
      } catch (error) {
        console.error("Error loading AI models. Did you put them in public/models?", error);
      }
    };
    loadModels();
  }, []);

  // 2. Start the Webcam
  const startVideo = () => {
    navigator.mediaDevices.getUserMedia({ video: true })
      .then((currentStream) => {
        videoRef.current.srcObject = currentStream;
      })
      .catch((err) => {
        console.error("Error accessing webcam:", err);
      });
  };

  // 3. The Real-Time Face Tracking Loop
  const handleVideoOnPlay = () => {
    setInterval(async () => {
      if (isInitializing || !videoRef.current) return;

      // Detect faces
      const detections = await faceapi.detectAllFaces(
        videoRef.current, 
        new faceapi.TinyFaceDetectorOptions()
      ).withFaceLandmarks().withFaceDescriptors();

      // Draw the cyan bounding box on the canvas
      const displaySize = { width: videoRef.current.videoWidth, height: videoRef.current.videoHeight };
      faceapi.matchDimensions(canvasRef.current, displaySize);
      const resizedDetections = faceapi.resizeResults(detections, displaySize);
      
      canvasRef.current.getContext('2d').clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
      faceapi.draw.drawDetections(canvasRef.current, resizedDetections);

      if (detections.length > 0) {
        const descriptor = detections[0].descriptor;

        if (!isUnknownFaceRef.current) {
          let label = 'unknown';
          if (faceMatcherRef.current) {
            const bestMatch = faceMatcherRef.current.findBestMatch(descriptor);
            console.log("AI calculated match:", bestMatch.toString());
            label = bestMatch.label;
          }

          if (label !== 'unknown') {
            if (identifiedPersonRef.current !== label) {
              identifiedPersonRef.current = label;
              setIdentifiedPerson(label);
              fetchContextFromBackend(label);
            }
          } else {
            currentDescriptorRef.current = descriptor;
            isUnknownFaceRef.current = true;
            setIsUnknownFace(true);
          }
        }
      } else if (detections.length === 0 && !isUnknownFaceRef.current) {
        // Person walked away
        identifiedPersonRef.current = null;
        setIdentifiedPerson(null);
        setContextData(null);
        setIsUnknownFace(false);
      }
    }, 100); // Runs every 100ms
  };

  // Handle saving new visitor to backend
  const handleRegisterVisitor = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('http://localhost:5000/api/memory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          name: newVisitorName, 
          relation: newVisitorRelation, 
          text: `${newVisitorName} is my ${newVisitorRelation}.`, 
          faceDescriptor: Array.from(currentDescriptorRef.current).join(',') 
        }),
      });
      
      if (res.ok) {
        await initializeFaceMatcher();
        isUnknownFaceRef.current = false;
        setIsUnknownFace(false);
        identifiedPersonRef.current = newVisitorName;
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
              <button className="p-3 bg-red-600 text-white rounded-full transition-colors hover:bg-red-700">
                <span className="material-symbols-outlined">power_settings_new</span>
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
                </h3>
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
              <div className="flex flex-col items-center justify-center h-48 opacity-50">
                <span className="material-symbols-outlined text-5xl mb-2">face</span>
                <p className="text-center font-bold">Awaiting Person...</p>
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