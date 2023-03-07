import './scss/styles.scss';
// Import all of Bootstrap's JS
// import * as bootstrap from 'bootstrap'

// import * as bootstrap from 'bootstrap'
// import '@tensorflow/tfjs-core';
import $ from 'jquery';
import * as tf from '@tensorflow/tfjs-core';
import '@tensorflow/tfjs-backend-webgl';
import { BodyPix, SemanticPartSegmentation } from '@tensorflow-models/body-pix';
import * as bodyPix from '@tensorflow-models/body-pix';
// import * as tfjsWasm from '@tensorflow/tfjs-backend-wasm';
import * as bodySegmentation from '@tensorflow-models/body-segmentation';
import { InputImage } from '@mediapipe/pose';
import { drawKeypoints, drawSkeleton } from '@/js/utils';
// Uncomment the line below if you want to use TensorFlow.js runtime.
// import '@tensorflow/tfjs-converter';

const rainbow = [
  [110, 64, 170],
  [143, 61, 178],
  [178, 60, 178],
  [210, 62, 167],
  [238, 67, 149],
  [255, 78, 125],
  [255, 94, 99],
  [255, 115, 75],
  [255, 140, 56],
  [239, 167, 47],
  [217, 194, 49],
  [194, 219, 64],
  [175, 240, 91],
  [135, 245, 87],
  [96, 247, 96],
  [64, 243, 115],
  [40, 234, 141],
  [28, 219, 169],
  [26, 199, 194],
  [33, 176, 213],
  [47, 150, 224],
  [65, 125, 224],
  [84, 101, 214],
  [99, 81, 195],
];
const canvasElement = document.getElementsByClassName(
  'output_canvas',
)[0] as HTMLCanvasElement;
const ctx = canvasElement.getContext('2d');
let segmenter: BodyPix;
async function setup() {
  // tfjsWasm.setWasmPaths(
  //   `https://cdn.jsdelivr.net/npm/@tensorflow/tfjs-backend-wasm@${
  //     tfjsWasm.version_wasm}/dist/`);
  await tf.setBackend('webgl');
  segmenter = await bodyPix.load({
    architecture: 'ResNet50',
    outputStride: 16,
    multiplier: 1.0,
    quantBytes: 4,
  });
}

function drawPoses(
  personOrPersonPartSegmentation: SemanticPartSegmentation,
  flipHorizontally: boolean,
  ctx: CanvasRenderingContext2D | null,
) {
  if (Array.isArray(personOrPersonPartSegmentation)) {
    console.log('personOrPersonPartSegmentation');
    personOrPersonPartSegmentation.forEach((personSegmentation) => {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      console.log('pose');
      const pose = personSegmentation.pose;
      // if (flipHorizontally) {
      //   pose = bodySegmentation.flipPoseHorizontal(pose, personSegmentation.width);
      // }
      drawKeypoints(pose.keypoints, 0.1, ctx);
      drawSkeleton(pose.keypoints, 0.1, ctx);
    });
  } else {
    personOrPersonPartSegmentation.allPoses.forEach((pose) => {
      if (flipHorizontally) {
        pose = bodyPix.flipPoseHorizontal(
          pose,
          personOrPersonPartSegmentation.width,
        );
      }
      drawKeypoints(pose.keypoints, 0.1, ctx);
      drawSkeleton(pose.keypoints, 0.1, ctx);
    });
  }
}
async function body_segment(image: InputImage) {
  const segmentation = await segmenter.segmentPersonParts(
    image,
    //   , {
    //   internalResolution: ,
    //   segmentationThreshold: ,
    //   maxDetections: ,
    //   scoreThreshold: ,
    //   nmsRadius: ,
    // }
  );
  // Convert the segmentation into a mask to darken the background.
  const coloredPartImage = await bodyPix.toColoredPartMask(
    segmentation,
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    rainbow,
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
  drawPoses(segmentation, flipHorizontal, ctx);
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
        $('.loading').css('display', 'none');
      };
    };
    fileReader.readAsDataURL(file);
  });
});
