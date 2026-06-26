import mongoose from "mongoose"
import {Video} from "../models/video.model.js"
import {Subscription} from "../models/subscription.model.js"
import {Like} from "../models/like.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"

const getChannelStats = asyncHandler(async (req, res) => {
    
    const totalVideoViews = await Video.aggregate([
        {
            $match: {
                owner: req.user?._id
            }
        },
        {
            $group: {
                _id: null,
                videoViewCount: { $sum: "$views" }
            }
        },
        {
            $project: {
                _id: 0
            }
        }
    ])

    const totalSubscribers = await Subscription.aggregate([
        {
            $match: {
                channel: req.user?._id
            }
        },
        {
            $group: {
                _id: null,
                subscriberCount: { $sum: 1 }
            }
        },
        {
            $project: {
                _id: 0
            }
        }
    ])

    const totalVideos = await Video.aggregate([
        {
            $match: {
                owner: req.user?._id
            }
        },
        {
            $group: {
                _id: null,
                videoCount: { $sum: 1 }
            }
        },
        {
            $project: {
                _id: 0
            }
        }
    ])

    const totalLikes = await Video.aggregate([
        {
            $match: {
                owner: req.user?._id
            }
        },
        {
            $lookup: {
                from: "likes",
                localField: "_id",
                foreignField: "video",
                as: "videoLikes"
            }
        },
        {
            $group: {
                _id: null,
                likeCount: { $sum: { $size: "$videoLikes" } }
            }
        },
        {
            $project: {
                _id: 0
            }
        }
    ])

    const channelStats = {
        videoViewCount: totalVideoViews[0].videoViewCount,
        subscriberCount: totalSubscribers[0].subscriberCount,
        videoCount: totalVideos[0].videoCount,
        likeCount: totalLikes[0].likeCount
    }

    return res
    .status(200)
    .json(
        new ApiResponse(200, channelStats, "Channel stats fetched successfully")
    )
})

const getChannelVideos = asyncHandler(async (req, res) => {
    
    const videos = await Video.aggregate([
        {
            $match: {
                owner: req.user?._id
            }
        },
        {
            $project: {
                _id: 1,
                videoFile: 1,
                thumbnail: 1,
                title: 1,
                description: 1,
                duration: 1,
                views: 1,
                isPublished: 1,
                owner: 1,
                createdAt: 1,
                updatedAt: 1
            }
        }
    ])

    return res
    .status(200)
    .json(
        new ApiResponse(200, videos, "Videos fetched successfully")
    )
})

export {
    getChannelStats, 
    getChannelVideos
    }