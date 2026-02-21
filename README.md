# Twitch Clips Player Overlay

[obs_capture_clipsreel.webm](https://user-images.githubusercontent.com/4500737/225199595-d7a10be8-86dd-4669-9a86-280fb2b5907e.webm)

## What is this?
This is a Twitch Clips Player, browser source overlay for OBS. It grabs your Twitch clips and plays them one after the other in a loop. Keep your viewers entertained on your BRB or starting soon scenes.

Try it here:
- [https://twitchclipsplayer.com](https://twitchclipsplayer.com)
- [https://twitch-clips-player.teklynk.com](https://twitch-clips-player.teklynk.com)
- [https://twitch-clips-player.teklynk.dev](https://twitch-clips-player.teklynk.dev)
- [https://twitch-clips-player.pages.dev](https://twitch-clips-player.pages.dev)

## Features
- **Chat Control**: Control the clips from Twitch chat using `!clipskip`, `!clippause`, `!clipplay`, `!clipreload`. (Limited to Mods and Streamer).
- **Following Feed**: Show clips from channels that you follow. Grabs the most recent 700 channels.
- **Custom Commands**: Use a custom command to start the clips reel and restrict it to Mods only. Type `!mycommand stop` in chat to stop the clips player.
- **Smart Filtering**:
  - **Date Range**: Grab clips from within the last 5, 10, 30 days, etc.
  - **Fallback**: If no clips match the filters (Date range/Featured), it falls back to the top most popular clips to ensure content plays.
- **Details Panel**: Display a panel in the lower third of the overlay with clip details. Supports variables: `{channel}`, `{title}`, `{game}`, `{creator_name}`, `{created_at}`.

## Setup Guide

### OBS Settings
1. Add a **Browser Source** in OBS.
2. Enter the URL with your desired parameters.
3. **Important**: Check **"Shutdown source when not visible"** and **"Refresh browser when scene becomes active"**.
   - This prevents the player from running in the background and ensures it reloads fresh when you switch to the scene.

### Authentication
Twitch authentication is required if you want to:
- Show clips from channels you follow.
- Show messages in chat.

## Configuration (URL Parameters)

Add these parameters to your URL query string (e.g., `?channel=mychannel&limit=20`).

| Parameter | Type | Description |
| :--- | :--- | :--- |
| `channel` | string | Your channel name or a comma-separated list of channels (e.g., `user1,user2`). |
| `mainAccount` | string | The main channel to monitor for chat commands. |
| `ref` | base64 | Access token for authentication. |
| `limit` | integer | Max number of clips to retrieve (max 100). |
| `dateRange` | integer | Number of days to look back for clips. |
| `preferFeatured` | true/false | If `true`, tries to pull featured clips first. |
| `showFollowing` | true/false | Pulls clips from the latest 100 channels you follow. |
| `showText` | true/false | Displays the channel name on top of the video. |
| `showDetails` | true/false | Enables the clip details panel on the overlay. |
| `detailsText` | string | Custom text for the details panel. Variables: `{channel}`, `{title}`, `{game}`, `{creator_name}`, `{created_at}`. |
| `customText` | string | Custom message on top of clips. Variables: `{channel}`. |
| `command` | string | Custom chat command to start the player. If not set, plays automatically on load. |
| `themeOption` | integer | Select a pre-made CSS theme. |

## Custom CSS

You can add this to the OBS browser source **CSS** box to set a fixed video width and height (optional).

```css
video {
    width: 1280px !important;
    height: 720px !important;
    background-color: #000000;
}

#container {
    padding:0;
    margin:0;
}

#details-container {
    top: 44vw;
}
```