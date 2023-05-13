import './scss/styles.scss';
// Import all of Bootstrap's JS
// import * as bootstrap from 'bootstrap'

// import * as bootstrap from 'bootstrap'
// import '@tensorflow/tfjs-core';
import $ from 'jquery';
import '@tensorflow/tfjs-backend-webgl';
import * as poseDetection from '@tensorflow-models/pose-detection';
// Register WebGL backend.
import * as mpPose from '@mediapipe/pose';
// import * as tfjsWasm from '@tensorflow/tfjs-backend-wasm';
import * as bodySegmentation from '@tensorflow-models/body-segmentation';
import { InputImage } from '@mediapipe/pose';
import { drawKeypoints, drawSkeleton } from '@/js/utils/utils';
import { setBackend } from '@tensorflow/tfjs-core';
import { BlazePoseMediaPipeModelConfig } from '@tensorflow-models/pose-detection';
import { BlazePoseMediaPipeEstimationConfig } from '@tensorflow-models/pose-detection/dist/blazepose_mediapipe/types';
// Uncomment the line below if you want to use TensorFlow.js runtime.
// import '@tensorflow/tfjs-converter';

const canvasElement = document.getElementsByClassName(
  'output_canvas',
)[0] as HTMLCanvasElement;
// eslint-disable-next-line @typescript-eslint/no-unused-vars
let segmenter: bodySegmentation.BodySegmenter;
let detector: poseDetection.PoseDetector;
async function setup() {
  // tfjsWasm.setWasmPaths(
  //   `https://cdn.jsdelivr.net/npm/@tensorflow/tfjs-backend-wasm@${
  //     tfjsWasm.version_wasm}/dist/`);
  await setBackend('webgl');
  segmenter = await bodySegmentation.createSegmenter(
    bodySegmentation.SupportedModels.BodyPix,
    {
      architecture: 'ResNet50',
      outputStride: 16,
      multiplier: 1.0,
      quantBytes: 4,
    },
  );
  const model = poseDetection.SupportedModels.BlazePose;
  const detectorConfig: BlazePoseMediaPipeModelConfig = {
    runtime: 'mediapipe',
    // todo: choose runtime based on device. see: https://blog.tensorflow.org/2022/01/body-segmentation.html
    enableSmoothing: true,
    enableSegmentation: false,
    smoothSegmentation: false,
    solutionPath: `https://cdn.jsdelivr.net/npm/@mediapipe/pose@${mpPose.VERSION}`,
    modelType: 'heavy',
  };
  detector = await poseDetection.createDetector(model, detectorConfig);
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function drawPoses(poses: poseDetection.Pose[], ctx: CanvasRenderingContext2D) {
  for (const pose of poses) {
    if (pose.keypoints != null) {
      drawKeypoints(pose.keypoints, ctx);
      drawSkeleton(pose.keypoints, ctx);
    }
  }
}
async function body_segment(image: InputImage) {
  const segmentation = await segmenter.segmentPeople(image, {
    flipHorizontal: false,
    multiSegmentation: false,
    segmentBodyParts: true,
    // segmentationThreshold: STATE.visualization.foregroundThreshold
  });
  // Convert the segmentation into a mask to darken the background.
  const backgroundColor = { r: 0, g: 0, b: 0, a: 255 };
  const coloredPartImage = await bodySegmentation.toColoredMask(
    segmentation,
    bodySegmentation.bodyPixMaskValueToRainbowColor,
    backgroundColor,
  );
  const opacity = 0.7;
  const flipHorizontal = false;
  const maskBlurAmount = 0;
  // Draw the colored part image on top of the original image onto a canvas.
  // The colored part image will be drawn semi-transparent, with an opacity of
  // 0.7, allowing for the original image to be visible under.
  await bodySegmentation.drawMask(
    canvasElement,
    image,
    coloredPartImage,
    opacity,
    maskBlurAmount,
    flipHorizontal,
  );
  const estimationConfig: BlazePoseMediaPipeEstimationConfig = {
    flipHorizontal: flipHorizontal,
    maxPoses: 1,
  };
  const poses = await detector.estimatePoses(image, estimationConfig);
  const ctx = canvasElement.getContext('2d');
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  drawPoses(poses, ctx);
}

function fitImageToContainer(canvas: HTMLCanvasElement, img: InputImage) {
  const scale = Math.min(canvas.width / img.width, canvas.height / img.height);
  // Make it visually fill the positioned parent
  canvas.style.width = '500px';
  canvas.style.height = `${800 * scale}px`;
  // ...then set the internal size to match
  canvas.width = canvas.offsetWidth;
  canvas.height = canvas.offsetHeight;
}
$(async function () {
  await setup();
  $('#app').addClass('loaded');
  $(':file').on('change', function (e) {
    $('#app').removeClass('loaded');
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    const [file] = e.target.files;
    const fileReader = new FileReader();
    fileReader.onload = async function () {
      const image = new Image();
      if (typeof fileReader.result === 'string') {
        image.src = fileReader.result;
      }
      fitImageToContainer(canvasElement, image);
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      image.onload = async function (this: HTMLImageElement) {
        await body_segment(image);
        $('#app').addClass('loaded');
      };
    };
    fileReader.readAsDataURL(file);
  });
});
