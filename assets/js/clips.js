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
    let delay = getUrlParameter('delay').trim();
    let shuffle = getUrlParameter('shuffle').trim();
    let showText = getUrlParameter('showText').trim();
    let so = getUrlParameter('so').trim();
    let ref = getUrlParameter('ref').trim();
    let customMsg = getUrlParameter('customMsg').trim();
    let customText = getUrlParameter('customText').trim();
    let command = getUrlParameter('command').trim();
    let modOnly = getUrlParameter('modOnly').trim();
    let showFollowing = getUrlParameter('showFollowing').trim();
    let randomClip = 0; // Default random clip index
    let clip_index = 0; // Default clip index
    let cmdArray = [];
    let following = "";
    let followCount = 0;

    if (!shuffle) {
        shuffle = "false"; //default
    }

    if (!showFollowing) {
        showFollowing = "false"; //default
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

    if (!delay) {
        delay = "0"; //default
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

    if (showFollowing === 'true') {

        function following_pagination(cursor) {
            let $jsonParse = JSON.parse($.getJSON({
                'url': "https://twitchapi.teklynk.com/getuserfollowing.php?channel=" + mainAccount + "&limit=100&after=" + cursor,
                'async': false
            }).responseText);

            return $jsonParse;
        }

        // Globals: following, followCount
        function concatFollowing(jsonData) {
            $.each(jsonData, function (i, val) {
                following += val['to_login'] + ",";
                followCount++;
            });
        }

        // Json following data - page 1
        let following_json = following_pagination('');

        concatFollowing(following_json.data);

        // TODO: Refactor this to ITERATE over following with a while loop. Make a function with a callback.
        // Start the Following pagination - Pull up to 700 channels from Twitch API
        if (following_json.pagination['cursor'] > '') {

            let following_json_pagination_1 = following_pagination(following_json.pagination['cursor']);

            concatFollowing(following_json_pagination_1.data);

            if (following_json_pagination_1.pagination['cursor'] > '') {
                let following_json_pagination_2 = following_pagination(following_json_pagination_1.pagination['cursor']);

                concatFollowing(following_json_pagination_2.data);

                if (following_json_pagination_2.pagination['cursor'] > '') {
                    let following_json_pagination_3 = following_pagination(following_json_pagination_2.pagination['cursor']);

                    concatFollowing(following_json_pagination_3.data);

                    if (following_json_pagination_3.pagination['cursor'] > '') {
                        let following_json_pagination_4 = following_pagination(following_json_pagination_3.pagination['cursor']);

                        concatFollowing(following_json_pagination_4.data);

                        if (following_json_pagination_4.pagination['cursor'] > '') {
                            let following_json_pagination_5 = following_pagination(following_json_pagination_4.pagination['cursor']);

                            concatFollowing(following_json_pagination_5.data);

                            if (following_json_pagination_5.pagination['cursor'] > '') {
                                let following_json_pagination_6 = following_pagination(following_json_pagination_5.pagination['cursor']);

                                concatFollowing(following_json_pagination_6.data);
                            }
                        }
                    }
                }
            }
        }

        // Remove the last comma from string
        following = following.replace(/,\s*$/, "");

        // Set channel to equal following list/string
        channel = following.split(',').map(element => element.trim());

        // Print following count and following channel list for debugging
        console.log('following (' + followCount + '):\n' + following);

    } else {

        // Convert string to an array/list
        channel = channel.split(',').map(element => element.trim());
    }

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

            if (self || !message.startsWith('!')) return;

            if (user['message-type'] === 'chat' && message.startsWith('!' + command)) {

                // Remove element before loading the clip
                $('#text-container').remove();

                // Get second command. ie: stop
                let commandOption = message.split(' ')[1];

                // Stop the clips player
                if (commandOption === "stop") {
                    // Reload browser source
                    window.location.reload();
                }

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
                    // wait 1 second for TMI to connect to Twitch before loading clip and doing a shoutout
                    setTimeout(function () {
                        // Play a clip
                        if (modOnly === 'true' && (user.mod || user.username === mainAccount)) {
                            loadClip(channel[clip_index]);
                        } else if (modOnly === 'false' || user.username === mainAccount) {
                            loadClip(channel[clip_index]);
                        }
                    }, 1000);
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
            // wait 1 second for TMI to connect to Twitch before loading clip and doing a shoutout
            setTimeout(function () {
                // Play a clip
                loadClip(channel[clip_index]);
            }, 1000);
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
            nextClip(true); // skip clip
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

    function nextClip(skip = false) {

        // Remove element when the next clip plays
        if (document.getElementById("text-container")) {
            document.getElementById("text-container").remove();
        }

        // Properly remove video source
        let videoElement = document.querySelector("video");
        videoElement.pause();
        videoElement.removeAttribute("src"); // empty source
        videoElement.load();

        // If chat command contains a list of channel names ie: !reel @teklynk @mrcool @thatstreamer @gamer123
        if (cmdArray.length > 0) {
            channel = cmdArray;
        }

        if (clip_index < channel.length - 1) {
            clip_index += 1;
        } else {
            clip_index = 0;
        }

        if (skip === true) {
            // Skips to the next clip if a clip does not exist
            console.log("Skipping clip");
            loadClip(channel[clip_index]);
            curr_clip.play();
        } else {
            console.log("Delay: " + parseInt(delay) * 1000);
            // Adjust the delay in the url, else delay=0
            setTimeout(function () {
                // Play a clip
                loadClip(channel[clip_index]);
                curr_clip.play();
            }, parseInt(delay) * 1000); // wait time
        }

    }
});