import mongoose, {isValidObjectId} from "mongoose"
import {Like} from "../models/like.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"

const toggleVideoLike = asyncHandler(async (req, res) => {
    const {videoId} = req.params
    
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

const getLikedVideos = asyncHandler(async (req, res) => {
    
    const embeddedLikedVideos = await Like.aggregate([
        {
            $match: {
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