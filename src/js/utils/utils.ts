import * as poseDetection from '@tensorflow-models/pose-detection';
import { DEFAULT_LINE_WIDTH, DEFAULT_RADIUS, SCORE_THRESHOLD } from './params';
import { Keypoint } from '@tensorflow-models/pose-detection';
/**
 * Draw the keypoints on the video.
 * @param keypoints A list of keypoints.
 * @param ctx
 */

export function drawKeypoints(
  keypoints: Keypoint[],
  ctx: CanvasRenderingContext2D,
): void {
  const keypointInd = poseDetection.util.getKeypointIndexBySide(
    poseDetection.SupportedModels.BlazePose,
  );
  ctx.fillStyle = 'White';
  ctx.strokeStyle = 'White';
  ctx.lineWidth = DEFAULT_LINE_WIDTH;

  for (const i of keypointInd.middle) {
    drawKeypoint(keypoints[i], ctx);
  }

  ctx.fillStyle = 'Green';
  for (const i of keypointInd.left) {
    drawKeypoint(keypoints[i], ctx);
  }

  ctx.fillStyle = 'Orange';
  for (const i of keypointInd.right) {
    drawKeypoint(keypoints[i], ctx);
  }
}

function drawKeypoint(keypoint: Keypoint, ctx: CanvasRenderingContext2D) {
  // If score is null, just show the keypoint.
  const score = keypoint.score != null ? keypoint.score : 1;
  const scoreThreshold = SCORE_THRESHOLD || 0;

  if (score >= scoreThreshold) {
    const circle = new Path2D();
    circle.arc(keypoint.x, keypoint.y, DEFAULT_RADIUS, 0, 2 * Math.PI);
    ctx.fill(circle);
    ctx.stroke(circle);
  }
}

/**
 * Draw the skeleton of a body on the video.
 * @param keypoints A list of keypoints.
 * @param ctx
 */
export function drawSkeleton(
  keypoints: Keypoint[],
  ctx: CanvasRenderingContext2D,
): void {
  ctx.fillStyle = 'White';
  ctx.strokeStyle = 'White';
  ctx.lineWidth = DEFAULT_LINE_WIDTH;

  poseDetection.util
    .getAdjacentPairs(poseDetection.SupportedModels.BlazePose)
    .forEach(([i, j]) => {
      const kp1 = keypoints[i];
      const kp2 = keypoints[j];

      // If score is null, just show the keypoint.
      const score1 = kp1.score != null ? kp1.score : 1;
      const score2 = kp2.score != null ? kp2.score : 1;
      const scoreThreshold = SCORE_THRESHOLD || 0;

      if (score1 >= scoreThreshold && score2 >= scoreThreshold) {
        ctx.beginPath();
        ctx.moveTo(kp1.x, kp1.y);
        ctx.lineTo(kp2.x, kp2.y);
        ctx.stroke();
      }
    });
}
