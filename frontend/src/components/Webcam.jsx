import * as faceapi from "face-api.js";
import { useRef, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

export default function Webcam() {
  const videoRef = useRef();
  const canvasRef = useRef();
  const intervalRef = useRef(null);
  const [personName, setPersonName] = useState("");
  const [personNotes, setPersonNotes] = useState("");
  const isPromptOpenRef = useRef(false);
  const hasNavigatedRef = useRef(false);
  const lastCallRef = useRef(0);
  const navigate = useNavigate();

  const loadModels = async () => {
    console.log("Loading models...");
    // The models should be in /public/models
    await faceapi.nets.tinyFaceDetector.loadFromUri("/models");
    console.log("Models loaded ✅");
  };

  const startVideo = () => {
    console.log("Starting video...");
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      navigator.mediaDevices
        .getUserMedia({ video: true })
        .then((stream) => {
          console.log("Video started ✅");
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
          }
        })
        .catch((err) => console.error("Camera access error:", err));
    }
  };

  useEffect(() => {
    const videoElement = videoRef.current;
    const init = async () => {
      await loadModels();
      startVideo();
    };

    init();

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      if (videoElement && videoElement.srcObject) {
        const tracks = videoElement.srcObject.getTracks();
        tracks.forEach(track => track.stop());
      }
    };
  }, []);

  const captureFrame = () => {
    const video = videoRef.current;
    if (!video) return null;

    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const ctx = canvas.getContext("2d");
    if (!ctx) return null;
    ctx.drawImage(video, 0, 0);

    return new Promise((resolve) => {
      canvas.toBlob((blob) => {
        resolve(blob);
      }, "image/jpeg");
    });
  };

  const sendToBackend = async (blob) => {
    if (!blob) return;
    try {
      const formData = new FormData();
      formData.append("file", blob, "face.jpg");

      const res = await fetch("http://localhost:5000/recognize", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) return;
      const data = await res.json();

      if (data.lowConfidence) {
        console.log("Frame skipped - low confidence");
        return;
      }
      
      console.log("Backend response:", data);

      if (data.recognized && data.name !== "Unknown" && !hasNavigatedRef.current) {
        hasNavigatedRef.current = true;
        navigate("/profile", {
          state: {
            name: data.name,
            notes: data.notes,
          },
        });
        return;
      }

      if (!data.recognized && !isPromptOpenRef.current) {
        isPromptOpenRef.current = true;

        const name = prompt("Who is this person?");
        const notes = prompt("Add memory (optional)");

        if (name) {
          await fetch("http://localhost:5000/update-user", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              id: data.userId,
              name: name,
              notes: notes || "",
            }),
          });

          setPersonName(name);
          setPersonNotes(notes || "");
        }

        isPromptOpenRef.current = false;
      }
    } catch {
      console.warn("Backend not available yet. Visual mode only.");
    }
  };

  const handlePlay = () => {
    console.log("Video playing 🎥");

    intervalRef.current = setInterval(async () => {
      if (!videoRef.current || !canvasRef.current) return;

      const detections = await faceapi.detectAllFaces(
        videoRef.current,
        new faceapi.TinyFaceDetectorOptions()
      );

      const canvas = canvasRef.current;
      const displaySize = {
        width: videoRef.current.videoWidth,
        height: videoRef.current.videoHeight,
      };

      if (displaySize.width === 0 || displaySize.height === 0) return;

      faceapi.matchDimensions(canvas, displaySize);
      const resized = faceapi.resizeResults(detections, displaySize);

      const ctx = canvas.getContext("2d");
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Custom drawing that matches the Brand colors (Cyan #0AC4E0)
      resized.forEach((detection) => {
        const { x, y, width, height } = detection.box;
        
        ctx.strokeStyle = "#0AC4E0"; // Primary Color
        ctx.lineWidth = 3;
        ctx.strokeRect(x, y, width, height);

        // Label bg
        ctx.fillStyle = "#0AC4E0";
        ctx.fillRect(x, y - 35, width > 150 ? width : 150, 35);

        // Text
        ctx.fillStyle = "white";
        ctx.font = "bold 14px Inter";
        ctx.fillText(personName || "Scanning...", x + 10, y - 12);
      });

      const now = Date.now();
      if (detections.length > 0 && now - lastCallRef.current > 2000) {
        const blob = await captureFrame();
        await sendToBackend(blob);
        lastCallRef.current = now;
      }
    }, 500);
  };

  return (
    <div className="relative w-full h-full flex flex-col items-center justify-center bg-black">
      <video
        ref={videoRef}
        autoPlay
        muted
        playsInline
        className="w-full h-full object-cover"
        onPlay={handlePlay}
      />
      <canvas
        ref={canvasRef}
        className="absolute top-0 left-0 w-full h-full pointer-events-none"
      />
      {/* Visual Feedback Overlay */}
      {!personName && (
        <div className="absolute top-8 left-8 flex items-center gap-3 bg-black/50 backdrop-blur-md text-white px-5 py-2.5 rounded-full border border-white/10 z-10">
          <span className="w-3 h-3 bg-red-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(239,68,68,0.8)]"></span>
          <span className="text-sm font-bold tracking-widest uppercase">LIVE ANALYTICS</span>
        </div>
      )}
    </div>
  );
}
