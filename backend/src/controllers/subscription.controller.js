import mongoose, {isValidObjectId} from "mongoose"
import {User} from "../models/user.model.js"
import { Subscription } from "../models/subscription.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"


const toggleSubscription = asyncHandler(async (req, res) => {
    const {channelId} = req.params
    
    const existedSubscription = await Subscription.findOne({
        $and: [{ channel: channelId }, { subscriber: req.user?._id }]
    })

    if(existedSubscription) {
        const removedSubscription = await Subscription.findByIdAndDelete(existedSubscription._id)
    
        return res
        .status(200)
        .json(
            new ApiResponse(200, removedSubscription, "Channel unsubscribed successfully")
        )
    }
    else {
        const createdSubscription = await Subscription.create({
            subscriber: req.user?._id,
            channel: channelId
        })
    
        return res
        .status(200)
        .json(
            new ApiResponse(200, createdSubscription, "Channel subscribed successfully")
        )
    }
})

// controller to return subscriber list of a channel
const getUserChannelSubscribers = asyncHandler(async (req, res) => {
    const {channelId} = req.params
    const embeddedUserChannelSubscribers = await Subscription.aggregate([
        {
            $match: {
                channel: channelId,
                subscriber: {
                    $ne: null,
                    $exists: true
                }
            },
        },
        {
            $lookup: {
                from: "users",
                localField: "subscriber",
                foreignField: "_id",
                as: "channelSubscribers"
            }
        },
        {
            $unwind: "$channelSubscribers"
        },
        {
            $project: {
                channelSubscribers: 1
            }
        }
    ])

    const userChannelSubscribers = embeddedUserChannelSubscribers((element) => element.channelSubscribers)

    return res
    .status(200)
    .json(
        new ApiResponse(200, userChannelSubscribers, "User channel subscribers fetched successfully")
    )
})

// controller to return channel list to which user has subscribed
const getSubscribedChannels = asyncHandler(async (req, res) => {
    const { subscriberId } = req.params
    const embeddedSubscribedChannels = await Subscription.aggregate([
        {
            $match: {
                subscriber: subscriberId,
                channel: {
                    $ne: null,
                    $exists: true
                }
            },
        },
        {
            $lookup: {
                from: "users",
                localField: "channel",
                foreignField: "_id",
                as: "subscribeChannels"
            }
        },
        {
            $unwind: "$subscribeChannels"
        },
        {
            $project: {
                subscribeChannels: 1
            }
        }
    ])

    const subscribedChannels = embeddedSubscribedChannels((element) => element.subscribeChannels)

    return res
    .status(200)
    .json(
        new ApiResponse(200, subscribedChannels, "Subscribed channels fetched successfully")
    )
})

export {
    toggleSubscription,
    getUserChannelSubscribers,
    getSubscribedChannels
}