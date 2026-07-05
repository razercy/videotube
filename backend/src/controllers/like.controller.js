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

    const video = await Video.findById(videoId)

    const user = await User.findById(req.user?._id)
    
    const existedLike = await Like.findOne({
        $and: [{ video }, { likedBy: user }]
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
            video,
            likedBy: user
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

    const comment = await Comment.findById(commentId)

    const user = await User.findById(req.user?._id)
    
    const existedLike = await Like.findOne({
        $and: [{ comment }, { likedBy: user }]
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
            comment,
            likedBy: user
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

    const tweet = await Tweet.findById(tweetId)

    const user = await User.findById(req.user?._id)
    
    const existedLike = await Like.findOne({
        $and: [{ tweet }, { likedBy: user }]
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
            tweet,
            likedBy: user
        })
    
        return res
        .status(200)
        .json(
            new ApiResponse(200, createdLike, "Tweet liked successfully")
        )
    }
}
)

const getLikedVideos = asyncHandler(async (req, res) => {
    const user = await User.findById(req.user?._id)
    
    const embeddedLikedVideos = await Like.aggregate([
        {
            $match: {
                likedBy: user,
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
    getLikedVideos
}