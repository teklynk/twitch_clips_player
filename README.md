# Twitch Clips Player Overlay

## What is this?

This is a Twitch Clips Player, browser source overlay for OBS. 

This grabs your Twitch clips and plays them one after the other in a loop. Keep your viewers entertained on your BRB or starting soon scenes. 

NEW FEATURES: Use a custom command to start the clips reel and restrict it to Mods only. You can also add type "!command @teklynk @coolstreamer @gamer123 @tekbot" which will play the clips reel for only those channels.

Track future development here: [https://github.com/teklynk/twitch_clips_player/projects/1](https://github.com/teklynk/twitch_clips_player/projects/1)


### [Try it here](https://twitch-clips-player.pages.dev/)

## URL Parameters

**channel=Your channel name or a comma separated list of channels** (user1,user2,user3,user4)

**shuffle=true/false**  Play clips in a random order.

**showText=true/false**  Displays the channel name on top of the video.

**limit=integer**  Max number of clips to pull from (max is 100).

**so=true/false**  Say a Shout-out message in chat.

**command=string**  Custom command to fire off the clips player. If Not set, clips player will play as soon as the scene is active.

**customText=string**  Displays custom message on top of clips. Can include {channel}.

**modOnly=true/false**  When command option is used, can limit command to Mods only.

**mainAccount=channel**  The main channel that you want to send chat messages to.

**ref=base64**  Access token

**customMsg=string**  Shout-out message. Uses variables like: {channel},{games},{tile},{url}

## Custom CSS

Add this CSS to the OBS browser source and modify as needed.

```
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
```
