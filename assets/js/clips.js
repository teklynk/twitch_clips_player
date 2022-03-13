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

    // Array Shuffler
    function shuffleArray(arr) {
        arr.sort(() => Math.random() - 0.5);
    }

    let apiDomain = "http://twitchapi.local";

    // URL values
    let channel = getUrlParameter('channel').toLowerCase().trim();
    let mainAccount = getUrlParameter('mainAccount').toLowerCase().trim();
    let limit = getUrlParameter('limit').trim();
    let shuffle = getUrlParameter('shuffle').trim();
    let showText = getUrlParameter('showText').trim();
    let so = getUrlParameter('so').trim();
    let ref = getUrlParameter('ref').trim();
    let customMsg = getUrlParameter('customMsg').trim();
    let layout = getUrlParameter('layout').trim();
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
        alert('Twitch access token not set');
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

    // Randomly grab a channel from the list to start from
    if (shuffle === 'true' && channel.length > 0) {
        // shuffle the list of channel names
        shuffleArray(channel);
        // grab a random channel from the chanel list
        clip_index = Math.floor((Math.random() * channel.length - 1) + 1);
    } else {
        // grab the first item in the list to start from
        clip_index = 0;
    }

    // Create new video element
    let curr_clip = document.createElement('video');

    // Creates elements for layout 1
    if (layout === "1") {
        // adds video to video container
        let layout1 = document.createElement('div');
        layout1.setAttribute("id", "layout1");
        $(layout1).appendTo('#container');

        let videoContainer = document.createElement('div');
        videoContainer.setAttribute("id", "videoContainer");
        $(videoContainer).appendTo('#layout1');

        // add clip details to video details container
        let videoDetails = document.createElement('div');
        videoDetails.setAttribute("id", "videoDetails");
        $(videoDetails).appendTo('#layout1');

        $(curr_clip).appendTo('#videoContainer');

    } else {
        // default
        $(curr_clip).appendTo('#container');
    }

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
            'url': apiDomain + "/getuserclips.php?channel=" + channelName + "&limit=" + limit + "",
            'async': false
        }).responseText);

        //Get game name from game id
        //only do this layout=2

        // If no user clips exist, then skip to the next channel
        if (!clips_json.data || typeof clips_json.data === 'undefined' || clips_json.data.length === 0) {
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
        if (layout !== "1" && showText === 'true') {
            $("<div id='text-container'><span class='title-text'>" + clips_json.data[0]['broadcaster_name'] + "</span></div>").appendTo('#container');
        }

        if (layout === "1") {
            let gameName = '';

            if (clips_json.data[randomClip]['game_id']) {

                // Get game title / stream category
                let game_json = JSON.parse($.getJSON({
                    'url': apiDomain + "/getgame.php?id=" + clips_json.data[randomClip]['game_id'],
                    'async': false
                }).responseText);

                gameName = game_json.data[0]['name'];
            }

            let clip_datetime = new Date(clips_json.data[randomClip]['created_at']);

            //$("<div id='layout1'></div>").appendTo('#container');

            $("<div id='details'></div>").appendTo('#videoDetails');
            $("<div id='clip-channel'><span class='clip-channel-text'>" + clips_json.data[randomClip]['broadcaster_name'] + "</span></div>").appendTo('#details');
            $("<div id='clip-title'><span class='clip-title-text'>" + clips_json.data[randomClip]['title'] + "</span></div>").appendTo('#details');
            $("<div id='clip-game'><span>Game Name:</span><span class='clip-game-text'>" + gameName + "</span></div>").appendTo('#details');
            $("<div id='clip-date'><span>Clip Date:</span><span class='clip-created-text'>" + clip_datetime.toLocaleDateString(navigator.language) + "</span></div>").appendTo('#details');
            $("<div id='clip-created'><span>Clipped By:</span><span class='clip-creator-text'>" + clips_json.data[randomClip]['creator_name'] + "</span></div>").appendTo('#details');
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
                'url': apiDomain + "/getuserstatus.php?channel=" + channelName + "",
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
        $('#details').remove();

        if (clip_index < channel.length - 1) {
            clip_index += 1;
        } else {
            clip_index = 0;
        }

        loadClip(channel[clip_index]);

        curr_clip.play();
    }
});