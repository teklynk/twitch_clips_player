$(document).ready(function () {
    function getUrlParameter(name) {
        name = name.replace(/[\[]/, '\\[').replace(/[\]]/, '\\]');
        let regex = new RegExp('[\\?&]' + name + '=([^&#]*)');
        let results = regex.exec(location.search);
        return results === null ? '' : decodeURIComponent(results[1].replace(/\+/g, ' '));
    }

    // URL values
    let channel = getUrlParameter('channel');
    let limit = getUrlParameter('limit');
    let shuffle = getUrlParameter('shuffle');

    if (!shuffle) {
        shuffle = "false"; //default
    }
    if (!limit) {
        limit = "50"; //default
    }

    if (!channel) {
        alert('channel is not set in the url');
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

    // Json data - Ajax call
    let clips_json = JSON.parse($.getJSON({
        'url': "https://twitchapi.teklynk.com/getuserclips.php?channel=" + channel + "&limit=" + limit + "",
        'async': false
    }).responseText);

    // Sort array by created_at
    clips_json.data.sort(sortByProperty('created_at'));

    // Default clip index
    let clip_index = 0;

    // Create new video element
    let curr_clip = document.createElement('video');
    $(curr_clip).appendTo('#container');

    function loadClip(clip_index) {

        // Parse thumbnail image to build the clip url
        let thumbPart = clips_json.data[clip_index]['thumbnail_url'].split("-preview-");
        thumbPart = thumbPart[0] + ".mp4";

        // Load a new clip
        curr_clip.src = thumbPart;
        curr_clip.autoplay = true;
        curr_clip.controls = false;
        curr_clip.volume = 1.0;
        curr_clip.load();

        // Move to the next clip if the current one finishes playing
        curr_clip.addEventListener("ended", nextClip);

    }

    function nextClip() {
        if (clip_index < clips_json.data.length - 1) {
            clip_index += 1;
        } else {
            clip_index = 0;
        }
        loadClip(clip_index);
        curr_clip.play();
    }

    let randomClip = Math.floor((Math.random() * clips_json.data.length - 1) + 1);

    // Load a random clip
    if (shuffle === 'true') {
        loadClip(randomClip);
    } else {
        loadClip(clip_index);
    }

});