import mongoose, {isValidObjectId} from "mongoose"
import {Video} from "../models/video.model.js"
import {User} from "../models/user.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"
import {uploadOnCloudinary} from "../utils/cloudinary.js"
import ffmpeg from "fluent-ffmpeg";

const getAllVideos = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10, query, sortBy = 'createdAt', sortType = 'desc', userId } = req.query;

    // Build the filter object
    let filter = {};
    if (query) {
        filter.title = { $regex: query, $options: 'i' }; // Case-insensitive search
    }
    if (userId && isValidObjectId(userId)) {
        filter.user = userId;
    }

    // Calculate pagination
    const skip = (page - 1) * limit;

    // Build the sort object
    let sort = {};
    sort[sortBy] = sortType === 'asc' ? 1 : -1;

    console.log("Filter:", filter);
    console.log("Sort:", sort);
    console.log("Pagination - Page:", page, "Limit:", limit, "Skip:", skip);

    // Fetch videos from the database
    const videos = await Video.find(filter)
        .sort(sort)
        .skip(skip)
        .limit(parseInt(limit))
        .exec();

    // Get total count for pagination
    const totalVideos = await Video.countDocuments(filter);
    console.log("Total Videos", totalVideos);

    // Send response

    return res
    .status(200)
    .json(new ApiResponse(200,{ videos, totalVideos, page, limit }, "Videos fetched successfully"));
    //new ApiResponse(200, 'Videos fetched successfully', { videos, totalVideos, page, limit })

});



const publishAVideo = asyncHandler(async (req, res) => {
    const { title, description } = req.body;
    const { file } = req;

    if(!description)
    {
        throw new ApiError(400, "Description is required")  
    }
    console.log("description:", description);
    console.log("Title:", title);
   
    if (!title) {
        throw new ApiError(400, "Title is required");
    }
    if (!file) {
        throw new ApiError(400, "No video file uploaded");
    }

    // Upload video to Cloudinary
    const uploadResult = await uploadOnCloudinary(file.path, "video");

    if (!uploadResult) {
        throw new ApiError(400, "Error while uploading video");
    }
console.log("Upload Result:", uploadResult);


const videoDuration = await new Promise((resolve, reject) => {
    ffmpeg.ffprobe(file.path, (err, metadata) => {
        if (err) {
            console.error("FFmpeg Error:", err.message); // Log the error message
            return reject(new ApiError(500, "Error calculating video duration"));
        }
        const durationInSeconds = Math.floor(metadata.format.duration); // Duration in seconds
        resolve(durationInSeconds);
    });
});

    // Create a new video document in the database
    const video = await Video.create({
        title,
        description,
        videoFile: uploadResult.url,
        thumbnail: uploadResult.url, // Replace with actual thumbnail URL if different
        duration: videoDuration,
        owner: req.user._id,
    });
    console.log("Video:", video);
    return res.status(201).json(new ApiResponse(201, video, "Video published successfully"));
});


const getVideoById = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    //TODO: get video by id
})

const updateVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    //TODO: update video details like title, description, thumbnail

})

const deleteVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    //TODO: delete video
})

const togglePublishStatus = asyncHandler(async (req, res) => {
    const { videoId } = req.params
})

export {
    getAllVideos,
    publishAVideo,
    getVideoById,
    updateVideo,
    deleteVideo,
    togglePublishStatus
}