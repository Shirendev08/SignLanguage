"use client";
import React, { useRef, useEffect, useState } from 'react';
import * as cocoSsd from '@tensorflow-models/coco-ssd';
import '@tensorflow/tfjs';

const Realtime: React.FC = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [detectedObjects, setDetectedObjects] = useState<string[]>([]);

  useEffect(() => {
    const loadModelAndWebcam = async () => {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({
            audio: false,
            video: {
              facingMode: 'user'
            }
          });

          if (videoRef.current) {
            videoRef.current.srcObject = stream;
            await new Promise<void>((resolve) => {
              videoRef.current!.onloadedmetadata = () => resolve();
            });

            const model = await cocoSsd.load();
            detectFrame(videoRef.current, model);
          }
        } catch (error) {
          console.error('Error accessing webcam or loading model:', error);
        }
      }
    };

    const detectFrame = (video: HTMLVideoElement, model: cocoSsd.ObjectDetection) => {
      model.detect(video).then((predictions) => {
        renderPredictions(predictions);
        updateDetectedObjects(predictions);
        requestAnimationFrame(() => detectFrame(video, model));
      });
    };

    const renderPredictions = (predictions: cocoSsd.DetectedObject[]) => {
      const ctx = canvasRef.current?.getContext('2d');
      if (ctx) {
        ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
        const font = '16px sans-serif';
        ctx.font = font;
        ctx.textBaseline = 'top';

        predictions.forEach((prediction) => {
          const [x, y, width, height] = prediction.bbox;

          // Draw the bounding box
          ctx.strokeStyle = '#00FFFF';
          ctx.lineWidth = 4;
          ctx.strokeRect(x, y, width, height);

          // Draw the label background
          ctx.fillStyle = '#00FFFF';
          const textWidth = ctx.measureText(prediction.class).width;
          const textHeight = parseInt(font, 10);
          ctx.fillRect(x, y, textWidth + 4, textHeight + 4);
        });

        predictions.forEach((prediction) => {
          const [x, y] = prediction.bbox;

          // Draw the text
          ctx.fillStyle = '#000000';
          ctx.fillText(prediction.class, x, y);
        });
      }
    };

    const updateDetectedObjects = (predictions: cocoSsd.DetectedObject[]) => {
      // Create a new array of detected labels
      const detectedLabels = predictions.map((prediction) => prediction.class);

      // Append new detections to the existing state, avoiding duplicates
      setDetectedObjects((prev) => {
        const uniqueDetectedLabels = Array.from(new Set([...prev, ...detectedLabels]));
        return uniqueDetectedLabels;
      });
    };

    loadModelAndWebcam();
  }, []);

  // Function to read the text from the text area
  const readText = () => {
    const textToRead = detectedObjects.join(', ');
    if (textToRead) {
      const utterance = new SpeechSynthesisUtterance(textToRead);
      speechSynthesis.speak(utterance);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center h-screen p-5">
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        width="600"
        height="500"
        style={{ display: 'block', position: 'fixed', top: 0, left: 550 }}
      />
      <canvas
        ref={canvasRef}
        width="600"
        height="500"
        style={{ display: 'block', position: 'fixed', top: 0, left: 550 }}
      />

<textarea
  value={detectedObjects.join(', ')}  // Display all detected objects
  readOnly
  className="w-1/2 h-24 text-center border border-gray-300 mt-24 rounded-lg p-2"  // Increased margin top
/>

      <button
        onClick={readText}
        className="mt-4 p-2 bg-blue-500 text-white rounded mt-20 hover:bg-blue-600"
      >
        Read Detected Objects
      </button>
    </div>
  );
};

export default Realtime;
