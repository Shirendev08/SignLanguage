"use client"
import { useEffect, useRef, useState } from 'react';

import Image from 'next/image';
import { Button } from './ui/button';
import * as tf from '@tensorflow/tfjs';
import { load as cocoModalLoad } from '@tensorflow-models/coco-ssd';

export default function ObjectDetection() {
    const canvasEle = useRef(null);
    const imageEle = useRef(null);
    const [objectDetector, setObjectDetectors] = useState(null);
    const [detectedObjects, setDetectedObjects] = useState([]);
    const [uploadedImage, setUploadedImage] = useState(null);

    const draw = (ctx, objects) => {
        canvasEle.current.width = imageEle.current.width;
        canvasEle.current.height = imageEle.current.height;
        // Clear part of the canvas
        ctx.fillStyle = '#000000';
        ctx.fillRect(0, 0, imageEle.current.width, imageEle.current.height);

        ctx.drawImage(
            imageEle.current,
            0,
            0,
            imageEle.current.width,
            imageEle.current.height
        );
        for (let i = 0; i < objects.length; i += 1) {
            // Draw the background rectangle
            ctx.fillStyle = 'rgba(0, 128, 0, 0.5)';
            ctx.strokeStyle = 'white';
            ctx.fillRect(
                objects[i].bbox[0],
                objects[i].bbox[1],
                objects[i].bbox[2],
                20
            );

            ctx.font = '16px Arial';
            ctx.fillStyle = 'white';
            ctx.fillText(
                objects[i].class,
                objects[i].bbox[0] + 4,
                objects[i].bbox[1] + 16
            );

            ctx.beginPath();
            ctx.rect(
                objects[i].bbox[0],
                objects[i].bbox[1],
                objects[i].bbox[2],
                objects[i].bbox[3]
            );
            ctx.strokeStyle = 'green';
            ctx.stroke();
            ctx.closePath();
        }
    };

    const startDetecting = async () => {
        const image = tf.browser.fromPixels(imageEle.current);
        const predictions = await objectDetector.detect(image);

        setDetectedObjects(predictions);
        if (predictions && canvasEle.current) {
            draw(canvasEle.current.getContext('2d'), predictions);
        }
    };

    const loadOCRModel = async () => {
        const model = await cocoModalLoad();
        setObjectDetectors(model);
    };

    useEffect(() => {
        loadOCRModel();
    }, []);

    const setImage = (event) => {
        if (event.target.files && event.target.files[0]) {
            const image = event.target.files[0];
            if (canvasEle.current) {
                const canvas = canvasEle.current.getContext('2d');
                canvas.reset();
            }
            setUploadedImage(URL.createObjectURL(image));
        }
    };

    return (
        <>
           
            <div className="">
                <div className="">
                    <div className="">
                        {uploadedImage && (
                            <>
                                <Image
                                    ref={imageEle}
                                    src={uploadedImage}
                                    alt='sample image'
                                    width={1000}
                                    height={1000}
                                    style={{ objectFit: 'fill' }}
                                />
                                <canvas
                                    ref={canvasEle} 
                                    className=""
                                    width={1000}
                                    height={1000}
                                />
                            </>
                        )}
                    </div>
                    <div>
                        <label
                            htmlFor='fileSelect'
                            className="">
                            <span>
                                <i className='bi bi-upload'></i>
                            </span>
                            Upload an image
                        </label>
                        <input
                            id='fileSelect'
                            type='file'
                            onChange={setImage}
                            hidden
                        />
                    </div>

                    {uploadedImage && (
                        <Button
                            onClick={startDetecting}>
                            Start detection
                        </Button>
                    )}
                </div>
                <div className="">
                    <h3>Results</h3>
                    <ul>
                        {detectedObjects.length > 0 ? (
                            detectedObjects.map((data, index) => (
                                <li key={`${data.label}-${index}`}>
                                    <p>
                                        <label>Object {index + 1}</label>:
                                        <span> {data.class}</span>
                                    </p>
                                    <p>
                                        <label>Confidence</label>:{' '}
                                        <span>
                                            {Math.abs(data.score * 100).toFixed(
                                                2
                                            )}
                                            %
                                        </span>
                                    </p>
                                </li>
                            ))
                        ) : (
                            <>
                                {imageEle.current && (
                                    <li>
                                        <p>No Result Found</p>
                                    </li>
                                )}
                            </>
                        )}
                    </ul>
                </div>
            </div>
        </>
    );
}