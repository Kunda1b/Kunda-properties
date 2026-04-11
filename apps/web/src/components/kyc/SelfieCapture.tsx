"use client"

import { useState, useRef, useCallback, useEffect } from "react"
import { validateSelfieFile, fileToPreviewURL } from "@/lib/upload"

type Props = {
  onCapture: (file: File) => void
  currentFile?: File | null
}

export default function SelfieCapture({ onCapture, currentFile }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const streamRef = useRef<MediaStream | null>(null)

  const [mode, setMode] = useState<"idle" | "camera" | "preview">("idle")
  const [preview, setPreview] = useState<string | null>(null)
  const [error, setError] = useState("")
  const [cameraError, setCameraError] = useState("")

  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop())
      }
    }
  }, [])

  const startCamera = async () => {
    setCameraError("")
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width: 640, height: 480 },
      })
      streamRef.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
      }
      setMode("camera")
    } catch {
      setCameraError(
        "Camera access denied. Please allow camera access or upload a photo instead.",
      )
    }
  }

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop())
      streamRef.current = null
    }
  }

  const capture = useCallback(() => {
    const video = videoRef.current
    const canvas = canvasRef.current
    if (!video || !canvas) return

    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    ctx.drawImage(video, 0, 0)

    canvas.toBlob(
      (blob) => {
        if (!blob) return
        const file = new File([blob], "selfie.jpg", { type: "image/jpeg" })
        const url = URL.createObjectURL(blob)
        setPreview(url)
        setMode("preview")
        stopCamera()
        onCapture(file)
      },
      "image/jpeg",
      0.9,
    )
  }, [onCapture])

  const retake = () => {
    setPreview(null)
    setMode("idle")
    setError("")
  }

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const err = validateSelfieFile(file)
    if (err) { setError(err); return }
    setError("")
    setPreview(fileToPreviewURL(file))
    setMode("preview")
    onCapture(file)
  }

  return (
    <div>
      <label className="block text-xs font-medium text-gray-700 mb-1.5">
        Selfie photo
      </label>

      {mode === "idle" && (
        <div>
          {cameraError && (
            <p className="text-xs text-amber-600 mb-3 p-2 bg-amber-50 rounded-lg">
              {cameraError}
            </p>
          )}
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={startCamera}
              className="flex flex-col items-center justify-center gap-2 p-5 border-2 border-dashed border-gray-200 rounded-xl hover:border-gray-300 transition-colors"
            >
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center"
                style={{ backgroundColor: "var(--kunda-green-light)" }}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z"
                    stroke="#0F6E56"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <circle
                    cx="12"
                    cy="13"
                    r="4"
                    stroke="#0F6E56"
                    strokeWidth="1.8"
                  />
                </svg>
              </div>
              <div className="text-center">
                <p className="text-xs font-medium text-gray-900">Use camera</p>
                <p className="text-xs text-gray-400 mt-0.5">Take a selfie now</p>
              </div>
            </button>

            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="flex flex-col items-center justify-center gap-2 p-5 border-2 border-dashed border-gray-200 rounded-xl hover:border-gray-300 transition-colors"
            >
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center"
                style={{ backgroundColor: "var(--kunda-green-light)" }}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12"
                    stroke="#0F6E56"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
              <div className="text-center">
                <p className="text-xs font-medium text-gray-900">Upload photo</p>
                <p className="text-xs text-gray-400 mt-0.5">JPG, PNG up to 3MB</p>
              </div>
            </button>
          </div>
          <input
            ref={inputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={handleUpload}
            className="hidden"
          />
        </div>
      )}

      {mode === "camera" && (
        <div className="rounded-xl overflow-hidden border border-gray-200">
          <div className="relative bg-black">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full"
              style={{ maxHeight: "280px", objectFit: "cover" }}
            />
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="w-40 h-48 border-2 border-white border-opacity-60 rounded-full opacity-40" />
            </div>
          </div>
          <div className="p-4 bg-gray-50 flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={() => { stopCamera(); setMode("idle") }}
              className="px-4 py-2 text-xs font-medium text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-100 transition-colors"
            >
              Cancel
            </button>
            <p className="text-xs text-gray-500 flex-1 text-center">
              Position your face in the oval
            </p>
            <button
              type="button"
              onClick={capture}
              className="px-5 py-2 text-xs font-medium text-white rounded-lg transition-opacity hover:opacity-90"
              style={{ backgroundColor: "var(--kunda-green)" }}
            >
              Capture
            </button>
          </div>
          <canvas ref={canvasRef} className="hidden" />
        </div>
      )}

      {mode === "preview" && preview && (
        <div className="relative rounded-xl overflow-hidden border border-gray-200">
          <img
            src={preview}
            alt="Selfie preview"
            className="w-full h-48 object-cover object-top"
          />
          <div className="absolute inset-0 bg-black bg-opacity-0 hover:bg-opacity-30 transition-all flex items-center justify-center opacity-0 hover:opacity-100">
            <button
              type="button"
              onClick={retake}
              className="bg-white text-gray-700 text-xs font-medium px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Retake
            </button>
          </div>
          <div
            className="absolute bottom-2 right-2 bg-white rounded-full px-2 py-0.5 text-xs font-medium"
            style={{ color: "var(--kunda-green)" }}
          >
            Ready
          </div>
        </div>
      )}

      {error && <p className="text-xs text-red-500 mt-1.5">{error}</p>}

      <p className="text-xs text-gray-400 mt-2">
        Make sure your face is clearly visible, well-lit, and matches your document
      </p>
    </div>
  )
}
