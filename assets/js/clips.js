$(document).ready(function () {

    // Function to check and update the URL in localStorage
    function checkAndUpdateUrl() {
        // Get the current URL
        const currentUrl = window.location.href;

        // Retrieve the stored URL from localStorage
        const storedUrl = localStorage.getItem("storedUrl");

        if (storedUrl) {
            if (storedUrl !== currentUrl) {
                console.log("URL has changed. Updating localStorage...");
                localStorage.clear();
                localStorage.setItem("storedUrl", currentUrl);
            }
        } else {
            // If no URL is stored, initialize with the current URL
            console.log("No URL stored. Initializing...");
            localStorage.clear();
            localStorage.setItem("storedUrl", currentUrl);
        }
    }

    // Call the function
    checkAndUpdateUrl();

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
    let dateRange = getUrlParameter('dateRange').trim();
    let streamerOnly = getUrlParameter('streamerOnly').trim();
    let delay = getUrlParameter('delay').trim();
    let shuffle = getUrlParameter('shuffle').trim();
    let preferFeatured = getUrlParameter('preferFeatured').trim();
    let showText = getUrlParameter('showText').trim();
    let showDetails = getUrlParameter('showDetails').trim();
    let so = getUrlParameter('so').trim();
    let ref = getUrlParameter('ref').trim();
    let clientId = getUrlParameter('clientId').trim();
    let customMsg = getUrlParameter('customMsg').trim();
    let customText = getUrlParameter('customText').trim();
    let detailsText = getUrlParameter('detailsText').trim();
    let command = getUrlParameter('command').trim();
    let modOnly = getUrlParameter('modOnly').trim();
    let showFollowing = getUrlParameter('showFollowing').trim();
    let exclude = getUrlParameter('exclude').trim();
    let themeOption = getUrlParameter('themeOption').trim();
    let gameTitle = getUrlParameter('gameTitle').trim();
    let randomClip = 0; // Default random clip index
    let clip_index = 0; // Default clip index
    let cmdArray = [];
    let following = "";
    let followCount = 0;
    let playCount = 0;
    let poster = '';

    if (!gameTitle) {
        gameTitle = ""; //default
    }

    if (!showDetails) {
        showDetails = "false"; //default
    }

    if (!shuffle) {
        shuffle = "false"; //default
    }

    if (!preferFeatured) {
        preferFeatured = false; //default
    }

    if (!showFollowing) {
        showFollowing = "false"; //default
    }

    if (!exclude) {
        exclude = ""; //default
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

    if (!dateRange || dateRange === "0") {
        dateRange = ""; //default
    } else {
        // Get client current date
        let todayDate = new Date();

        // subtract dateRange from todayDate
        let startDate = new Date(new Date().setDate(todayDate.getDate() - parseInt(dateRange)));

        // format dates
        startDate = startDate.toISOString().slice(0, 10);
        todayDate = todayDate.toISOString().slice(0, 10);

        // set the daterange url parameter for the api endpoint
        dateRange = "&start_date=" + startDate + "T00:00:00Z&end_date=" + todayDate + "T00:00:00Z";
    }

    if (!delay) {
        delay = "0"; //default
    }

    let client = '';

    // onload set the local storage for clip_id to false.
    localStorage.setItem('clip_id', '');

    // Load theme css file if theme is set
    if (parseInt(themeOption) > 0) {
        $('head').append('<link rel="stylesheet" type="text/css" href="assets/css/theme' + themeOption + '.css">');
    }

    // If Auth token is set, then connect to chat using oauth, else connect anonymously.
    if (so === 'true' && ref > '') {
        // Connect to twitch - needs auth token
        client = new tmi.Client({
            options: {
                debug: true,
                skipUpdatingEmotesets: true
            },
            connection: { reconnect: true },
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
            connection: { reconnect: true },
            channels: [mainAccount]
        });
    }

    client.connect().catch(console.error);

    // Get game details function
    function game_by_id(game_id) {
        let $jsonParse = JSON.parse($.getJSON({
            'url': "https://twitchapi.teklynk.com/getgame.php?id=" + game_id,
            'async': false
        }).responseText);

        return $jsonParse;
    }

    function game_by_title(game_title) {
        let $game_by_title_jsonParse = JSON.parse($.getJSON({
            'url': "https://twitchapi.teklynk.com/getgame.php?name=" + game_title,
            'async': false
        }).responseText);

        return $game_by_title_jsonParse;
    }

    if (showFollowing === 'true' && ref > '' && clientId > '') {

        function following_pagination(cursor) {
            let $jsonParse = JSON.parse($.getJSON({
                'url': "https://twitchapi.teklynk.com/getuserfollowing.php?channel=" + mainAccount + "&limit=100&ref=" + ref + "&clientId=" + clientId,
                'async': false
            }).responseText);

            return $jsonParse;
        }

        // Globals: following, followCount
        function concatFollowing(jsonData) {
            $.each(jsonData, function (i, val) {
                following += val['broadcaster_login'] + ",";
                followCount++;
            });
        }

        // Json following data - page 1
        let following_json = following_pagination();

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

        // Exclude channels from following
        let channelListArray = following.split(',');
        let excludeArray = exclude.split(',');
        channelListArray = channelListArray.filter(item => !excludeArray.includes(item));
        followList = channelListArray.join(',');

        //console.log(followList);

        // Set channel to equal following list/string
        channel = followList.split(',').map(element => element.trim());

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
                $('#details-container').remove();

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

                if (so === 'true' && ref > '') {
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
        if (so === 'true' && ref > '') {
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

    // TODO: Refactor this as options that the user can define/set
    // Hard-coded commands to control the current clip. Limited to mods and streamer
    // !clipskip, !clippause, !clipplay
    // Triggers on message
    client.on('chat', (channel, user, message, self) => {

        if (self || !message.startsWith('!')) return;

        if (user['message-type'] === 'chat' && message.startsWith('!')) {

            if (user.mod || user.username === mainAccount) {

                let videoElement = document.querySelector("video");

                if (message === "!clipskip") {

                    console.log("Skipping Clip");
                    nextClip(true); // skip clip
                    return false;

                } else if (message === "!clippause") {

                    console.log("Pausing Clip");
                    videoElement.pause(); // pause clip

                } else if (message === "!clipplay" && videoElement.paused) {

                    console.log("Playing Clip");
                    videoElement.play(); // continue playing clip if was paused

                } else if (message === "!clipreload") {

                    window.location.reload(); // Reload browser source

                } else if (message.startsWith('!clipso')) {

                    let getChannel = message.substr(8);
                    getChannel = getChannel.replace('@', '');
                    getChannel = getChannel.trim();
                    getChannel = getChannel.toLowerCase();

                    console.log('shout-out: ' + getChannel);

                    // Remove element when the next clip plays
                    if (document.getElementById("text-container")) {
                        document.getElementById("text-container").remove();
                    }
                    if (document.getElementById("details-container")) {
                        document.getElementById("details-container").remove();
                    }

                    loadClip(getChannel); // play a clip from getChannel right away
                    return false;
                }

            }

        }

    });

    // Get and play the clip
    function loadClip(channelName) {

        let storedTime_expired = false;

        let clips_json = "";

        let currentTime = Date.now(); // Get the current timestamp

        // stored api pull date time to localstorage
        if (localStorage.getItem('clips_datetime_' + channelName) === null) {
            localStorage.setItem('clips_datetime_' + channelName, currentTime);
        }

        let storedTime = localStorage.getItem('clips_datetime_' + channelName);

        // compare localstorage date/time with current date/time
        if (storedTime) {
            let storedTimeMs = parseInt(storedTime, 10);
            let hoursDifference = (currentTime - storedTimeMs) / (1000 * 60 * 60);
            // check if localstorage is 24 hours old
            if (hoursDifference >= 24) {
                console.log("24 hours has passed since last pull from api. Updating...");
                storedTime_expired = true;
            } else {
                storedTime_expired = false;
            }
        }

        // Json data - Ajax calls
        // if localstorage does not exist or datetime of last api pull has expired
        if (localStorage.getItem(channelName) === null || storedTime_expired) {
            if (streamerOnly === 'true') {
                clips_json = JSON.parse($.getJSON({
                    'url': "https://twitchapi.teklynk.com/getuserclips.php?channel=" + channelName + "&creator_name=" + channelName + "&prefer_featured=" + preferFeatured + "&limit=" + limit + "" + dateRange,
                    'async': false
                }).responseText);
            } else {
                clips_json = JSON.parse($.getJSON({
                    'url': "https://twitchapi.teklynk.com/getuserclips.php?channel=" + channelName + "&prefer_featured=" + preferFeatured + "&limit=" + limit + "" + dateRange,
                    'async': false
                }).responseText);
            }

            console.log('Set ' + channelName + ' in localStorage');
            localStorage.setItem(channelName, JSON.stringify(clips_json));
            localStorage.setItem('clips_datetime_' + channelName, currentTime);

        } else {
            // Retrieve the object from storage
            console.log('Pulling ' + channelName + ' from localStorage');
            clips_json = JSON.parse(localStorage.getItem(channelName));
        }

        // Sort array by created_at
        clips_json.data.sort(sortByProperty('created_at'));

        // If gameTitle is set. Filter the clips_json based on game_id
        if (gameTitle) {
            let get_game_id = game_by_title(gameTitle);
            let clips_data = clips_json.data.filter(element => element.game_id === get_game_id.data[0]['id']);
            clips_json = { 'data': clips_data };
        }

        // If no user clips exist, then skip to the next channel
        if (!clips_json.data || typeof clips_json.data === 'undefined' || clips_json.data.length === 0) {
            //console.log('channel: ' + channel);
            //console.log('no clips exist for channel: ' + channel);

            nextClip(true); // skip clip
            return false;
        }

        // Grab a random clip index anywhere from 0 to the clips_json.data.length.
        if (shuffle === 'true') {

            randomClip = Math.floor((Math.random() * clips_json.data.length - 1) + 1);

        } else {

            // Play clips in the order they were created_at
            if (clips_json.data.length === 1 || clips_json.data.length === playCount) {

                playCount = 1;
                randomClip = playCount - 1;

                // If only one channel is being used with the clips player
            } else if (channel.length === 1) {

                playCount++;

                if (playCount >= 1) {
                    randomClip = playCount - 1;
                }

            } else {
                // Default
                randomClip = 0;

            }

        }

        // log output from each clip for debugging
        console.log('Playing clip Channel: ' + clips_json.data[randomClip]['broadcaster_name']);
        console.log('Playing clip index: ' + randomClip);
        console.log('Playing clip ID: ' + clips_json.data[randomClip]['id']);
        console.log('data length: ' + clips_json.data.length)

        // Checks if clip_id in localStorage matches the clip id from the json data.
        // This helps prevent the same clip from playing again when using Random.
        if (clips_json.data.length > 0 && clips_json.data[randomClip]['id'] === localStorage.getItem('clip_id')) {
            console.log('Clip was previously played. Skipping...');
            nextClip(true); // skip clip
            return false;
        }

        // If clip id exists, save it in localStorage
        if (clips_json.data.length > 0 && clips_json.data[randomClip]['id']) {
            localStorage.setItem('clip_id', clips_json.data[randomClip]['id']);
        } else {
            localStorage.setItem('clip_id', '');
        }

        // Create video element and load a new clip

        // adding a poster will help reduce the gap between clips.
        // set &delay=1 in the url if you want an intentional delay/gap between clips.
        if (parseInt(delay) === 0) {
            // higher resolution thumbnail image for poster. Removes -480x272 from thumbnail url.
            poster = clips_json.data[randomClip]['thumbnail_url'].replace('-480x272', '');
            curr_clip.poster = poster;

        }
        curr_clip.src = clips_json.data[randomClip]['clip_url'];
        curr_clip.autoplay = true;
        curr_clip.controls = false;
        curr_clip.volume = 1.0;
        curr_clip.load();

        // Show channel name on top of video
        if (showText === 'true') {
            setTimeout(function () {
                if (customText) {
                    // custom message to show on top of clip. includes {channel} name as a variable
                    customText = getUrlParameter('customText').trim();
                    customText = customText.replace("{channel}", clips_json.data[randomClip]['broadcaster_name']);
                    $("<div id='text-container'><span class='title-text'>" + decodeURIComponent(customText) + "</span></div>").appendTo('#container');
                } else {
                    $("<div id='text-container'><span class='title-text'>" + clips_json.data[randomClip]['broadcaster_name'] + "</span></div>").appendTo('#container');
                }
            }, 500); // wait time
        }

        // Show clip details panel
        if (showDetails === 'true') {
            setTimeout(function () {
                if (detailsText) {

                    if (document.getElementById("details-container")) {
                        document.getElementById("details-container").remove();
                    }

                    // custom clip details text
                    detailsText = getUrlParameter('detailsText').trim();
                    detailsText = detailsText.replace("{channel}", clips_json.data[randomClip]['broadcaster_name']);

                    // Show clip title if it exists
                    if (detailsText.includes("{title}")) {
                        if (clips_json.data[randomClip]['title']) {
                            detailsText = detailsText.replace("{title}", clips_json.data[randomClip]['title']);
                        } else {
                            detailsText = detailsText.replace("{title}", "?");
                        }
                    }

                    // Get game name/title using the game_id from the clip's json data
                    if (detailsText.includes("{game}")) {
                        // Show game title if it exists
                        if (clips_json.data[randomClip]['game_id']) {
                            let game = game_by_id(clips_json.data[randomClip]['game_id']);
                            detailsText = detailsText.replace("{game}", game.data[0]['name']);
                        } else {
                            detailsText = detailsText.replace("{game}", "?");
                        }
                    }

                    // Format created_at date
                    if (detailsText.includes("{created_at}")) {
                        detailsText = detailsText.replace("{created_at}", moment(clips_json.data[randomClip]['created_at']).format("MMMM D, YYYY"));
                    }

                    if (detailsText.includes("{creator_name}")) {
                        detailsText = detailsText.replace("{creator_name}", clips_json.data[randomClip]['creator_name']);
                    }

                    let dText = "";

                    // split on line breaks and create an array
                    let separateLines = detailsText.split(/\r?\n|\r|\n/g);

                    // interate over separateLines array
                    separateLines.forEach(lineBreaks);

                    // generate html for each linebreak/item in array
                    function lineBreaks(item, index) {
                        dText += "<div class='details-text item-" + index + "'>" + item + "</div>";
                    }

                    $("<div id='details-container'>" + dText + "</div>").appendTo('#container');
                }
            }, 700); // wait time
        }

        // Debug
        //console.log('channelName: ' + channelName);
        //console.log('clipNumber: ' + randomClip);
        //console.log(clips_json.data[randomClip]['title']);

        // Move to the next clip when the current one finishes playing
        curr_clip.addEventListener("ended", nextClip);

        // Do a shout-out for each clip
        if (so === 'true' && ref > '') {
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
        if (document.getElementById("details-container")) {
            document.getElementById("details-container").remove();
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
            console.log("Delay: " + parseInt(delay) * 1000 / 2);
            // Adjust the delay in the url, else delay=0
            setTimeout(function () {
                // Play a clip
                loadClip(channel[clip_index]);
                curr_clip.play();
            }, parseInt(delay) * 1000 / 2); // wait time
        }

    }
});