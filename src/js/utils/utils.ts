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
  const mapping = poseDetection.util.getKeypointIndexByName(
    poseDetection.SupportedModels.BlazePose,
  );
  const middleTop = middlePoint(
    keypoints[mapping['left_shoulder']],
    keypoints[mapping['right_shoulder']],
    'middle_top',
  );
  middleTop.y =
    Math.min(
      keypoints[mapping['left_eye_inner']].y,
      keypoints[mapping['right_eye_inner']].y,
    ) * 0.8;
  const middleBottom = middlePoint(
    keypoints[mapping['left_hip']],
    keypoints[mapping['right_hip']],
    'middle_bottom',
  );
  middleBottom.y = Math.max(
    keypoints[mapping['left_foot_index']].y,
    keypoints[mapping['right_foot_index']].y,
  );

  ctx.fillStyle = 'Red';
  ctx.strokeStyle = 'Red';
  ctx.lineWidth = DEFAULT_LINE_WIDTH;
  draw(middleTop, middleBottom, ctx);
  draw(keypoints[mapping['left_knee']], keypoints[mapping['right_knee']], ctx);
  ctx.fillStyle = 'White';
  ctx.strokeStyle = 'White';
  ctx.lineWidth = DEFAULT_LINE_WIDTH;
  poseDetection.util
    .getAdjacentPairs(poseDetection.SupportedModels.BlazePose)
    .forEach(([i, j]) => draw(keypoints[i], keypoints[j], ctx));
}
function draw(
  kp1: Keypoint,
  kp2: Keypoint,
  ctx: CanvasRenderingContext2D,
): void {
  const scoreThreshold = SCORE_THRESHOLD || 0;
  // If score is null, just show the keypoint.
  const score1 = kp1.score != null ? kp1.score : 1;
  const score2 = kp2.score != null ? kp2.score : 1;
  if (score1 >= scoreThreshold && score2 >= scoreThreshold) {
    ctx.beginPath();
    ctx.moveTo(kp1.x, kp1.y);
    ctx.lineTo(kp2.x, kp2.y);
    ctx.stroke();
  }
}
function middlePoint(kp1: Keypoint, kp2: Keypoint, name: string): Keypoint {
  return {
    x: (kp1.x + kp2.x) / 2,
    y: (kp1.y + kp2.y) / 2,
    // z: (kp1.z + kp2.z) / 2,
    // score: (kp1.score + kp2.score) / 2,
    name: name,
  };
}
