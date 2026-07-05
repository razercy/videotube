import mongoose, {isValidObjectId} from "mongoose"
import {Playlist} from "../models/playlist.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"
import { User } from "../models/user.model.js"
import { Video } from "../models/video.model.js"


const createPlaylist = asyncHandler(async (req, res) => {
    const {name, description} = req.body

    const user = await User.findById(req.user?._id)

    const playlist = await Playlist.create({
        name,
        description,
        videos: [],
        owner: user
    })

    return res
    .status(200)
    .json(
        new ApiResponse(200, playlist, "Playlist created successfully")
    )
})

const getUserPlaylists = asyncHandler(async (req, res) => {
    const {userId} = req.params

    const user = await User.findById(userId)
    
    const userPlaylists = await Playlist.aggregate([
        {
            $match: {
                owner: user
            }
        }
    ])
    
    return res
    .status(200)
    .json(
        new ApiResponse(200, userPlaylists, "User playlists fetched successfully")
    )
    
})

const getPlaylistById = asyncHandler(async (req, res) => {
    const {playlistId} = req.params
    
    const playlist = await Playlist.findById(playlistId)

    return res
    .status(200)
    .json(
        new ApiResponse(200, playlist, "Playlist fetched successfully")
    )
})

const addVideoToPlaylist = asyncHandler(async (req, res) => {
    const {playlistId, videoId} = req.params
    const video = await Video.findById(videoId)

    const playlist = await Playlist.findByIdAndUpdate(
        playlistId,
        {
            $push: { videos: video }
        },
        {new: true}
    )

    return res
    .status(200)
    .json(
        new ApiResponse(200, playlist, "Video added successfully")
    )
})

const removeVideoFromPlaylist = asyncHandler(async (req, res) => {
    const {playlistId, videoId} = req.params

    const video = await Video.findById(videoId)
    
    const playlist = await Playlist.findByIdAndUpdate(
        playlistId,
        {
            $pull: { videos: video }
        },
        {new: true}
    )

    return res
    .status(200)
    .json(
        new ApiResponse(200, playlist, "Video removed successfully")
    )
})

const deletePlaylist = asyncHandler(async (req, res) => {
    const {playlistId} = req.params
    
    const playlist = await Playlist.findByIdAndDelete(playlistId)

    return res
    .status(200)
    .json(
        new ApiResponse(200, playlist, "Playlist deleted successfully")
    )
})

const updatePlaylist = asyncHandler(async (req, res) => {
    const {playlistId} = req.params
    const {name, description} = req.body
    
    const playlist = await Playlist.findByIdAndUpdate(
        playlistId,
        {
            $set: {
                name,
                description
            }
        },
        {new: true}
    )

    return res
    .status(200)
    .json(
        new ApiResponse(200, playlist, "Playlist updated successfully")
    )
})

export {
    createPlaylist,
    getUserPlaylists,
    getPlaylistById,
    addVideoToPlaylist,
    removeVideoFromPlaylist,
    deletePlaylist,
    updatePlaylist
}