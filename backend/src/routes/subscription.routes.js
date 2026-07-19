import { Router } from 'express';
import {
    getSubscribedChannels,
    getSubscriberCount,
    getUserChannelSubscribers,
    isSubscribed,
    toggleSubscription,
} from "../controllers/subscription.controller.js"
import {verifyJWT} from "../middlewares/auth.middleware.js"

const router = Router();
// router.use(verifyJWT); // Apply verifyJWT middleware to all routes in this file

router
    .route("/c/:channelId")
    .get(getUserChannelSubscribers)
    .post(verifyJWT, toggleSubscription);

router.route("/u/:subscriberId").get(getSubscribedChannels);

router.route("/:channelId").get(verifyJWT, isSubscribed);

router.route("/count/:channelId").get(getSubscriberCount);

export default router