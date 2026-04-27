import { useState, useRef, useEffect } from 'react';

export default function VoiceAsk() {
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState('');
  const recognitionRef = useRef(null);

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onresult = (event) => {
        let currentTranscript = '';
        for (let i = 0; i < event.results.length; i++) {
          currentTranscript += event.results[i][0].transcript;
        }
        setTranscript(currentTranscript);
      };

      recognition.onerror = (event) => {
        console.error("Speech recognition error", event.error);
        setIsRecording(false);
      };

      recognition.onend = () => {
        setIsRecording(false);
      };

      recognitionRef.current = recognition;
    } else {
      console.warn("Speech recognition not supported in this browser.");
    }
  }, []);

  const toggleRecording = () => {
    if (isRecording) {
      recognitionRef.current?.stop();
      setIsRecording(false);
    } else {
      setTranscript(''); // Clear previous
      recognitionRef.current?.start();
      setIsRecording(true);
    }
  };

  const handleSaveContext = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/update-context', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name: 'Harshit', transcript })
      });
      if (response.ok) {
        setTranscript('');
      } else {
        console.error("Failed to save context");
      }
    } catch (error) {
      console.error("Error saving context", error);
    }
  };
  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-160px)]">
      <div className="max-w-4xl w-full px-12 py-12 flex flex-col items-center text-center space-y-16">
        {/* VoicePromptButton */}
        <div className="relative group cursor-pointer mt-8" onClick={toggleRecording}>
          <div className={`voice-pulse absolute inset-0 rounded-full transition-colors duration-300 ${isRecording ? 'bg-red-500/40 animate-pulse' : 'bg-primary/20'}`}></div>
          <button className={`relative z-10 w-64 h-64 rounded-full flex flex-col items-center justify-center shadow-2xl transition-transform active:scale-90 duration-300 ${isRecording ? 'bg-gradient-to-br from-red-500 to-red-700' : 'bg-gradient-to-br from-primary to-primary-container'}`}>
            <span
              className="material-symbols-outlined text-white text-7xl mb-4"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              mic
            </span>
            <span className="text-white font-headline font-bold text-xl tracking-widest">
              {isRecording ? "LISTENING..." : "TAP TO ASK"}
            </span>
          </button>
        </div>
        
        {/* QuestionDisplay */}
        <div className="space-y-4">
          <p className="text-on-surface-variant font-label text-xl">Current Transcript:</p>
          <h3 className="text-4xl font-headline font-bold text-on-surface max-w-2xl min-h-[4rem]">
            {transcript ? `"${transcript}"` : (isRecording ? "Listening..." : "Waiting for voice...")}
          </h3>
          {transcript && !isRecording && (
            <button
              onClick={handleSaveContext}
              className="mt-6 px-10 py-3 bg-primary text-white rounded-full font-bold shadow-lg hover:bg-primary-container hover:text-on-primary-container transition-all"
            >
              Save Conversation
            </button>
          )}
        </div>
        
        {/* Result Area: AIAnswerCard */}
        <div className="w-full max-w-2xl bg-surface-container-lowest/80 backdrop-blur-3xl rounded-xl p-10 shadow-2xl shadow-primary/5 border border-outline-variant/10 relative overflow-hidden">
          {/* Subtle outer glow */}
          <div className="absolute inset-0 bg-primary/5 pointer-events-none"></div>
          <div className="relative flex flex-col items-center space-y-6">
            <div className="bg-primary/10 p-4 rounded-full">
              <span
                className="material-symbols-outlined text-primary text-4xl"
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                auto_awesome
              </span>
            </div>
            <p className="text-3xl font-headline font-semibold text-on-surface leading-relaxed">
              Your son <span className="text-primary font-bold">Rahul</span> visited yesterday afternoon.
            </p>
            <div className="flex gap-4 pt-4">
              <span className="px-6 py-2 bg-secondary-container text-on-secondary-container rounded-full text-sm font-bold uppercase tracking-wider">
                Memory Anchored
              </span>
              <span className="px-6 py-2 bg-surface-container text-on-surface-variant rounded-full text-sm font-medium">
                3:14 PM
              </span>
            </div>
          </div>
          {/* Subtle texture image in background */}
          <div className="absolute -bottom-24 -right-24 opacity-10">
            <img
              className="w-64 h-64 rounded-full blur-3xl"
              alt="background gradient"
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuBTs9nVjw6rfSDBptk5FJMrDc5ZAFQoJMboIvf_HMZez5Ziz3gkOG72BnboPeAkg5KXZahPPYAHUqfQRFE0mJoUqXMYNrm-ug-Ug3_vhNR-Xh_3464Wfp8OkCNX9S1X16x88zM8x9WHrnvmW1zjtMI5MPOZ-AFqho9IIecmPQfXbmqLKry_G5NpBGLsPlVDNqz1YVmMr-FUicyMCANr5I26tCZhirA4K0xhO3sG2Jw1ZJnvbUbclYs2AEvRA21HMM38pztsIA-Csuu5"
            />
          </div>
        </div>
        
        {/* Suggestion Chips */}
        <div className="flex flex-wrap justify-center gap-4">
          <button className="px-8 py-4 bg-surface-container-low hover:bg-surface-container-high text-on-surface-variant rounded-full text-lg font-medium transition-colors">
            When is lunch?
          </button>
          <button className="px-8 py-4 bg-surface-container-low hover:bg-surface-container-high text-on-surface-variant rounded-full text-lg font-medium transition-colors">
            Where are my keys?
          </button>
          <button className="px-8 py-4 bg-surface-container-low hover:bg-surface-container-high text-on-surface-variant rounded-full text-lg font-medium transition-colors">
            Call Rahul
          </button>
        </div>
      </div>
    </div>
  );
}
