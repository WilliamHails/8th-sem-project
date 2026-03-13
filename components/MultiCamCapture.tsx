import React, { useEffect, useRef, useState } from "react";
import { Camera, CameraOff, AlertCircle, Loader2 } from "lucide-react";

interface MultiCamCaptureProps {
  onCapture: (
    frames: { cameraIndex: number; frameIndex: number; dataUrl: string }[]
  ) => void;
  isProcessing: boolean;
}

const MultiCamCapture: React.FC<MultiCamCaptureProps> = ({
  onCapture,
  isProcessing,
}) => {
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [builtInCamera, setBuiltInCamera] = useState<MediaDeviceInfo | null>(null);
  const [externalCamera, setExternalCamera] = useState<MediaDeviceInfo | null>(null);
  const [useDualCamera, setUseDualCamera] = useState(false);
  const [cameraStatus, setCameraStatus] = useState<string>("Initializing...");

  const videoRef1 = useRef<HTMLVideoElement | null>(null);
  const videoRef2 = useRef<HTMLVideoElement | null>(null);
  const canvasRef1 = useRef<HTMLCanvasElement | null>(null);
  const canvasRef2 = useRef<HTMLCanvasElement | null>(null);

  // Detect and separate cameras
  useEffect(() => {
    const detectCameras = async () => {
      try {
        // Request access to get default camera
        const tempStream = await navigator.mediaDevices.getUserMedia({
          video: true,
        });
        const defaultTrack = tempStream.getVideoTracks()[0];
        const defaultSettings = defaultTrack.getSettings();
        const defaultDeviceId = (defaultSettings.deviceId as string | undefined) || null;
        tempStream.getTracks().forEach((t) => t.stop());

        // Enumerate all devices
        const allDevices = await navigator.mediaDevices.enumerateDevices();
        const cameras = allDevices.filter((d) => d.kind === "videoinput");
        setDevices(cameras);

        if (cameras.length === 0) {
          setCameraStatus("❌ No cameras detected");
          return;
        }

        // Separate built-in and external cameras
        let built: MediaDeviceInfo | null = null;
        let external: MediaDeviceInfo | null = null;

        if (defaultDeviceId) {
          built = cameras.find((c) => c.deviceId === defaultDeviceId) || null;
          external = cameras.find((c) => c.deviceId !== defaultDeviceId) || null;
        } else {
          built = cameras[0];
          external = cameras.length > 1 ? cameras[1] : null;
        }

        setBuiltInCamera(built);
        setExternalCamera(external);

        if (built && external) {
          setCameraStatus("✓ Dual camera mode available");
          setUseDualCamera(true);
        } else if (built || external) {
          setCameraStatus(
            `✓ Single camera available (${built?.label || external?.label || "Unknown"})`
          );
          setUseDualCamera(false);
        }
      } catch (err) {
        console.error("Camera detection error:", err);
        setCameraStatus("❌ Camera access denied or failed");
      }
    };

    detectCameras();
  }, []);

  // Start video stream for camera 1
  useEffect(() => {
    const cam = useDualCamera ? builtInCamera : builtInCamera || externalCamera;
    if (!cam || !videoRef1.current) return;

    let stream: MediaStream | null = null;

    navigator.mediaDevices
      .getUserMedia({
        video: { deviceId: { exact: cam.deviceId } },
      })
      .then((s) => {
        stream = s;
        if (videoRef1.current) {
          videoRef1.current.srcObject = stream;
        }
      })
      .catch((err) => console.error("Camera 1 stream error:", err));

    return () => {
      if (stream) stream.getTracks().forEach((t) => t.stop());
    };
  }, [useDualCamera, builtInCamera, externalCamera]);

  // Start video stream for camera 2 (only in dual mode)
  useEffect(() => {
    if (!useDualCamera || !externalCamera || !videoRef2.current) return;

    let stream: MediaStream | null = null;

    navigator.mediaDevices
      .getUserMedia({
        video: { deviceId: { exact: externalCamera.deviceId } },
      })
      .then((s) => {
        stream = s;
        if (videoRef2.current) {
          videoRef2.current.srcObject = stream;
        }
      })
      .catch((err) => console.error("Camera 2 stream error:", err));

    return () => {
      if (stream) stream.getTracks().forEach((t) => t.stop());
    };
  }, [useDualCamera, externalCamera]);

  const grabFrame = (videoRef: React.RefObject<HTMLVideoElement>, canvasRef: React.RefObject<HTMLCanvasElement>): string | null => {
    if (!videoRef.current || !canvasRef.current) return null;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    
    if (video.videoWidth === 0 || video.videoHeight === 0) return null;
    
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;
    
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL("image/jpeg");
  };

  const handleCapture = () => {
    const frames: {
      cameraIndex: number;
      frameIndex: number;
      dataUrl: string;
    }[] = [];

    const frame1 = grabFrame(videoRef1, canvasRef1);
    if (frame1) {
      frames.push({
        cameraIndex: 0,
        frameIndex: 0,
        dataUrl: frame1,
      });
    }

    if (useDualCamera) {
      const frame2 = grabFrame(videoRef2, canvasRef2);
      if (frame2) {
        frames.push({
          cameraIndex: 1,
          frameIndex: 0,
          dataUrl: frame2,
        });
      }
    }

    if (frames.length > 0) {
      onCapture(frames);
    }
  };

  // No camera available
  if (!builtInCamera && !externalCamera) {
    return (
      <div className="w-full text-center py-10">
        <div className="bg-red-500/20 text-red-300 border border-red-500/40 p-6 rounded-xl max-w-lg mx-auto flex items-start gap-4">
          <CameraOff size={32} className="flex-shrink-0 mt-1" />
          <div>
            <h2 className="text-2xl font-bold mb-2 text-left">No Camera Detected</h2>
            <p className="text-gray-300 text-left">
              Please connect at least one camera (built-in or external USB webcam) to use the kiosk.
            </p>
          </div>
        </div>
        <button
          disabled
          className="mt-6 px-10 py-4 rounded-full bg-gray-700 text-gray-400 text-xl cursor-not-allowed"
        >
          Capture Disabled
        </button>
      </div>
    );
  }

  return (
    <div className="w-full flex flex-col items-center gap-6">
      {/* Camera Status */}
      <div className="w-full bg-indigo-500/20 border border-indigo-500/40 p-4 rounded-lg flex items-center gap-2 text-indigo-200">
        <Camera size={20} />
        <span className="font-medium">{cameraStatus}</span>
      </div>

      {/* Dual Camera Toggle (only show if both cameras available) */}
      {builtInCamera && externalCamera && (
        <div className="w-full max-w-md">
          <label className="flex items-center gap-3 p-4 bg-gray-700/50 rounded-lg cursor-pointer hover:bg-gray-700 transition">
            <input
              type="checkbox"
              checked={useDualCamera}
              onChange={(e) => setUseDualCamera(e.target.checked)}
              className="w-5 h-5 cursor-pointer"
              disabled={isProcessing}
            />
            <div>
              <div className="font-semibold text-white">Use Dual Camera Mode</div>
              <div className="text-xs text-gray-400">
                Capture from both cameras for better accuracy
              </div>
            </div>
          </label>
        </div>
      )}

      {/* Camera Feeds */}
      <div
        className={`w-full grid gap-4 ${
          useDualCamera ? "grid-cols-1 md:grid-cols-2" : "grid-cols-1 max-w-md"
        }`}
      >
        {/* Camera 1 */}
        <div className="flex flex-col items-center">
          <div className="relative rounded-xl overflow-hidden bg-black shadow w-full aspect-video">
            <video
              ref={videoRef1}
              autoPlay
              muted
              playsInline
              className="w-full h-full object-cover transform -scale-x-100"
            />
            <div className="absolute bottom-2 left-2 text-xs text-white bg-black/50 px-2 py-1 rounded flex items-center gap-1">
              <Camera size={12} /> {builtInCamera?.label || "Camera 1"}
            </div>
          </div>
        </div>

        {/* Camera 2 (only in dual mode) */}
        {useDualCamera && (
          <div className="flex flex-col items-center">
            <div className="relative rounded-xl overflow-hidden bg-black shadow w-full aspect-video">
              <video
                ref={videoRef2}
                autoPlay
                muted
                playsInline
                className="w-full h-full object-cover transform -scale-x-100"
              />
              <div className="absolute bottom-2 left-2 text-xs text-white bg-black/50 px-2 py-1 rounded flex items-center gap-1">
                <Camera size={12} /> {externalCamera?.label || "Camera 2"}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Hidden Canvases */}
      <canvas ref={canvasRef1} className="hidden" />
      <canvas ref={canvasRef2} className="hidden" />

      {/* Capture Button */}
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .animate-spin {
          animation: spin 1s linear infinite;
        }
      `}</style>
      <button
        onClick={handleCapture}
        disabled={isProcessing}
        className="px-12 py-4 rounded-full bg-indigo-600 hover:bg-indigo-700 text-white text-lg font-semibold shadow-lg disabled:bg-gray-700 disabled:text-gray-400 disabled:cursor-not-allowed transition-all hover:scale-105 active:scale-95 flex items-center gap-3"
      >
        {isProcessing ? (
          <>
            <Loader2 size={24} className="animate-spin" />
            Processing...
          </>
        ) : (
          "Capture & Verify"
        )}
      </button>

      {/* Info */}
      {useDualCamera && (
        <div className="w-full max-w-md p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg text-blue-200 text-sm flex gap-2">
          <AlertCircle size={16} className="flex-shrink-0 mt-0.5" />
          <span>Both cameras will be used for more accurate face recognition with averaged confidence scores.</span>
        </div>
      )}
    </div>
  );
};

export default MultiCamCapture;
