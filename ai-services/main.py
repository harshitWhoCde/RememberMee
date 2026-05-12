"""
RememberMe AI Services - FastAPI Server
Provides:
  - POST /embed       → InsightFace ArcFace face embedding (existing)
  - WS   /ws/stt      → Faster-Whisper real-time streaming STT (new)
"""

import asyncio
import logging
import time
import numpy as np
import cv2
from fastapi import FastAPI, File, UploadFile, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from insightface.app import FaceAnalysis
from faster_whisper import WhisperModel
import av

# ---------------------------------------------------------------------------
# Logging
# ---------------------------------------------------------------------------
logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(name)s: %(message)s")
logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# FastAPI app
# ---------------------------------------------------------------------------
app = FastAPI(title="RememberMe AI Service", version="2.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------------------------------------------------------------------------
# InsightFace – loaded once at startup (unchanged from original)
# ---------------------------------------------------------------------------
logger.info("Loading InsightFace buffalo_l model...")
try:
    face_app = FaceAnalysis(name="buffalo_l", providers=["CPUExecutionProvider"])
    face_app.prepare(ctx_id=-1, det_size=(640, 640))
    logger.info("InsightFace model initialized successfully.")
except Exception as exc:
    logger.error(f"Failed to initialize InsightFace: {exc}")
    face_app = None

# ---------------------------------------------------------------------------
# Faster-Whisper – loaded once at startup
# ---------------------------------------------------------------------------
# Model selection rationale:
#   • "medium.en" – ~769 MB VRAM (GPU) / ~1.5 GB RAM (CPU).  Great accuracy,
#     ~80-120 ms latency per ~2 s chunk on RTX 3050 with CUDAint8.
#     English-only, so no language-detection overhead.
#   • "distil-large-v3" – distilled variant, ~600 MB VRAM, slightly faster but
#     requires the distil-whisper package; use if you prefer even lower latency.
#
# We use "medium.en" with compute_type="int8" on GPU and fallback to CPU.
# int8 quantisation cuts VRAM ~50 % with <1 % WER degradation on English.
#
# On RTX 3050 (4 GB VRAM) the model fits comfortably with int8.
# On CPU (16 GB RAM) int8 is also ~3× faster than float32.
# ---------------------------------------------------------------------------
WHISPER_MODEL_SIZE = "medium.en"
SAMPLE_RATE = 16000          # Whisper expects 16 kHz mono PCM float32
CHUNK_DURATION_S = 3.0       # seconds of audio per inference slice
MIN_SPEECH_DURATION_S = 0.3  # discard chunks shorter than this (silence)
SILENCE_TIMEOUT_S = 2.0      # after N seconds silence → finalize segment

logger.info(f"Loading Faster-Whisper model: {WHISPER_MODEL_SIZE} ...")
try:
    # Try GPU first; fall back to CPU automatically
    whisper_model = WhisperModel(
        WHISPER_MODEL_SIZE,
        device="cpu",
        compute_type="int8",
    )
    logger.info("Faster-Whisper loaded on CPU (int8).")
except Exception:
    try:
        whisper_model = WhisperModel(
            WHISPER_MODEL_SIZE,
            device="cpu",
            compute_type="int8",
        )
        logger.info("Faster-Whisper loaded on CPU (int8) – GPU unavailable.")
    except Exception as exc:
        logger.error(f"Failed to load Faster-Whisper: {exc}")
        whisper_model = None

# ---------------------------------------------------------------------------
# Whisper inference helper
# ---------------------------------------------------------------------------

def pcm_bytes_to_float32(raw: bytes) -> np.ndarray:
    """Convert 16-bit signed PCM bytes → float32 [-1, 1] numpy array."""
    audio_int16 = np.frombuffer(raw, dtype=np.int16)
    return audio_int16.astype(np.float32) / 32768.0


def transcribe_chunk(pcm_float32: np.ndarray) -> tuple[str, bool]:
    """
    Run Faster-Whisper on a float32 PCM array.
    Returns (text, is_final).
    is_final is always True here — finality is managed by the caller.
    """
    if whisper_model is None:
        return "", True

    duration = len(pcm_float32) / SAMPLE_RATE
    if duration < MIN_SPEECH_DURATION_S:
        return "", True

    try:
        segments, info = whisper_model.transcribe(
            pcm_float32,
            language="en",
            beam_size=5,
            best_of=5,
            vad_filter=True,
            vad_parameters={
                "min_silence_duration_ms": 500,
                "speech_pad_ms": 200,
            },
            condition_on_previous_text=True,
            temperature=0.0,
            no_speech_threshold=0.7,
            compression_ratio_threshold=2.4,
        )
        text = " ".join(seg.text.strip() for seg in segments).strip()
        return text, True
    except Exception as exc:
        logger.warning(f"Transcription error: {exc}")
        return "", True


# ---------------------------------------------------------------------------
# WebSocket STT endpoint
# ---------------------------------------------------------------------------
# Protocol (binary frames from browser):
#   • Browser sends raw 16-bit signed PCM chunks at 16 kHz mono.
#   • Server accumulates ~CHUNK_DURATION_S seconds, runs Whisper, streams back:
#       {"type": "partial", "text": "...", "ts": 1234567890}
#       {"type": "final",   "text": "...", "ts": 1234567890}
# ---------------------------------------------------------------------------

import json

BUFFER_SAMPLES = int(SAMPLE_RATE * CHUNK_DURATION_S)   # samples per inference window
OVERLAP_SAMPLES = int(SAMPLE_RATE * 0.3)               # 300 ms overlap for continuity
print("REGISTERING WS ROUTE")
@app.websocket("/ws/stt")
async def websocket_stt(ws: WebSocket):
    await ws.accept()
    logger.info(f"STT WebSocket connected: {ws.client}")

    # Per-connection state
    audio_buffer: bytearray = bytearray()
    accumulated_transcript: str = ""
    last_speech_time: float = time.time()
    silence_notified: bool = False

    async def send_json(payload: dict):
        try:
            await ws.send_text(json.dumps(payload))
        except Exception:
            pass

    try:
        while True:
            try:
                # Receive binary PCM chunk from browser (with timeout for silence detection)
                message = await asyncio.wait_for(ws.receive_bytes(), timeout=SILENCE_TIMEOUT_S + 0.5)
            except asyncio.TimeoutError:
                # No audio received for SILENCE_TIMEOUT_S → notify client
                if not silence_notified:
                    logger.info("STT silence timeout – no audio received")
                    await send_json({
                        "type": "silence",
                        "text": accumulated_transcript,
                        "ts": int(time.time() * 1000),
                    })
                    silence_notified = True
                continue
            except WebSocketDisconnect:
                break

            # Reset silence flag on new audio
            silence_notified = False
            last_speech_time = time.time()
            audio_buffer.extend(message)

            # Drain buffer when we have enough samples for inference
            while len(audio_buffer) >= BUFFER_SAMPLES * 2:  # *2 because int16 = 2 bytes/sample
                # Extract one window of audio
                window_bytes = bytes(audio_buffer[: BUFFER_SAMPLES * 2])

                # Keep overlap at front for next window (context continuity)
                audio_buffer = audio_buffer[BUFFER_SAMPLES * 2 - OVERLAP_SAMPLES * 2 :]

                # Run inference in a thread pool so we don't block the event loop
                pcm = pcm_bytes_to_float32(window_bytes)
                text, _ = await asyncio.get_event_loop().run_in_executor(
                    None, transcribe_chunk, pcm
                )

                if text:
                    # Deduplicate: don't re-emit text already in accumulated
                    if text.lower() not in accumulated_transcript.lower():
                        accumulated_transcript += (" " + text if accumulated_transcript else text)
                        accumulated_transcript = accumulated_transcript.strip()

                    await send_json({
                        "type": "partial",
                        "text": accumulated_transcript,
                        "ts": int(time.time() * 1000),
                    })
                    logger.info(f"[STT partial] {accumulated_transcript}")

    except WebSocketDisconnect:
        logger.info(f"STT WebSocket disconnected: {ws.client}")
    except Exception as exc:
        logger.error(f"STT WebSocket error: {exc}", exc_info=True)
    finally:
        # Send final accumulated transcript on close
        if accumulated_transcript.strip():
            try:
                await send_json({
                    "type": "final",
                    "text": accumulated_transcript.strip(),
                    "ts": int(time.time() * 1000),
                })
            except Exception:
                pass
        logger.info("STT WebSocket session ended.")


# ---------------------------------------------------------------------------
# Existing InsightFace routes (unchanged)
# ---------------------------------------------------------------------------

@app.get("/")
async def home():
    return {
        "status": "online",
        "service": "RememberMe AI Service",
        "face_model": "buffalo_l (ArcFace)",
        "stt_model": WHISPER_MODEL_SIZE,
    }


@app.post("/embed")
async def get_embedding(file: UploadFile = File(...)):
    try:
        contents = await file.read()
        nparr = np.frombuffer(contents, np.uint8)
        img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

        if img is None:
            return {"success": False, "error": "Could not decode image"}

        faces = face_app.get(img)

        if not faces or len(faces) == 0:
            return {"success": False, "error": "No face found in the image"}

        largest_face = max(
            faces, key=lambda f: (f.bbox[2] - f.bbox[0]) * (f.bbox[3] - f.bbox[1])
        )
        confidence = float(largest_face.det_score)
        logger.info(f"Face detected with SCRFD confidence: {confidence:.2f}")

        if confidence < 0.6:
            return {"success": False, "error": f"Low detection confidence ({confidence:.2f})"}

        embedding = largest_face.normed_embedding
        if hasattr(embedding, "tolist"):
            embedding = embedding.tolist()

        bbox = largest_face.bbox.tolist() if hasattr(largest_face.bbox, "tolist") else largest_face.bbox

        return {
            "success": True,
            "embedding": embedding,
            "confidence": confidence,
            "bbox": bbox,
        }

    except Exception as exc:
        logger.error(f"Unexpected error in /embed: {str(exc)}")
        return {"success": False, "error": f"Internal server error: {str(exc)}"}


# ---------------------------------------------------------------------------
# Entrypoint
# ---------------------------------------------------------------------------
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000, ws_ping_interval=20, ws_ping_timeout=20)
