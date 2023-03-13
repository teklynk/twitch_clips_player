# Twitch Clips Player Overlay

## What is this?

This is a Twitch Clips Player, browser source overlay for OBS. 

This grabs your Twitch clips and plays them one after the other in a loop. Keep your viewers entertained on your BRB or starting soon scenes. 

[Try it here](https://twitch-clips-player.pages.dev/)

Track future development here: [https://github.com/teklynk/twitch_clips_player/projects/1](https://github.com/teklynk/twitch_clips_player/projects/1)

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


## URL Parameters

**channel=Your channel name or a comma separated list of channels** (user1,user2,user3,user4)

**shuffle=true/false**  Play clips in a random order.

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

## Custom CSS

Optional: Add this CSS to the OBS browser source and modify as needed.

```css
#container {
    display: block;
    padding: 4px;
    margin: 4px;
    text-align: center;
}

video {
    width: 100%;
    height: auto;
    max-height: 100%;
    border-radius: 10px;
}

#text-container {
    width: 100%;
    margin: 40px 0;
    position: absolute;
    top: 10%;
}

.title-text {
    font-family: Basic, Helvetica, sans-serif;
    font-weight: bold;
    font-size: 5vw;
    word-wrap: break-word;
    color: #fff;
    text-align: center;
    text-shadow: 2px 2px #000;
}

#details-container {
    position: absolute;
    top: 36vw;
    background: #00000090;
    padding: 12px 24px 12px 24px;
    margin-right: 24px;
    border-radius: 0px 24px 24px 0px;
    width: auto;
    animation: fadeout 15s forwards;
}

#details-container .details-text {
    font-family: Basic, Helvetica, sans-serif;
    font-weight: bold;
    word-wrap: break-word;
    color: #fff;
    text-align: left;
    text-shadow: 2px 2px #000;
}

#details-container .details-text.item-0 {
    font-size: 3vw;
}

#details-container .details-text.item-1, #details-container .details-text.item-2 {
    font-size: 2vw;
}

#details-container .details-text.item-3, #details-container .details-text.item-4 {
    font-size: 1vw;
    font-weight: normal;
}
```
If you want to add some flare to the clips info panel and channel name, try this CSS.

```css
#text-container {
    top: 0;
    background: #00008890;
    box-shadow: 0 10px #00000090;
    max-width: 100%;
    padding: 4px 0 8px 0;
    border-radius: 25px;
    left: -2000px;
    animation: slide 2s linear forwards;
}

#details-container {
    top: 42vw;
    border-radius: 25px;
    transform: skew(6deg, -6deg);
    margin-left: 0;
    background: #00008890;
    box-shadow: 10px 10px #00000090;
    animation: fadeout 15s linear forwards;
}

#details-container .details-text.item-0 {
    font-size: 3vw;
    overflow: hidden;
    max-width: 50ch;
    text-overflow: ellipsis;
    white-space: nowrap;
}

#details-container .details-text.item-1 {
    font-size: 2.5vw;
    overflow: hidden;
    max-width: 100ch;
    text-overflow: ellipsis;
    white-space: nowrap;
}

#details-container .details-text.item-2 {
    font-size: 2vw;
}

#details-container .details-text.item-3 {
    font-size: 1.5vw;
}

@keyframes slide {
    100% {left: 0;}
}
```

<img src="https://raw.githubusercontent.com/teklynk/twitch_clips_player/main/Screenshot01.png" width="500" />