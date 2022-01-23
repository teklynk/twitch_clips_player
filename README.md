# Twitch Clips Player Overlay

## What is this?

This is a Twitch Clips Player, browser source overlay for OBS. 

This grabs your Twitch clips and plays them one after the other in a loop. Keep your viewers entertained on your BRB or starting soon scenes.

### [Try it here](https://twitch-clips-player.pages.dev/)

## URL Parameters

**channel=Your channel name** 

**shuffle=true/false**  Play clips in a random order.

**limit=integer**  Max number of clips to pull from (max is 100).

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
```