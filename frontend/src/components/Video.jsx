import axios from 'axios';
import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { useParams } from 'react-router-dom';
import { timeAgo } from '../helpers/timeAgo.js';
import { formatDuration } from '../helpers/formatDuration.js';

const AUTH_REQUEST_CONFIG = { withCredentials: true };

const getResponseData = (response) => response?.data?.data;

const playlistContainsVideo = (playlist, videoId) => {
  if (!playlist?.videos || !videoId) return false;
  return playlist.videos.some((videoRef) => {
    if (!videoRef) return false;
    if (typeof videoRef === 'string') return videoRef === videoId;
    return videoRef?._id === videoId;
  });
};

function Video() {
  const { videoId: routeVideoId } = useParams();
  const authUserData = useSelector((state) => state.auth.userData);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [video, setVideo] = useState(null);
  const [channel, setChannel] = useState(null);
  const [comments, setComments] = useState([]);
  const [commentOwners, setCommentOwners] = useState({});
  const [videos, setVideos] = useState([]);

  const [playlists, setPlaylists] = useState([]);
  const [savedPlaylists, setSavedPlaylists] = useState([]);
  const [name, setName] = useState('');
  const [content, setContent] = useState('');

  const [isLiked, setIsLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [subscriberCount, setSubscriberCount] = useState(0);

  const resolvedVideoId = routeVideoId || decodeURIComponent(window.location.pathname.split('/')[2] || '');

  const refreshLikeState = async (videoId, signal) => {
    try {
      const isLikedResponse = await axios.get(`/api/v1/likes/v/${encodeURIComponent(videoId)}`, {
        ...AUTH_REQUEST_CONFIG,
        signal,
      });

      let likeCountResponse;
      try {
        likeCountResponse = await axios.get(`/api/v1/likes/count/u/v/${encodeURIComponent(videoId)}`, {
          ...AUTH_REQUEST_CONFIG,
          signal,
        });
      } catch {
        likeCountResponse = await axios.get(`/api/v1/likes/count/v/${encodeURIComponent(videoId)}`, { signal });
      }

      setIsLiked(Boolean(getResponseData(isLikedResponse)));
      setLikeCount(Number(getResponseData(likeCountResponse) || 0));
    } catch {
      setIsLiked(false);
      try {
        const publicLikeCountResponse = await axios.get(`/api/v1/likes/count/v/${encodeURIComponent(videoId)}`, { signal });
        setLikeCount(Number(getResponseData(publicLikeCountResponse) || 0));
      } catch {
        setLikeCount(0);
      }
    }
  };

  const refreshSubscriptionState = async (channelId, signal) => {
    try {
      const [isSubscribedResponse, subscriberCountResponse] = await Promise.all([
        axios.get(`/api/v1/subscriptions/${encodeURIComponent(channelId)}`, { ...AUTH_REQUEST_CONFIG, signal }),
        axios.get(`/api/v1/subscriptions/count/${encodeURIComponent(channelId)}`, { signal }),
      ]);

      setIsSubscribed(Boolean(getResponseData(isSubscribedResponse)));
      setSubscriberCount(Number(getResponseData(subscriberCountResponse) || 0));
    } catch {
      setIsSubscribed(false);
      setSubscriberCount(0);
    }
  };

  useEffect(() => {
    if (!resolvedVideoId) {
      setError('Invalid video id');
      setLoading(false);
      return;
    }

    let isCancelled = false;
    const controller = new AbortController();

    const loadVideoPage = async () => {
      setLoading(true);
      setError('');

      try {
        const videoResponse = await axios.get(`/api/v1/videos/${encodeURIComponent(resolvedVideoId)}`, {
          signal: controller.signal,
        });
        const videoData = getResponseData(videoResponse);

        if (!videoData) {
          throw new Error('Video not found');
        }

        if (isCancelled) return;
        setVideo(videoData);

        const channelResponse = await axios.get(`/api/v1/users/${encodeURIComponent(videoData.owner)}`, {
          signal: controller.signal,
        });
        const channelData = getResponseData(channelResponse);

        if (isCancelled) return;
        setChannel(channelData || null);

        const [commentsResult, playlistsResult, historyResult] = await Promise.all([
          axios
            .get(`/api/v1/comments/${encodeURIComponent(videoData._id)}`, {
              ...AUTH_REQUEST_CONFIG,
              params: { page: 1, limit: 10 },
              signal: controller.signal,
            })
            .catch(() => null),
          authUserData?._id
            ? axios
                .get(`/api/v1/playlist/user/${encodeURIComponent(authUserData._id)}`, {
                  ...AUTH_REQUEST_CONFIG,
                  signal: controller.signal,
                })
                .catch(() => null)
            : Promise.resolve(null),
          axios.get('/api/v1/users/history', { ...AUTH_REQUEST_CONFIG, signal: controller.signal }).catch(() => null),
        ]);

        if (isCancelled) return;

        const commentsData = Array.isArray(getResponseData(commentsResult)) ? getResponseData(commentsResult) : [];
        const playlistsData = Array.isArray(getResponseData(playlistsResult)) ? getResponseData(playlistsResult) : [];
        const historyData = Array.isArray(getResponseData(historyResult)) ? getResponseData(historyResult) : [];

        setComments(commentsData);
        setPlaylists(playlistsData);
        setSavedPlaylists(playlistsData.filter((playlist) => playlistContainsVideo(playlist, videoData._id)).map((playlist) => playlist._id));
        setVideos(
          historyData.filter(
            (sideVideo) => sideVideo?._id !== videoData._id && sideVideo?.owner?._id === channelData?._id,
          ),
        );

        const commentOwnerIds = [...new Set(commentsData.map((comment) => comment?.owner).filter(Boolean))];

        if (commentOwnerIds.length > 0) {
          const ownerEntries = await Promise.all(
            commentOwnerIds.map(async (ownerId) => {
              try {
                const ownerResponse = await axios.get(`/api/v1/users/${encodeURIComponent(ownerId)}`, {
                  signal: controller.signal,
                });
                return [ownerId, getResponseData(ownerResponse) || null];
              } catch {
                return [ownerId, null];
              }
            }),
          );

          if (!isCancelled) {
            setCommentOwners(Object.fromEntries(ownerEntries));
          }
        } else {
          setCommentOwners({});
        }

        await Promise.all([
          refreshLikeState(videoData._id, controller.signal),
          channelData?._id ? refreshSubscriptionState(channelData._id, controller.signal) : Promise.resolve(),
        ]);
      } catch (requestError) {
        if (!isCancelled) {
          setError(requestError?.response?.data?.message || requestError?.message || 'Failed to load video');
        }
      } finally {
        if (!isCancelled) {
          setLoading(false);
        }
      }
    };

    loadVideoPage();

    return () => {
      isCancelled = true;
      controller.abort();
    };
  }, [resolvedVideoId, authUserData?._id]);

  const handleToggleLike = async () => {
    if (!video?._id) return;
    try {
      await axios.post(`/api/v1/likes/toggle/v/${encodeURIComponent(video._id)}`, {}, AUTH_REQUEST_CONFIG);
      await refreshLikeState(video._id);
    } catch (requestError) {
      setError(requestError?.response?.data?.message || 'Failed to update like');
    }
  };

  const handleToggleSubscription = async () => {
    if (!channel?._id) return;
    try {
      await axios.post(`/api/v1/subscriptions/c/${encodeURIComponent(channel._id)}`, {}, AUTH_REQUEST_CONFIG);
      await refreshSubscriptionState(channel._id);
    } catch (requestError) {
      setError(requestError?.response?.data?.message || 'Failed to update subscription');
    }
  };

  const handleTogglePlaylistVideo = async (playlist) => {
    if (!playlist?._id || !video?._id) return;

    const isAlreadySaved = savedPlaylists.includes(playlist._id);
    const endpoint = isAlreadySaved
      ? `/api/v1/playlist/remove/${encodeURIComponent(video._id)}/${encodeURIComponent(playlist._id)}`
      : `/api/v1/playlist/add/${encodeURIComponent(video._id)}/${encodeURIComponent(playlist._id)}`;

    try {
      await axios.patch(endpoint, {}, AUTH_REQUEST_CONFIG);
      setSavedPlaylists((prev) => {
        if (isAlreadySaved) {
          return prev.filter((id) => id !== playlist._id);
        }
        return [...prev, playlist._id];
      });
    } catch (requestError) {
      setError(requestError?.response?.data?.message || 'Failed to update playlist');
    }
  };

  const handleCreatePlaylist = async () => {
    const trimmedName = name.trim();
    if (!trimmedName) return;

    try {
      const playlistResponse = await axios.post(
        '/api/v1/playlist',
        {
          name: trimmedName,
          description: '',
        },
        AUTH_REQUEST_CONFIG,
      );

      const createdPlaylist = getResponseData(playlistResponse);
      if (createdPlaylist) {
        setPlaylists((prev) => [...prev, createdPlaylist]);
      }
      setName('');
    } catch (requestError) {
      setError(requestError?.response?.data?.message || 'Failed to create playlist');
    }
  };

  const handleCommentSubmit = async (event) => {
    if (event.key !== 'Enter') return;

    const trimmedContent = content.trim();
    if (!trimmedContent || !video?._id) return;

    try {
      const commentResponse = await axios.post(
        `/api/v1/comments/${encodeURIComponent(video._id)}`,
        { content: trimmedContent },
        AUTH_REQUEST_CONFIG,
      );
      const createdComment = getResponseData(commentResponse);

      if (createdComment) {
        setComments((prev) => [createdComment, ...prev]);
        if (authUserData?._id) {
          setCommentOwners((prev) => ({
            ...prev,
            [authUserData._id]: {
              _id: authUserData._id,
              fullName: authUserData.fullName,
              username: authUserData.username,
              avatar: authUserData.avatar,
            },
          }));
        }
      }

      setContent('');
    } catch (requestError) {
      setError(requestError?.response?.data?.message || 'Failed to add comment');
    }
  };

  if (loading) {
    return <h1>Loading...</h1>;
  }

  if (error && !video) {
    return <h1>{error}</h1>;
  }

  return (
    <div className="h-screen overflow-y-auto bg-[#121212] text-white">
      <div className="flex min-h-[calc(100vh-66px)] sm:min-h-[calc(100vh-82px)]">
        <section className="w-full pb-17.5 sm:ml-17.5 sm:pb-0">
          <div className="flex w-full flex-wrap gap-4 p-4 lg:flex-nowrap">
            <div className="col-span-12 w-full">
              <div className="relative mb-4 w-full pt-[56%]">
                <div className="absolute inset-0">
                  <video className="h-full w-full" controls="" autoPlay="" muted="">
                    <source src={video?.videoFile || ''} type="video/mp4" />
                  </video>
                </div>
              </div>
              <div
                className="group mb-4 w-full rounded-lg border p-4 duration-200 hover:bg-white/5 focus:bg-white/5"
                role="button"
                tabIndex="0">
                <div className="flex flex-wrap gap-y-2">
                  <div className="w-full md:w-1/2 lg:w-full xl:w-1/2">
                    <h1 className="text-lg font-bold">{video?.title || ''}</h1>
                    <p className="flex text-sm text-gray-200">
                      {video?.views || 0} Views {video?.createdAt ? `· ${timeAgo(video.createdAt)}` : ''}
                    </p>
                  </div>
                  <div className="w-full md:w-1/2 lg:w-full xl:w-1/2">
                    <div className="flex items-center justify-between gap-x-4 md:justify-end lg:justify-between xl:justify-end">
                      <div className="flex overflow-hidden rounded-lg border">
                        <button
                          onClick={handleToggleLike}
                          className={`flex items-center gap-x-2 border-r border-gray-700 px-4 py-1.5 hover:bg-white/10 ${
                            isLiked ? 'text-[#ae7aff]' : ''
                          }`}>
                          <span className="inline-block w-5">
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              fill={isLiked ? 'currentColor' : 'none'}
                              viewBox="0 0 24 24"
                              strokeWidth="1.5"
                              stroke="currentColor"
                              aria-hidden="true">
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M6.633 10.5c.806 0 1.533-.446 2.031-1.08a9.041 9.041 0 012.861-2.4c.723-.384 1.35-.956 1.653-1.715a4.498 4.498 0 00.322-1.672V3a.75.75 0 01.75-.75A2.25 2.25 0 0116.5 4.5c0 1.152-.26 2.243-.723 3.218-.266.558.107 1.282.725 1.282h3.126c1.026 0 1.945.694 2.054 1.715.045.422.068.85.068 1.285a11.95 11.95 0 01-2.649 7.521c-.388.482-.987.729-1.605.729H13.48c-.483 0-.964-.078-1.423-.23l-3.114-1.04a4.501 4.501 0 00-1.423-.23H5.904M14.25 9h2.25M5.904 18.75c.083.205.173.405.27.602.197.4-.078.898-.523.898h-.908c-.889 0-1.713-.518-1.972-1.368a12 12 0 01-.521-3.507c0-1.553.295-3.036.831-4.398C3.387 10.203 4.167 9.75 5 9.75h1.053c.472 0 .745.556.5.96a8.958 8.958 0 00-1.302 4.665c0 1.194.232 2.333.654 3.375z"></path>
                            </svg>
                          </span>
                          <span>{likeCount}</span>
                        </button>
                      </div>
                      <div className="relative block">
                        <button className="peer flex items-center gap-x-2 rounded-lg bg-white px-4 py-1.5 text-black">
                          <span className="inline-block w-5">
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              fill="none"
                              viewBox="0 0 24 24"
                              strokeWidth="1.5"
                              stroke="currentColor"
                              aria-hidden="true">
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M12 10.5v6m3-3H9m4.06-7.19l-2.12-2.12a1.5 1.5 0 00-1.061-.44H4.5A2.25 2.25 0 002.25 6v12a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9a2.25 2.25 0 00-2.25-2.25h-5.379a1.5 1.5 0 01-1.06-.44z"></path>
                            </svg>
                          </span>
                          Save
                        </button>
                        <div className="absolute right-0 top-full z-10 hidden w-64 overflow-hidden rounded-lg bg-[#121212] p-4 shadow shadow-slate-50/30 hover:block peer-focus:block">
                          <h3 className="mb-4 text-center text-lg font-semibold">Save to playlist</h3>
                          <ul className="mb-4">
                            {playlists.map((playlist) => (
                              <li key={playlist._id} className="mb-2 last:mb-0">
                                <label className="group/label inline-flex cursor-pointer items-center gap-x-3" htmlFor={`${playlist.name}-checkbox`}>
                                  <input
                                    type="checkbox"
                                    onChange={() => handleTogglePlaylistVideo(playlist)}
                                    checked={savedPlaylists.includes(playlist._id)}
                                    className="peer hidden"
                                    id={`${playlist.name}-checkbox`} />
                                  <span className="inline-flex h-4 w-4 items-center justify-center rounded-sm border border-transparent bg-white text-white group-hover/label:border-[#ae7aff] peer-checked:border-[#ae7aff] peer-checked:text-[#ae7aff]">
                                    <svg
                                      xmlns="http://www.w3.org/2000/svg"
                                      fill="none"
                                      viewBox="0 0 24 24"
                                      strokeWidth="3"
                                      stroke="currentColor"
                                      aria-hidden="true">
                                      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5"></path>
                                    </svg>
                                  </span>
                                  {playlist.name}
                                </label>
                              </li>
                            ))}
                          </ul>
                          <div className="flex flex-col">
                            <label htmlFor="playlist-name" className="mb-1 inline-block cursor-pointer">
                              Name
                            </label>
                            <input
                              onChange={(event) => setName(event.target.value)}
                              value={name}
                              className="w-full rounded-lg border border-transparent bg-white px-3 py-2 text-black outline-none focus:border-[#ae7aff]"
                              id="playlist-name"
                              placeholder="Enter playlist name" />
                            <button
                              onClick={handleCreatePlaylist}
                              className="mx-auto mt-4 rounded-lg bg-[#ae7aff] px-4 py-2 text-black">
                              Create new playlist
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="mt-4 flex items-center justify-between">
                  <div className="flex items-center gap-x-4">
                    <div className="mt-2 h-12 w-12 shrink-0">
                      <img src={channel?.avatar || ''} alt={channel?.username || 'channel avatar'} className="h-full w-full rounded-full" />
                    </div>
                    <div className="block">
                      <p className="text-gray-200">{channel?.fullName || ''}</p>
                      <p className="text-sm text-gray-400">{subscriberCount} Subscribers</p>
                    </div>
                  </div>
                  <div className="block">
                    <button
                      onClick={handleToggleSubscription}
                      className="mr-1 flex w-full items-center gap-x-2 bg-[#ae7aff] px-3 py-2 text-center font-bold text-black shadow-[5px_5px_0px_0px_#4f4e4e] transition-all duration-150 ease-in-out active:translate-x-1.25 active:translate-y-1.25 active:shadow-[0px_0px_0px_0px_#4f4e4e] sm:w-auto">
                      <span className="inline-block w-5">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                          strokeWidth="2"
                          stroke="currentColor"
                          aria-hidden="true">
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M19 7.5v3m0 0v3m0-3h3m-3 0h-3m-2.25-4.125a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zM4 19.235v-.11a6.375 6.375 0 0112.75 0v.109A12.318 12.318 0 0110.374 21c-2.331 0-4.512-.645-6.374-1.766z"></path>
                        </svg>
                      </span>
                      <span className="group-focus/btn:hidden">{isSubscribed ? 'Subscribed' : 'Subscribe'}</span>
                    </button>
                  </div>
                </div>
                <hr className="my-4 border-white" />
                <div className="h-5 overflow-hidden group-focus:h-auto">
                  <p className="text-sm">{video?.description || ''}</p>
                </div>
              </div>
              <button className="peer w-full rounded-lg border p-4 text-left duration-200 hover:bg-white/5 focus:bg-white/5 sm:hidden">
                <h6 className="font-semibold">{comments.length} Comments...</h6>
              </button>
              <div className="fixed inset-x-0 top-full z-60 h-[calc(100%-69px)] overflow-auto rounded-lg border bg-[#121212] p-4 duration-200 hover:top-16.75 peer-focus:top-16.75 sm:static sm:h-auto sm:max-h-125 lg:max-h-none">
                <div className="block">
                  <h6 className="mb-4 font-semibold">{comments.length} Comments</h6>
                  <input
                    type="text"
                    value={content}
                    onChange={(event) => setContent(event.target.value)}
                    onKeyDown={handleCommentSubmit}
                    className="w-full rounded-lg border bg-transparent px-2 py-1 placeholder-white"
                    placeholder="Add a Comment" />
                </div>
                <hr className="my-4 border-white" />
                {comments.map((comment) => {
                  const commenter = commentOwners[comment.owner] || null;
                  return (
                    <div key={comment._id || `${comment.owner}-${comment.createdAt}`}>
                      <div className="flex gap-x-4">
                        <div className="mt-2 h-11 w-11 shrink-0">
                          <img
                            src={commenter?.avatar || ''}
                            alt={commenter?.username || 'comment user avatar'}
                            className="h-full w-full rounded-full" />
                        </div>
                        <div className="block">
                          <p className="flex items-center text-gray-200">
                            {commenter?.fullName || 'Unknown user'}
                            <span className="ml-1 text-sm">{comment?.createdAt ? `· ${timeAgo(comment.createdAt)}` : ''}</span>
                          </p>
                          <p className="text-sm text-gray-200">@{commenter?.username || 'unknown'}</p>
                          <p className="mt-3 text-sm">{comment?.content || ''}</p>
                        </div>
                      </div>
                      <hr className="my-4 border-white" />
                    </div>
                  );
                })}
              </div>
            </div>
            <div className="col-span-12 flex w-full shrink-0 flex-col gap-3 lg:w-87.5 xl:w-100">
              {videos.map((sideVideo) => (
                <div key={sideVideo._id} className="w-full gap-x-2 border pr-2 md:flex">
                  <div className="relative mb-2 w-full md:mb-0 md:w-5/12">
                    <div className="w-full pt-[56%]">
                      <div className="absolute inset-0">
                        <img src={sideVideo?.thumbnail || ''} alt={sideVideo?.title || 'video thumbnail'} className="h-full w-full" />
                      </div>
                      <span className="absolute bottom-1 right-1 inline-block rounded bg-black px-1.5 text-sm">
                        {formatDuration(sideVideo?.duration || 0)}
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-x-2 px-2 pb-4 pt-1 md:w-7/12 md:px-0 md:py-0.5">
                    <div className="h-12 w-12 shrink-0 md:hidden">
                      <img
                        src={sideVideo?.owner?.avatar || ''}
                        alt={sideVideo?.owner?.username || 'publisher avatar'}
                        className="h-full w-full rounded-full" />
                    </div>
                    <div className="w-full pt-1 md:pt-0">
                      <h6 className="mb-1 text-sm font-semibold">{sideVideo?.title || ''}</h6>
                      <p className="mb-0.5 mt-2 text-sm text-gray-200">{sideVideo?.owner?.fullName || ''}</p>
                      <p className="flex text-sm text-gray-200">
                        {sideVideo?.views || 0} Views {sideVideo?.createdAt ? `· ${timeAgo(sideVideo.createdAt)}` : ''}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          {error ? <p className="px-4 pb-4 text-sm text-red-400">{error}</p> : null}
        </section>
      </div>
    </div>
  );
}

export default Video;