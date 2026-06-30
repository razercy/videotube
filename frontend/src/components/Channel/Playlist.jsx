import axios from 'axios';
import React from 'react'
import { useNavigate } from 'react-router-dom';

function Playlist() {
  const navigate = useNavigate()

  const playlists = (async() => {
    try {
      const user = await axios.get(
        "/api/v1/users/current-user",
        {
          user: window.location.split
        }
      );
      const userPlaylists = await axios.get(
        `/api/v1/users/c/${encodeURIComponent(user._id)}`,
        {
          params: {
            userId: user
          }
        }
      );
      for (let index = 0; index < userPlaylists.length; index++) {
        const element = userPlaylists[index];
        // const firstVideo = element.videos[0];
        const thumbnailUrl = "https://static.thenounproject.com/png/375319-200.png";
        element.thumbnail = thumbnailUrl;
      }
      return userPlaylists;
    } catch (error) {
      return [
        // {
        //   thumbnail: "https://images.pexels.com/photos/3561339/pexels-photo-3561339.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1",
        //   videos: { length: 12 },
        //   name: "React Mastery",
        //   description: "Master the art of building dynamic user interfaces with React."
        // },
        // {
        //   thumbnail: "https://images.pexels.com/photos/2519817/pexels-photo-2519817.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1",
        //   videos: { length: 1 },
        //   name: "JavaScript Fundamentals",
        //   description: "Learn the core concepts and fundamentals of JavaScript programming language."
        // },
        // {
        //   thumbnail: "https://images.pexels.com/photos/1739849/pexels-photo-1739849.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1",
        //   videos: { length: 2 },
        //   name: "TypeScript Essentials",
        //   description: "Dive into TypeScript for enhanced type safety and scalable JavaScript applications."
        // },
        // {
        //   thumbnail: "https://images.pexels.com/photos/1144256/pexels-photo-1144256.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1",
        //   videos: { length: 1 },
        //   name: "React State Management",
        //   description: "Explore various state management techniques in React applications."
        // },
        // {
        //   thumbnail: "https://images.pexels.com/photos/1144260/pexels-photo-1144260.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1",
        //   videos: { length: 2 },
        //   name: "Advanced JavaScript Techniques",
        //   description: "Delve into advanced JavaScript concepts and techniques for professional-level programming."
        // }
      ]
    }
  })()

  return (
    <div className="h-screen overflow-y-auto bg-[#121212] text-white">
      <div className="flex min-h-[calc(100vh-66px)] sm:min-h-[calc(100vh-82px)]">
        <section className="w-full pb-17.5 sm:ml-17.5 sm:pb-0 lg:ml-0">
          <div className="px-4 pb-4">
            {
              playlists.length > 0 ? (
                <div className="grid gap-4 pt-2 sm:grid-cols-[repeat(auto-fit,minmax(400px,1fr))]">
                  {
                    playlists.map((playlist) => (
                      <div
                      onClick={() => navigate(`/playlist/${encodeURIComponent(playlist._id)}`)}
                      className="w-full">
                        <div className="relative mb-2 w-full pt-[56%]">
                          <div className="absolute inset-0">
                            <img
                              src={playlist.thumbnail}
                              alt="React Mastery"
                              className="h-full w-full" />
                            <div className="absolute inset-x-0 bottom-0">
                              <div className="relative border-t bg-white/30 p-4 text-white backdrop-blur-sm before:absolute before:inset-0 before:bg-black/40">
                                <div className="relative z-1">
                                  <p className="flex justify-between">
                                    <span className="inline-block">Playlist</span>
                                    <span className="inline-block">{playlist.videos.length} videos</span>
                                  </p>
                                  {/* <p className="text-sm text-gray-200">100K Views · 2 hours ago</p> */}
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                        <h6 className="mb-1 font-semibold">{playlist.name}</h6>
                        <p className="flex text-sm text-gray-200">{playlist.description}</p>
                      </div>
                    ))
                  }
                </div>
              )
              : (
                <div className="flex justify-center p-4">
                  <div className="w-full max-w-sm text-center">
                    <p className="mb-3 w-full">
                      <span className="inline-flex rounded-full bg-[#E4D3FF] p-2 text-[#AE7AFF]">
                        <span className="inline-block w-6">
                          <svg
                            style="width:100%"
                            viewBox="0 0 22 20"
                            fill="none"
                            xmlns="http://www.w3.org/2000/svg">
                            <path
                              d="M12 5L10.8845 2.76892C10.5634 2.1268 10.4029 1.80573 10.1634 1.57116C9.95158 1.36373 9.69632 1.20597 9.41607 1.10931C9.09916 1 8.74021 1 8.02229 1H4.2C3.0799 1 2.51984 1 2.09202 1.21799C1.71569 1.40973 1.40973 1.71569 1.21799 2.09202C1 2.51984 1 3.0799 1 4.2V5M1 5H16.2C17.8802 5 18.7202 5 19.362 5.32698C19.9265 5.6146 20.3854 6.07354 20.673 6.63803C21 7.27976 21 8.11984 21 9.8V14.2C21 15.8802 21 16.7202 20.673 17.362C20.3854 17.9265 19.9265 18.3854 19.362 18.673C18.7202 19 17.8802 19 16.2 19H5.8C4.11984 19 3.27976 19 2.63803 18.673C2.07354 18.3854 1.6146 17.9265 1.32698 17.362C1 16.7202 1 15.8802 1 14.2V5Z"
                              stroke="currentColor"
                              stroke-width="2"
                              stroke-linecap="round"
                              stroke-linejoin="round"></path>
                          </svg>
                        </span>
                      </span>
                    </p>
                    <h5 className="mb-2 font-semibold">No playlist created</h5>
                    <p>There are no playlists created on this channel.</p>
                  </div>
                </div>
              )
            }
          </div>
        </section>
      </div>
    </div>
  )
}

export default Playlist