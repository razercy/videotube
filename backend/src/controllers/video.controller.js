import mongoose, {isValidObjectId} from "mongoose"
import {Video} from "../models/video.model.js"
import {User} from "../models/user.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"
import {uploadOnCloudinary} from "../utils/cloudinary.js"


const getAllVideos = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10, query, sortBy, sortType, userId } = req.query

    query = query.trim()

    let trimmedQuery;

    if (query === "") {
        trimmedQuery = ""
    } else {
        trimmedQuery = query[0];

        for (let index = 1; index < query.length; index++) {
            if (query[index] !== " " || query[index-1] !== " ") {
                trimmedQuery += query[index];
            }
            
        }
    }
    
    // const user = await User.findById(userId)

    const videos = trimmedQuery === "" ? [] : await Video.aggregate([
        {
            $match: {
                owner: userId,
                isPublished: true,
                $or: [
                    { title: { trimmedQuery, $options: "i" } },
                    { title: { $regex: " " + trimmedQuery, $options: "i" } },
                    { title: { $regex: trimmedQuery + " ", $options: "i" } },
                    { description: { trimmedQuery, $options: "i" } },
                    { description: { $regex: " " + trimmedQuery, $options: "i" } },
                    { description: { $regex: trimmedQuery + " ", $options: "i" } }
                ]
            }
        },
        {
            $sort: {
                sortBy: sortType
            }
        },
        {
            $skip: (page - 1) * limit
        },
        {
            $limit: limit
        }
    ])

    return res
    .status(200)
    .json(
        new ApiResponse(200, videos, "Videos fetched successfully")
    )
})

const publishAVideo = asyncHandler(async (req, res) => {
    const { title, description} = req.body

    if (!title) {
        throw new ApiError(400, "video title is required")
    }

    if (!description) {
        throw new ApiError(400, "video description is required")
    }

    const videoFileLocalPath = req.files?.videoFile[0]?.path

    if (!videoFileLocalPath) {
        throw new ApiError(400, "Video file is missing")
    }

    const videoFile = await uploadOnCloudinary(videoFileLocalPath)

    if (!videoFile.url) {
        throw new ApiError(400, "Error while uploading on video file")
    }

    const thumbnailLocalPath = req.files?.thumbnail[0]?.path

    if (!thumbnailLocalPath) {
        throw new ApiError(400, "Thumbnail file is missing")
    }

    const thumbnail = await uploadOnCloudinary(thumbnailLocalPath)

    if (!thumbnail.url) {
        throw new ApiError(400, "Error while uploading on thumbnail")
    }

    // const user = await User.findById(req.user?._id)

    const video = await Video.create({
        videoFile: videoFile.url,
        thumbnail: thumbnail.url,
        title,
        description,
        duration: videoFile.duration,
        owner: req.user?._id
    })

    return res
    .status(200)
    .json(
        new ApiResponse(200, video, "Video uploaded successfully")
    )
})

const watchVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params

    // const video = await Video.findById(videoId)
    
    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $push: { watchHistory: videoId }
        },
        {new: true}
    )

    const video = await Video.findByIdAndUpdate(
        videoId,
        {
            $inc: { views: 1 }
        },
        {new: true}
    )

    return res
    .status(200)
    .json(
        new ApiResponse(200, video, "Video opened successfully")
    )
})

const getVideoById = asyncHandler(async (req, res) => {
    const { videoId } = req.params

    const video = await Video.findById(videoId)

    return res
    .status(200)
    .json(
        new ApiResponse(200, video, "Video fetched successfully")
    )
})

const updateVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params

    // const {title, description} = req.body

    // if (!title) {
    //     throw new ApiError(400, "video title is required")
    // }

    // if (!description) {
    //     throw new ApiError(400, "video description is required")
    // }

    // const videoFileLocalPath = req.files?.videoFile[0]?.path

    // if (!videoFileLocalPath) {
    //     throw new ApiError(400, "Video file is missing")
    // }

    // const videoFile = await uploadOnCloudinary(videoFileLocalPath)

    // if (!videoFile.url) {
    //     throw new ApiError(400, "Error while uploading on video file")
    // }

    const thumbnailLocalPath = req.files?.thumbnail[0]?.path

    if (!thumbnailLocalPath) {
        throw new ApiError(400, "Thumbnail file is missing")
    }

    const thumbnail = await uploadOnCloudinary(thumbnailLocalPath)

    if (!thumbnail.url) {
        throw new ApiError(400, "Error while uploading on thumbnail")
    }

    const video = await Video.findByIdAndUpdate(
        videoId,
        {
            $set: {
                // videoFile: videoFile.url,
                thumbnail: thumbnail.url,
                // title,
                // description,
                // duration: videoFile.duration,
                // views: 0
            }
        },
        {new: true}
    )

    return res
    .status(200)
    .json(
        new ApiResponse(200, video, "Video updated successfully")
    )
})

const deleteVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    
    const video = await Video.findByIdAndDelete(videoId)

    return res
    .status(200)
    .json(
        new ApiResponse(200, video, "Video deleted successfully")
    )
})

const togglePublishStatus = asyncHandler(async (req, res) => {
    const { videoId } = req.params

    const video = await Video.findById(videoId)

    if(video.isPublished === true) {
        const unpublishedVideo = await Video.findByIdAndUpdate(
            videoId,
            {
                $set: { isPublished: false }
            },
            {new: true}
        )

        return res
        .status(200)
        .json(
            new ApiResponse(200, unpublishedVideo, "Video unpublished successfully")
        )
    }
    else {
        const publishedVideo = await Video.findByIdAndUpdate(
            videoId,
            {
                $set: { isPublished: true }
            },
            {new: true}
        )

        return res
        .status(200)
        .json(
            new ApiResponse(200, publishedVideo, "Video published successfully")
        )
    }
})

const getPublishedVideos = asyncHandler(async (req, res) => {
    const { userId } = req.params

    // const owner = await User.findById(userId)

    const videos = await Video.aggregate([
        {
            $match: {
                owner: userId,
                isPublished: true
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
    getAllVideos,
    publishAVideo,
    getVideoById,
    updateVideo,
    deleteVideo,
    togglePublishStatus,
    getPublishedVideos,
    watchVideo
}