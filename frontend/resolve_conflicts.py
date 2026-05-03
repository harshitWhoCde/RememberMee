import re
import sys

def main():
    file_path = "src/pages/LivingRoom.jsx"
    with open(file_path, "r", encoding="utf-8") as f:
        content = f.read()

    # We will use regex to find the blocks and replace them.
    # Block 1: Refs
    block1_pattern = re.compile(r'<<<<<<< HEAD\n\s*const intervalRef = useRef\(null\);\n.*?=======\n\s*const intervalRef = useRef\(null\); // Add this at the top with your other refs\n>>>>>>> face-differentiation-branch\n', re.DOTALL)
    content = block1_pattern.sub(
        '  const intervalRef = useRef(null);\n'
        '  const orbRef = useRef(null);\n'
        '  const recognitionRef = useRef(null);\n'
        '  const currentDescriptorRef = useRef(null);\n'
        '  const isRegisteringRef = useRef(false);\n'
        '  const cooldownRef = useRef(false);\n'
        '  const streamRef = useRef(null);\n'
        '  const voiceStateRef = useRef("idle");\n', 
        content
    )

    # Block 2: Model loading
    block2_pattern = re.compile(r'<<<<<<< HEAD\n\s*await Promise\.all\(\[\n.*?=======\n\s*console\.log\("All models loaded ✅"\);\n\s*initializeFaceMatcher\(\);\n\s*setIsInitializing\(false\);\n.*?>>>>>>> face-differentiation-branch\n', re.DOTALL)
    block2_repl = '''        await Promise.all([
          faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
          faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
          faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
        ]);

        console.log("All models loaded ✅");
        console.log("TF backend:", tf.getBackend()); // should say 'webgl'
        await initializeFaceMatcher();
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
'''
    content = block2_pattern.sub(block2_repl, content)

    # Block 3: Commented deepface logic
    block3_pattern = re.compile(r'\s*// <<<<<<< HEAD\n\s*//\s*// --- PURE face-api.js RECOGNITION PIPELINE ---.*?// =======\n.*?>>>>>>> face-differentiation-branch\n', re.DOTALL)
    content = block3_pattern.sub('\n', content)

    # Block 4: UI container & orb
    block4_pattern = re.compile(r'<<<<<<< HEAD\n\s*<div className="px-12 h-full">.*?=======\n(.*?<div className="mb-4 flex flex-wrap items-center justify-between gap-3">)\n.*?>>>>>>> face-differentiation-branch', re.DOTALL)
    block4_repl = r'''    <div className="h-full px-6 lg:px-8">
          <div className="grid min-h-[calc(100vh-130px)] grid-cols-12 gap-5 relative">
            
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

            <section className="col-span-12 xl:col-span-8 flex min-h-[520px] flex-col">
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3">'''
    content = block4_pattern.sub(block4_repl, content)

    # Block 5: Recognition State
    block5_pattern = re.compile(r'<<<<<<< HEAD\n\s*<div className="relative z-10 animate-fade-in flex flex-col items-center justify-center text-center py-6">.*?=======\n.*?<span className="inline-flex items-center rounded-full bg-amber-100 px-3 py-1 text-\[11px\] font-bold uppercase tracking-wider text-amber-800">.*?Face Detected\n>>>>>>> face-differentiation-branch\n', re.DOTALL)
    block5_repl = '''                  <div className="relative z-10 animate-fade-in flex flex-col items-center justify-center text-center py-6">
                    <span className="inline-block bg-amber-100 text-amber-800 px-3 py-1 rounded-full text-[11px] font-bold mb-4 uppercase animate-pulse tracking-wider">
                      New Visitor Detected
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
                    <span className="inline-block bg-emerald-100 text-emerald-800 px-3 py-1 rounded-full text-[11px] font-bold mb-4 uppercase animate-pulse tracking-wider">
                      Face Detected\n'''
    content = block5_pattern.sub(block5_repl, content)

    # Block 6: Audio Monitor & Debug
    block6_pattern = re.compile(r'<<<<<<< HEAD\n\s*{/\* Transcript Monitor \*/ }\n.*?=======\n\s*<div className="flex min-h-0 flex-1 flex-col gap-4 rounded-2xl border border-outline-variant/20 bg-surface-container-low p-5">.*?>>>>>>> face-differentiation-branch\n', re.DOTALL)
    block6_repl = '''        <div className="flex min-h-0 flex-1 flex-col gap-4 rounded-2xl border border-outline-variant/20 bg-surface-container-low p-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className={`material-symbols-outlined ${voiceState === "recordingContext" ? "text-red-500 animate-pulse" : "text-on-surface-variant"} text-lg`}>mic</span>
              <h4 className="text-[11px] font-bold uppercase tracking-widest text-on-surface-variant">
                {voiceState === "recordingContext" ? "Recording Conversation..." : "Audio Monitor"}
              </h4>
            </div>

            {conversationTranscript && voiceState === "recordingContext" && (
              <button
                onClick={saveConversationContext}
                className="px-4 py-1 text-[10px] font-bold uppercase tracking-wider bg-primary text-white rounded-full hover:bg-primary/90 transition-colors shadow-md"
              >
                Save Memory
              </button>
            )}
          </div>

          <div className="flex flex-1 rounded-2xl border border-dashed border-outline-variant/50 bg-surface-container-lowest/70 p-5 overflow-y-auto">
            {conversationTranscript ? (
              <p className="text-on-surface text-sm leading-relaxed text-left w-full">
                {conversationTranscript}
              </p>
            ) : (
              <div className="flex w-full flex-col items-center justify-center text-center">
                <p className="font-headline text-lg font-extrabold text-on-surface">Awaiting audio</p>
                <p className="mt-1 text-sm text-on-surface-variant">Conversation cues will appear here.</p>
              </div>
            )}
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
          </div>\n'''
    content = block6_pattern.sub(block6_repl, content)

    with open(file_path, "w", encoding="utf-8") as f:
        f.write(content)
        
    print("Conflicts resolved.")

if __name__ == "__main__":
    main()
