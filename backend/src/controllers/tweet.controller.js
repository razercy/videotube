import mongoose, { isValidObjectId } from "mongoose"
import {Tweet} from "../models/tweet.model.js"
import {User} from "../models/user.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"

const createTweet = asyncHandler(async (req, res) => {
    
    const { content } = req.body

    const user = await User.findById(req.user?._id)

    const tweet = await Tweet.create({
        content,
        owner: user
    })

    return res
    .status(200)
    .json(
        new ApiResponse(200, tweet, "Tweet created successfully")
    )
})

const getUserTweets = asyncHandler(async (req, res) => {

    const user = await User.findById(req.user?._id)
    
    const userTweets = await Tweet.aggregate([
        {
            $match: {
                owner: user
            }
        }
    ])
    
    return res
    .status(200)
    .json(
        new ApiResponse(200, userTweets, "User tweets fetched successfully")
    )
})

const updateTweet = asyncHandler(async (req, res) => {
    
    const { tweetId } = req.params
    const { content } = req.body
    
    const tweet = await Tweet.findByIdAndUpdate(
        tweetId,
        {
            $set: {
                content
            }
        },
        {new: true}
    )

    return res
    .status(200)
    .json(
        new ApiResponse(200, tweet, "Tweet updated successfully")
    )
})

const deleteTweet = asyncHandler(async (req, res) => {
    
    const { tweetId } = req.params
    
    const tweet = await Tweet.findByIdAndDelete(tweetId)

    return res
    .status(200)
    .json(
        new ApiResponse(200, tweet, "Tweet deleted successfully")
    )
})

export {
    createTweet,
    getUserTweets,
    updateTweet,
    deleteTweet
}