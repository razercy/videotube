import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import CardViewListing from './pages/CardViewListing.jsx'
import ListViewListing from './pages/ListViewListing.jsx'
import { AuthLayout } from './components/index.js'
import Video from './pages/Video.jsx'
import Channel from './pages/Channel/Channel.jsx'
import ChannelVideos from './pages/Channel/Videos.jsx'
import ChannelPlaylist from './pages/Channel/Playlist.jsx'
import ChannelTweets from './pages/Channel/Tweets.jsx'
import ChannelSubscribed from './pages/Channel/Subscribed.jsx'
import Login from './pages/Login.jsx'
import Signup from './pages/Signup.jsx'
import MyChannel from './pages/MyChannel/MyChannel.jsx'
import MyChannelVideos from './pages/MyChannel/Videos.jsx'
import MyChannelPlaylist from './pages/MyChannel/Playlist.jsx'
import MyChannelTweets from './pages/MyChannel/Tweets.jsx'
import MyChannelSubscribed from './pages/MyChannel/Subscribed.jsx'
import EditInfo from './pages/EditInfo/EditInfo.jsx'
import PersonalInfo from './pages/EditInfo/PersonalInfo.jsx'
import ChannelInfo from './pages/EditInfo/ChannelInfo.jsx'
import ChgPassword from './pages/EditInfo/ChgPassword.jsx'
import Dashboard from './pages/Dashboard.jsx'
import PrivacyPolicy from './pages/PrivacyPolicy.jsx'
import TnC from './pages/TnC.jsx'
import { Provider } from 'react-redux'
import store from './store/store.js'
import Playlist from './pages/Playlist.jsx'
import LikedVideos from './pages/LikedVideos.jsx'
import WatchHistory from './pages/WatchHistory.jsx'
import Subscribers from './pages/Subscribers.jsx'

const router = createBrowserRouter([
  {
    path: "/",
    element: <App />,
    children: [
      {
        path: "/",
        element: <CardViewListing />
      },
      {
        path: "/results/:search_query",
        element: <ListViewListing />
      },
      {
        path: "/watch/:v",
        element: (
          <AuthLayout authentication>
            {" "}
            <Video />
          </AuthLayout>
        )
      },
      {
        path: "/:channel",
        element: <Channel />,
        children: [
          {
            path: "/videos",
            element: <ChannelVideos />
          },
          {
            path: "/playlist",
            element: <ChannelPlaylist />
          },
          {
            path: "/tweets",
            element: <ChannelTweets />
          },
          {
            path: "/subscribed",
            element: <ChannelSubscribed />
          }
        ]
      },
      {
        path: "/login",
        element: (
          <AuthLayout authentication={false}>
            <Login />
          </AuthLayout>
        )
      },
      {
        path: "/signup",
        element: (
          <AuthLayout authentication={false}>
            <Signup />
          </AuthLayout>
        )
      },
      {
        path: "/channel",
        element: (
          <AuthLayout authentication>
            {" "}
            <MyChannel />
          </AuthLayout>
        ),
        children: [
          {
            path: "/videos",
            element: (
              <AuthLayout authentication>
                {" "}
                <MyChannelVideos />
              </AuthLayout>
            )
          },
          {
            path: "/playlist",
            element: (
              <AuthLayout authentication>
                {" "}
                <MyChannelPlaylist />
              </AuthLayout>
            )
          },
          {
            path: "/tweets",
            element: (
              <AuthLayout authentication>
                {" "}
                <MyChannelTweets />
              </AuthLayout>
            )
          },
          {
            path: "/subscribed",
            element: (
              <AuthLayout authentication>
                {" "}
                <MyChannelSubscribed />
              </AuthLayout>
            )
          }
        ]
      },
      {
        path: "/channel/:channel/editing",
        element: (
          <AuthLayout authentication>
            {" "}
            <EditInfo />
          </AuthLayout>
        ),
        children: [
          {
            path: "/contact-info",
            element: (
              <AuthLayout authentication>
                {" "}
                <PersonalInfo />
              </AuthLayout>
            )
          },
          // {
          //   path: "/username",
          //   element: (
          //     <AuthLayout authentication>
          //       {" "}
          //       <ChannelInfo />
          //     </AuthLayout>
          //   )
          // },
          {
            path: "/password",
            element: (
              <AuthLayout authentication>
                {" "}
                <ChgPassword />
              </AuthLayout>
            )
          }
        ]
      },
      {
        path: "/channel/:channel",
        element: (
          <AuthLayout authentication>
            {" "}
            <Dashboard />
          </AuthLayout>
        )
      },
      {
        path: "/t/privacy",
        element: <PrivacyPolicy />
      },
      {
        path: "/t/terms",
        element: <TnC />
      },
      {
        path: "/playlist/:list",
        element: <Playlist />
      },
      {
        path: "/playlist/LL",
        element: (
          <AuthLayout authentication>
            {" "}
            <LikedVideos />
          </AuthLayout>
        )
      },
      {
        path: "/feed/history",
        element: (
          <AuthLayout authentication>
            {" "}
            <WatchHistory />
          </AuthLayout>
        )
      },
      {
        path: "/channel/:channel/subscribers",
        element: (
          <AuthLayout authentication>
            {" "}
            <Subscribers />
          </AuthLayout>
        )
      }
    ]
  }
])

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <Provider store={store}>
      <RouterProvider router={router} />
    </Provider>
  </StrictMode>
)
