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

    // URL values
    let channel = getUrlParameter('channel').toLowerCase().trim();
    let mainAccount = getUrlParameter('mainAccount').toLowerCase().trim();
    let limit = getUrlParameter('limit').trim();
    let shuffle = getUrlParameter('shuffle').trim();
    let showText = getUrlParameter('showText').trim();
    let so = getUrlParameter('so').trim();
    let ref = getUrlParameter('ref').trim();
    let customMsg = getUrlParameter('customMsg').trim();
    let customText = getUrlParameter('customText').trim();
    let command = getUrlParameter('command').trim();
    let modOnly = getUrlParameter('modOnly').trim();
    let randomClip = 0; // Default random clip index
    let clip_index = 0; // Default clip index
    let cmdArray = [];

    if (!shuffle) {
        shuffle = "false"; //default
    }

    if (!so) {
        so = "false"; //default
    }

    if (!modOnly) {
        modOnly = "false"; //default
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

    // If Auth token is set, then connect to chat using oauth, else connect anonymously.
    if (so === 'true' && ref) {
        // Connect to twitch - needs auth token
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
    } else {
        // Connect to twitch anonymously - does not need auth token
        client = new tmi.Client({
            options: {
                debug: true,
                skipUpdatingEmotesets: true
            },
            connection: {reconnect: true},
            channels: [mainAccount]
        });
    }

    client.connect().catch(console.error);

    // Convert string to an array/list
    channel = channel.split(',').map(element => element.trim());

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
    $(curr_clip).appendTo('#container');

    //if command is set
    if (command) {
        // If command is set
        // triggers on message
        client.on('chat', (channel, user, message, self) => {

            if (user['message-type'] === 'chat' && message.startsWith('!' + command)) {

                // Remove element before loading the clip
                $('#text-container').remove();

                // Create an array of channel names
                cmdArray = message.split('@').map(element => element.trim()); //Split channel names using the @ symbol
                cmdArray = cmdArray.slice(1);
                cmdArray = cmdArray.filter(String);

                // If command also contains @channel names
                if (cmdArray.length > 0) {

                    // Redeclare channel array as cmdArray from the ! command
                    channel = cmdArray;

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
                }

                if (so === 'true' && ref) {
                    // wait 3 seconds for TMI to connect to Twitch before loading clip and doing a shoutout
                    setTimeout(function () {
                        // Play a clip
                        if (modOnly === 'true' && (user.mod || user.username === mainAccount)) {
                            loadClip(channel[clip_index]);
                        } else if (modOnly === 'false' || user.username === mainAccount) {
                            loadClip(channel[clip_index]);
                        }
                    }, 3000);
                } else {
                    if (modOnly === 'true' && (user.mod || user.username === mainAccount)) {
                        loadClip(channel[clip_index]);
                    } else if (modOnly === 'false' || user.username === mainAccount) {
                        loadClip(channel[clip_index]);
                    }
                }
            }
        });

    } else {
        // Plays clips when scene is active
        if (so === 'true' && ref) {
            // wait 3 seconds for TMI to connect to Twitch before loading clip and doing a shoutout
            setTimeout(function () {
                // Play a clip
                loadClip(channel[clip_index]);
            }, 3000);
        } else {
            // Play a clip when scene is active
            loadClip(channel[clip_index]);
        }
    }

    // Get and play the clip
    function loadClip(channelName) {
        // Json data - Ajax call
        let clips_json = JSON.parse($.getJSON({
            'url': "https://twitchapi.teklynk.com/getuserclips.php?channel=" + channelName + "&limit=" + limit + "",
            'async': false
        }).responseText);

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
        if (showText === 'true') {
            if (customText) {
                // custom message to show on top of clip. includes {channel} name as a variable
                customText = getUrlParameter('customText').trim();
                customText = customText.replace("{channel}", clips_json.data[0]['broadcaster_name']);
                $("<div id='text-container'><span class='title-text'>" + customText + "</span></div>").appendTo('#container');
            } else {
                $("<div id='text-container'><span class='title-text'>" + clips_json.data[0]['broadcaster_name'] + "</span></div>").appendTo('#container');
            }
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
                customMsg = getUrlParameter('customMsg');
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
        if (document.getElementById("text-container")) {
            document.getElementById("text-container").remove();
        }

        // If chat command contains a list of channel names ie: !reel @teklynk @mrcool @thatstreamer @gamer123
        if (cmdArray.length > 0) {
            channel = cmdArray;
        }

        if (clip_index < channel.length - 1) {
            clip_index += 1;
        } else {
            clip_index = 0;
        }

        loadClip(channel[clip_index]);

        curr_clip.play();
    }
});