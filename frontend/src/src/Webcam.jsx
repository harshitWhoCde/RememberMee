import * as faceapi from "face-api.js";
import { useRef, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

export default function Webcam() {
  const videoRef = useRef();
  const canvasRef = useRef();
  const intervalRef = useRef(null); // ✅ FIX 3: interval ref
  const [personName, setPersonName] = useState("");
  const [personNotes, setPersonNotes] = useState("");
  const isPromptOpenRef = useRef(false);
  const hasNavigatedRef = useRef(false); // ✅ FIX: use ref instead of state
  const lastCallRef = useRef(0);
  const navigate = useNavigate();

  useEffect(() => {
    const init = async () => {
      console.log("Initializing...");
      await loadModels();
      startVideo();
    };

    init();

    // ✅ FIX 3: clear interval on unmount
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  const loadModels = async () => {
    console.log("Loading models...");
    await faceapi.nets.tinyFaceDetector.loadFromUri("/models");
    console.log("Models loaded ✅");
  };

  const startVideo = () => {
    console.log("Starting video...");
    navigator.mediaDevices
      .getUserMedia({ video: true })
      .then((stream) => {
        console.log("Video started ✅");
        videoRef.current.srcObject = stream;
      })
      .catch((err) => console.error(err));
  };

  const captureFrame = () => {
    const video = videoRef.current;

    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const ctx = canvas.getContext("2d");
    ctx.drawImage(video, 0, 0);

    return new Promise((resolve) => {
      canvas.toBlob((blob) => {
        resolve(blob);
      }, "image/jpeg");
    });
  };

  const sendToBackend = async (blob) => {
    const formData = new FormData();
    formData.append("file", blob, "face.jpg");

    const res = await fetch("http://localhost:5000/recognize", {
      method: "POST",
      body: formData,
    });

    const data = await res.json();

    // ✅ ADD THIS — skip everything if frame was rejected
    if (data.lowConfidence) {
      console.log("Frame skipped - low confidence");
      return;
    }
    console.log("Backend response:", data);

    // ✅ CASE 1: RECOGNIZED PERSON
    if (
      data.recognized &&
      data.name !== "Unknown" &&
      !hasNavigatedRef.current
    ) {
      hasNavigatedRef.current = true; // ✅ ref never goes stale in closure
      navigate("/profile", {
        state: {
          name: data.name,
          notes: data.notes,
        },
      });
      return;
    }

    // ✅ CASE 2: NEW PERSON (ONLY ONCE)
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
  };

  const handlePlay = () => {
    console.log("Video playing 🎥");

    // ✅ FIX 3: store interval in ref
    intervalRef.current = setInterval(async () => {
      if (!videoRef.current) return;

      const detections = await faceapi.detectAllFaces(
        videoRef.current,
        new faceapi.TinyFaceDetectorOptions(),
      );

      const canvas = canvasRef.current;

      const displaySize = {
        width: videoRef.current.videoWidth,
        height: videoRef.current.videoHeight,
      };

      faceapi.matchDimensions(canvas, displaySize);

      const resized = faceapi.resizeResults(detections, displaySize);

      const ctx = canvas.getContext("2d");
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      faceapi.draw.drawDetections(canvas, resized);
      resized.forEach((detection) => {
        const { x, y } = detection.box;

        ctx.fillStyle = "lime";
        ctx.font = "16px Arial";
        ctx.fillText(personName || "Detecting...", x, y - 10);

        if (personNotes) {
          ctx.fillText(personNotes, x, y - 30);
        }
      });

      // ✅ CALL BACKEND EVERY 2s ONLY IF FACE DETECTED
      const now = Date.now();
      if (detections.length > 0 && now - lastCallRef.current > 2000) {
        const blob = await captureFrame();
        await sendToBackend(blob);
        lastCallRef.current = now;
      }
    }, 500);
  };

  return (
    <div style={{ position: "relative", width: "600px" }}>
      <video
        ref={videoRef}
        autoPlay
        muted
        width="600"
        height="500"
        onPlay={handlePlay}
      />
      <canvas
        ref={canvasRef}
        width="600"
        height="500"
        style={{
          position: "absolute",
          top: 0,
          left: 0,
        }}
      />
    </div>
  );
}
