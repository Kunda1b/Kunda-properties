"use client"

import { useState, useRef, useCallback } from "react"
import { validateDocumentFile, fileToPreviewURL } from "@/lib/upload"

type Props = {
  label: string
  hint: string
  onFileSelected: (file: File) => void
  currentFile?: File | null
}

export default function DocumentUploader({
  label,
  hint,
  onFileSelected,
  currentFile,
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [dragOver, setDragOver] = useState(false)
  const [error, setError] = useState("")
  const [preview, setPreview] = useState<string | null>(null)

  const handleFile = useCallback(
    (file: File) => {
      const err = validateDocumentFile(file)
      if (err) {
        setError(err)
        return
      }
      setError("")
      setPreview(fileToPreviewURL(file))
      onFileSelected(file)
    },
    [onFileSelected],
  )

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    const file = e.dataTransfer.files[0]
    if (file) handleFile(file)
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) handleFile(file)
  }

  const handleRemove = () => {
    setPreview(null)
    setError("")
    if (inputRef.current) inputRef.current.value = ""
    onFileSelected(null as unknown as File)
  }

  return (
    <div>
      <label className="block text-xs font-medium text-gray-700 mb-1.5">
        {label}
      </label>

      {preview ? (
        <div className="relative rounded-xl overflow-hidden border border-gray-200">
          {currentFile?.type === "application/pdf" ? (
            <div className="h-32 flex items-center justify-center bg-gray-50">
              <div className="text-center">
                <div className="text-3xl mb-2">📄</div>
                <p className="text-xs text-gray-600 font-medium">
                  {currentFile.name}
                </p>
                <p className="text-xs text-gray-400">
                  {(currentFile.size / 1024).toFixed(0)} KB
                </p>
              </div>
            </div>
          ) : (
            <img
              src={preview}
              alt="Document preview"
              className="w-full h-40 object-cover"
            />
          )}
          <div
            className="absolute inset-0 bg-black bg-opacity-0 hover:bg-opacity-30 transition-all flex items-center justify-center opacity-0 hover:opacity-100"
          >
            <button
              onClick={handleRemove}
              className="bg-white text-red-500 text-xs font-medium px-4 py-2 rounded-lg hover:bg-red-50 transition-colors"
            >
              Remove
            </button>
          </div>
          <div
            className="absolute bottom-2 right-2 bg-white rounded-full px-2 py-0.5 text-xs font-medium"
            style={{ color: "var(--kunda-green)" }}
          >
            Ready
          </div>
        </div>
      ) : (
        <div
          onDragOver={(e) => {
            e.preventDefault()
            setDragOver(true)
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          onClick={() => inputRef.current?.click()}
          className="border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-colors"
          style={{
            borderColor: dragOver
              ? "var(--kunda-green)"
              : error
              ? "#fca5a5"
              : "#e5e7eb",
            backgroundColor: dragOver ? "var(--kunda-green-light)" : "white",
          }}
        >
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center mx-auto mb-3"
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
          <p className="text-sm font-medium text-gray-900 mb-1">
            Drop your file here or click to browse
          </p>
          <p className="text-xs text-gray-400">{hint}</p>
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,application/pdf"
        onChange={handleChange}
        className="hidden"
      />

      {error && <p className="text-xs text-red-500 mt-1.5">{error}</p>}
    </div>
  )
}
