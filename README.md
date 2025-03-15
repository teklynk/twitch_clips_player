# Twitch Clips Player Overlay

## What is this?

[obs_capture_clipsreel.webm](https://user-images.githubusercontent.com/4500737/225199595-d7a10be8-86dd-4669-9a86-280fb2b5907e.webm)


This is a Twitch Clips Player, browser source overlay for OBS. 

This grabs your Twitch clips and plays them one after the other in a loop. Keep your viewers entertained on your BRB or starting soon scenes. 

## DISCLAIMER:
This project is "AS-IS". It is free to use, clone, fork, modify, make it your own.

[Try it here](https://twitch-clips-player.pages.dev/)

**FEATURES:** 
- !clipso @teklynk to play a clip from a channel while the clips reel is playing. This will immediately play the clip from the channel and then continue on with the rest of the clips reel. 
- Control the clips from Twitch chat. !clipskip, !clippause, !clipplay, !clipreload, !clipso @channelname. Limited to Mods and Streamer.
- Show clips from channels that you follow. Grabs the most recent 700 channels.
- Use a custom command to start the clips reel and restrict it to Mods only.
- Type "!mycommand @teklynk @coolstreamer @gamer123 @tekbot" which will play the clips reel for only those channels. 
- Type "!mycommand" while the clips reel is playing to skip to the next clip. 
- Type "!mycommand stop" to stop the clips player.
- Date Range option: This will grab a clip from within the last 5days, 10day, 30days... If no clips exist, then skip to the next channel.
- Show clip details panel: This will display a panel in the lower third of the overlay that contains details about the clip. This can use variables:{channel},{title},{game},{creator_name},{created_at}.

## Notes:
**Date range, featured clips:** The clips player will try to find and play clips that meet these options first. If no clips are found within these filters, then it will play a clip from the top most popular. Playing any clip is better than not playing a clip at all.

Twitch authentication is now required if you would like to show clips from channels that you follow and/or show a message in chat.

In OBS, set the browser source to: "Shutdown source when not visible" and "Refresh browser when scene becomes active". This will prevent the clips player from playing in the background. It will also reload/refresh the clips player when the source becomes active.

## URL Parameters

**channel=Your channel name or a comma separated list of channels** (user1,user2,user3,user4)

**shuffle=true/false**  Play clips in a random order.

**preferFeatured=true/false**  Only pull featured clips.

**showText=true/false**  Enables the channel name on top of the video.

**showDetails=true/false**  Enables the clips details panel on overlay.

**detailsText=string**  Displays custom details about the clips. Can include {channel},{title},{game},{creator_name},{created_at}.

**limit=integer**  Max number of clips to pull from (max is 100).

**dateRange=integer**  Only pull clips from a specific date range.

**so=true/false**  Say a Shout-out message in chat.

**command=string**  Custom command to fire off the clips player. If Not set, clips player will play as soon as the scene is active.

**showFollowing=true/false** Pulls clips from the latest 100 channels that you are following. 

**customText=string**  Displays custom message on top of clips. Can include {channel}.

**modOnly=true/false**  When command option is used, can limit command to Mods only.

**delay=integer**  Adds a delay between clips. Great from showing a graphic that is behind the clips player. Default is 0.

**mainAccount=channel**  The main channel that you want to send chat messages to.

**ref=base64**  Access token

**customMsg=string**  Shout-out message. Uses variables like: {channel},{games},{tile},{url}

**themeOption=integer** Various pre-made css themes top choose from.

## Custom CSS

## Optional: Set a fixed video width and height.

Add this to the OBS browser source CSS properties.

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