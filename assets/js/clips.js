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
    let mainAccount = getUrlParameter('mainAccount').toLowerCase().trim();
    let limit = getUrlParameter('limit').trim();
    let shuffle = getUrlParameter('shuffle').trim();
    let showText = getUrlParameter('showText').trim();
    let so = getUrlParameter('so').trim();
    let ref = getUrlParameter('ref').trim();
    let customMsg = getUrlParameter('customMsg').trim();
    let randomClip = 0; // Default random clip index
    let clip_index = 0; // Default clip index

    if (!shuffle) {
        shuffle = "false"; //default
    }

    if (!so) {
        so = "false"; //default
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

    if (so === 'true' && ref === '') {
        alert('Twitch access token now found');
    }

    let client = '';

    // If shoutout and Auth token set, then connect to chat using oauth.
    if (so === 'true' && ref) {

        client = new tmi.Client({
            options: {
                debug: true,
                skipUpdatingEmotesets: true
            },
            connection: {reconnect: true},
            identity: {
                username: mainAccount,
                password: 'oauth:' + atob(ref)
            },
            channels: [mainAccount]
        });

        client.connect().catch(console.error);
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

    // Only do this if doing a shoutout message, else, play clip right away
    if (so === 'true' && ref) {
        // wait 3 seconds for TMI to connect to Twitch before loading clip and doing a shoutout
        setTimeout(function () {
            // Play a clip
            loadClip(channel[clip_index]);
        }, 3000);
    } else {
        loadClip(channel[clip_index]);
    }

    // Get and play the clip
    function loadClip(channelName) {
        // Json data - Ajax call
        let clips_json = JSON.parse($.getJSON({
            'url': "https://twitchapi.teklynk.com/getuserclips.php?channel=" + channelName + "&limit=" + limit + "",
            'async': false
        }).responseText);

        // If no user clips exist, then exit/skip
        if (!clips_json.data) {
            console.log('no clips exist for channel: ' + channelName);
            nextClip();
            return false;
        }

        // Sort array by created_at
        clips_json.data.sort(sortByProperty('created_at'));

        // Grab a random clip index anywhere from 1 to the limit value. Else, grab the most recent popular clip.
        if (shuffle === 'true') {
            randomClip = Math.floor((Math.random() * clips_json.data.length - 1) + 1);
        } else {
            randomClip = 0;
        }

        // Show channel name on top of video
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

        // Do a shout-out for each clip
        if (so === 'true' && ref) {
            let so_json = JSON.parse($.getJSON({
                'url': "https://twitchapi.teklynk.com/getuserstatus.php?channel=" + channelName + "",
                'async': false
            }).responseText);

            // Custom message. Replace {variable} with actual values
            if (customMsg) {
                customMsg = getUrlParameter('customMsg').trim();
                customMsg = customMsg.replace('{channel}', so_json.data[0]['broadcaster_name']);
                customMsg = customMsg.replace('{game}', so_json.data[0]['game_name']);
                customMsg = customMsg.replace('{title}', so_json.data[0]['title']);
                customMsg = customMsg.replace('{url}', "https://twitch.tv/" + so_json.data[0]['broadcaster_login']);
                // Say custom message
                client.say(mainAccount, customMsg);
            } else {
                // Say default message
                client.say(mainAccount, "Go check out " + so_json.data[0]['broadcaster_name'] + "! They were playing: " + so_json.data[0]['game_name'] + " - " + so_json.data[0]['title'] + " - https://twitch.tv/" + so_json.data[0]['broadcaster_login']);
            }
        }
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