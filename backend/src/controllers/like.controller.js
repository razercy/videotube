import mongoose, {isValidObjectId} from "mongoose"
import {Like} from "../models/like.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"
import { Video } from "../models/video.model.js"
import { User } from "../models/user.model.js"
import { Comment } from "../models/comment.model.js"
import { Tweet } from "../models/tweet.model.js"

const toggleVideoLike = asyncHandler(async (req, res) => {
    const {videoId} = req.params

    // const video = await Video.findById(videoId)

    // const user = await User.findById(req.user?._id)
    
    const existedLike = await Like.findOne({
        $and: [{ video: videoId }, { likedBy: req.user?._id }]
    })

    if(existedLike) {
        const removedLike = await Like.findByIdAndDelete(existedLike._id)
    
        return res
        .status(200)
        .json(
            new ApiResponse(200, removedLike, "Like removed successfully")
        )
    }
    else {
        const createdLike = await Like.create({
            video: videoId,
            likedBy: req.user?._id
        })
    
        return res
        .status(200)
        .json(
            new ApiResponse(200, createdLike, "Video liked successfully")
        )
    }
})

const toggleCommentLike = asyncHandler(async (req, res) => {
    const {commentId} = req.params

    // const comment = await Comment.findById(commentId)

    // const user = await User.findById(req.user?._id)
    
    const existedLike = await Like.findOne({
        $and: [{ comment: commentId }, { likedBy: req.user?._id }]
    })

    if(existedLike) {
        const removedLike = await Like.findByIdAndDelete(existedLike._id)
    
        return res
        .status(200)
        .json(
            new ApiResponse(200, removedLike, "Like removed successfully")
        )
    }
    else {
        const createdLike = await Like.create({
            comment: commentId,
            likedBy: req.user?._id
        })
    
        return res
        .status(200)
        .json(
            new ApiResponse(200, createdLike, "Comment liked successfully")
        )
    }

})

const toggleTweetLike = asyncHandler(async (req, res) => {
    const {tweetId} = req.params

    // const tweet = await Tweet.findById(tweetId)

    // const user = await User.findById(req.user?._id)
    
    const existedLike = await Like.findOne({
        $and: [{ tweet: tweetId }, { likedBy: req.user?._id }]
    })

    if(existedLike) {
        const removedLike = await Like.findByIdAndDelete(existedLike._id)
    
        return res
        .status(200)
        .json(
            new ApiResponse(200, removedLike, "Like removed successfully")
        )
    }
    else {
        const createdLike = await Like.create({
            tweet: tweetId,
            likedBy: req.user?._id
        })
    
        return res
        .status(200)
        .json(
            new ApiResponse(200, createdLike, "Tweet liked successfully")
        )
    }
}
)

const isTweetLiked = asyncHandler(async(req, res) => {
    const { tweetId } = req.params

    const existedLike = await Like.findOne({
        $and: [{ tweet: tweetId }, { likedBy: req.user?._id }]
    })

    if (existedLike) {
        return res
        .status(200)
        .json(
            new ApiResponse(200, true, "Like found successfully")
        )
    } else {
        return res
        .status(404)
        .json(
            new ApiResponse(404, false, "Like not found")
        )
    }
})

const getTweetLikeCount = asyncHandler(async(req, res) => {
    const { tweetId } = req.params

    const tweetLikes = await Like.aggregate([
        {
            $match: {
                tweet: tweetId,
                likedBy: {
                    $ne: req.user?._id,
                    $ne: null,
                    $exists: true
                }
            }
        }
    ])

    return res
    .status(200)
    .json(
        new ApiResponse(200, tweetLikes.length, "Tweet like count fetched successfully")
    )
})

const getLikedVideos = asyncHandler(async (req, res) => {
    // const user = await User.findById(req.user?._id)
    
    const embeddedLikedVideos = await Like.aggregate([
        {
            $match: {
                likedBy: req.user?._id,
                video: {
                    $ne: null,
                    $exists: true
                }
            }
        },
        {
            $lookup: {
                from: "videos",
                localField: "video",
                foreignField: "_id",
                as: "likeVideos"
            }
        },
        {
            $unwind: "$likeVideos"
        },
        {
            $project: {
                likeVideos: 1
            }
        },
        {
            $group: {
                _id: "$likeVideos"
            }
        }
    ])

    const likedVideos = embeddedLikedVideos.map((element) => element._id)

    return res
    .status(200)
    .json(
        new ApiResponse(200, likedVideos, "Liked videos fetched successfully")
    )
})

export {
    toggleCommentLike,
    toggleTweetLike,
    toggleVideoLike,
    isTweetLiked,
    getTweetLikeCount,
    getLikedVideos
}