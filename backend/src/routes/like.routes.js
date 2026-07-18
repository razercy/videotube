import { Router } from 'express';
import {
    getLikedVideos,
    toggleCommentLike,
    toggleVideoLike,
    toggleTweetLike,
    isTweetLiked,
    getTweetLikeCount,
    isVideoLiked,
    getVideoLikeCountUserInc,
    getVideoLikeCount,
} from "../controllers/like.controller.js"
import {verifyJWT} from "../middlewares/auth.middleware.js"

const router = Router();
// router.use(verifyJWT); // Apply verifyJWT middleware to all routes in this file

router.route("/toggle/v/:videoId").post(verifyJWT, toggleVideoLike);
router.route("/toggle/c/:commentId").post(verifyJWT, toggleCommentLike);
router.route("/toggle/t/:tweetId").post(verifyJWT, toggleTweetLike);
router.route("/t/:tweetId").get(verifyJWT, isTweetLiked);
router.route("/count/t/:tweetId").get(getTweetLikeCount);
router.route("/videos").get(verifyJWT, getLikedVideos);
router.route("/v/:videoId").get(verifyJWT, isVideoLiked);
router.route("/count/u/v/:videoId").get(verifyJWT, getVideoLikeCountUserInc);
router.route("/count/v/:videoId").get(getVideoLikeCount);

export default router