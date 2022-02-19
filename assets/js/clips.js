$(document).ready(function () {
    function getUrlParameter(name) {
        name = name.replace(/[\[]/, '\\[').replace(/[\]]/, '\\]');
        let regex = new RegExp('[\\?&]' + name + '=([^&#]*)');
        let results = regex.exec(location.search);
        return results === null ? '' : decodeURIComponent(results[1].replace(/\+/g, ' '));
    }

    // Sort function
    function sortByProperty(property) {
        return function (a, b) {
            if (a[property] < b[property])
                return 1;
            else if (a[property] > b[property])
                return -1;
            return 0;
        }
    }

    // URL values
    let channel = getUrlParameter('channel').toLowerCase().trim();
    let limit = getUrlParameter('limit').trim();
    let shuffle = getUrlParameter('shuffle').trim();
    let showText = getUrlParameter('showText').trim();
    let randomClip = 0; // Default random clip index
    let clip_index = 0; // Default clip index

    if (!shuffle) {
        shuffle = "false"; //default
    }

    if (!showText) {
        showText = "false"; //default
    }

    if (!limit) {
        limit = "50"; //default
    }

    if (!channel) {
        alert('channel is not set in the url');
    }

    // Convert string to an array/list
    channel = channel.split(',');

    let channel_index = channel.length;

    // Randomly grab a channel from the list to start from
    if (shuffle === 'true' && channel.length > 0) {
        clip_index = Math.floor((Math.random() * channel.length - 1) + 1);
    } else {
        clip_index = 0;
    }

    // Create new video element
    let curr_clip = document.createElement('video');
    $(curr_clip).appendTo('#container');

    // Play a clip on initial page load
    loadClip(channel[clip_index]);

    function loadClip(channelName) {

        // Json data - Ajax call
        let clips_json = JSON.parse($.getJSON({
            'url': "https://twitchapi.teklynk.com/getuserclips.php?channel=" + channelName + "&limit=" + limit + "",
            'async': false
        }).responseText);

        // Sort array by created_at
        clips_json.data.sort(sortByProperty('created_at'));

        if (shuffle === 'true') {
            randomClip = Math.floor((Math.random() * clips_json.data.length - 1) + 1);
        } else {
            randomClip = 0;
        }

        if (showText === 'true') {
            $("<div id='text-container'><span class='title-text'>" + clips_json.data[0]['broadcaster_name'] + "</span></div>").appendTo('#container');
        }

        // Parse thumbnail image to build the clip url
        let thumbPart = clips_json.data[randomClip]['thumbnail_url'].split("-preview-");
        thumbPart = thumbPart[0] + ".mp4";

        // Load a new clip
        curr_clip.src = thumbPart;
        curr_clip.autoplay = true;
        curr_clip.controls = false;
        curr_clip.volume = 1.0;
        curr_clip.load();

        // Debug
        console.log('channelName: ' + channelName);
        console.log('clipNumber: ' + randomClip);

        // Move to the next clip if the current one finishes playing
        curr_clip.addEventListener("ended", nextClip);

    }

    function nextClip() {
        // Remove element when the next clip plays
        $('#text-container').remove();

        if (clip_index < channel_index - 1) {
            clip_index += 1;
        } else {
            clip_index = 0;
        }

        loadClip(channel[clip_index]);

        curr_clip.play();
    }
});