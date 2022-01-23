# Twitch Clips Player Overlay

## What is this?

This is a Twitch Clips Player, browser source overlay for OBS. 

## URL Parameters

**channel=Your channel name** 

**shuffle=true/false**  Play clips in a random order.

**limit=100**  Max number of clips to pull from (max is 100).

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