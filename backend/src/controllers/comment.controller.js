import mongoose from "mongoose"
import {Comment} from "../models/comment.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"

const getVideoComments = asyncHandler(async (req, res) => {
    
    const {videoId} = req.params
    const {page = 1, limit = 10} = req.query

    const videoComments = await Comment.aggregate([
        {
            $match: {
                video: videoId
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
        new ApiResponse(200, videoComments, "Video comments fetched successfully")
    )
})

const addComment = asyncHandler(async (req, res) => {
    const { content } = req.body

    const comment = await Comment.create({
        content,
        video: req.video?._id,
        owner: req.user?._id
    })

    return res
    .status(200)
    .json(
        new ApiResponse(200, comment, "Comment added successfully")
    )
})

const updateComment = asyncHandler(async (req, res) => {
    const { commentId } = req.params

    const { content } = req.body

    const comment = await Comment.findByIdAndUpdate(
        commentId,
        {
            $set: { content }
        },
        {new: true}
    )

    return res
    .status(200)
    .json(
        new ApiResponse(200, comment, "Comment updated successfully")
    )
})

const deleteComment = asyncHandler(async (req, res) => {
    const { commentId } = req.params
    
    const comment = await Comment.findByIdAndDelete(commentId)

    return res
    .status(200)
    .json(
        new ApiResponse(200, comment, "Comment deleted successfully")
    )
})

export {
    getVideoComments, 
    addComment, 
    updateComment,
     deleteComment
    }