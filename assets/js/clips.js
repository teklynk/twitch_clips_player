$(document).ready(async function () {
    // Get values from URL string
    const urlParams = new URLSearchParams(window.location.search);

    // clear sessionStorage on load. Some clips have a expire time that needs to be refreshed and can not sit in sessionStorage for too long.
    sessionStorage.clear();
    console.log('Cleared sessionStorage');

    // Function to randomly select a api server
    async function setRandomServer() {
        let serverArr = [];

        // Custom server url
        let apiServerUrl = (urlParams.get('apiServer') || '').toLowerCase().trim();

        if (apiServerUrl) {
            serverArr = [apiServerUrl];
        } else {
            serverArr = ["https://twitchapi.teklynk.com", "https://twitchapi.teklynk.dev", "https://twitchapi2.teklynk.dev"];
        }

        // set the api gateway servers 
        const servers = serverArr;

        // Shuffle the servers to try them in random order
        for (let i = servers.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [servers[i], servers[j]] = [servers[j], servers[i]];
        }

        // Check the server status. If it is down, try the next server.
        for (const server of servers) {
            try {
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), 2000);
                await fetch(server, { method: 'HEAD', signal: controller.signal });
                clearTimeout(timeoutId);
                return server;
            } catch (error) {
                console.warn(`Server ${server} is unreachable. Trying next...`);
            }
        }
        return servers[0];
    }

    // Call the function
    const apiServer = await setRandomServer();

    // Array Shuffler
    function shuffleArray(arr) {
        for (let i = arr.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [arr[i], arr[j]] = [arr[j], arr[i]];
        }
    }

    // Get elements and remove elements
    function removeElements() {
        $("#text-container, #details-container").remove();
    }

    // URL values
    let channel = (urlParams.get('channel') || '').toLowerCase().trim();
    let mainAccount = (urlParams.get('mainAccount') || '').toLowerCase().trim();
    let limit = (urlParams.get('limit') || '').trim();
    let dateRange = (urlParams.get('dateRange') || '').trim();
    let preferFeatured = (urlParams.get('preferFeatured') || '').trim();
    let showText = (urlParams.get('showText') || '').trim();
    let showDetails = (urlParams.get('showDetails') || '').trim();
    let ref = (urlParams.get('ref') || '').trim();
    let clientId = (urlParams.get('clientId') || '').trim();
    let customText = (urlParams.get('customText') || '').trim();
    let detailsText = (urlParams.get('detailsText') || '').trim();
    let command = (urlParams.get('command') || '').trim();
    let showFollowing = (urlParams.get('showFollowing') || '').trim();
    let exclude = (urlParams.get('exclude') || '').trim();
    let themeOption = (urlParams.get('themeOption') || '').trim();
    let randomClip = 0; // Default random clip index
    let clip_index = 0; // Default clip index
    let following = "";
    let followCount = 0;
    let playCount = 0;
    let clips_json = "";
    let apiUrl;
    let asyncResponse;
    let chatConnect = (urlParams.get('chatConnect') || '').trim(); // If set to 'false' it will not connect to Twitch chat: &chatConnect=false
    let pendingFetches = {};

    const channel_keywords = ['http', 'https', 'twitch.tv'];

    channel_keywords.forEach(keyword => {
        if (channel.includes(keyword)) {
            console.log(`${channel} is not an expected string. Exiting code...`);
            throw new Error('Exiting code');
        }
        if (mainAccount.includes(keyword)) {
            console.log(`${mainAccount} is not an expected string. Exiting code...`);
            throw new Error('Exiting code');
        }
    });

    if (!chatConnect) {
        chatConnect = "true"; //default
    }

    if (!showDetails) {
        showDetails = "false"; //default
    }

    if (!preferFeatured) {
        preferFeatured = "false"; //default
    }

    if (!showFollowing) {
        showFollowing = "false"; //default
    }

    if (!exclude) {
        exclude = ""; //default
    }

    if (!showText) {
        showText = "false"; //default
    }

    if (!limit || limit === "0") {
        limit = "10"; //default
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

    let client = '';

    // Load theme css file if theme is set
    if (parseInt(themeOption) > 0) {
        $('head').append('<link rel="stylesheet" type="text/css" href="assets/css/theme' + themeOption + '.css">');
    }

    // If Auth token is set, then connect to chat using oauth, else connect anonymously.
    if (mainAccount > '' && ref > '' && chatConnect === 'true') {
        // Connect to twitch - needs auth token
        client = new tmi.Client({
            options: {
                debug: true,
                skipUpdatingEmotesets: true
            },
            connection: {
                reconnect: true,
                maxReconnectAttempts: 3
            },
            identity: {
                username: mainAccount,
                password: 'oauth:' + atob(ref)
            },
            channels: [mainAccount]
        });

        client.connect().catch((err) => {
            console.error(err);
            $("<div class='msg-error'>Login authentication failed. Twitch Access Token may have expired. Please generate a new one.</div>").prependTo('body');
        });

    } else if (mainAccount > '' && ref == '' && chatConnect === 'true') {
        // Connect to twitch anonymously - does not need auth token
        client = new tmi.Client({
            options: {
                debug: true,
                skipUpdatingEmotesets: true
            },
            connection: {
                reconnect: true,
                maxReconnectAttempts: 3
            },
            channels: [mainAccount]
        });

        client.connect().catch((err) => {
            console.error(err);
        });

    } else {
        chatConnect === 'false';
    }

    client.on("maxreconnect", () => {
        $("<div class='msg-error'>Login authentication failed. Failed to connect to Twitch Chat. Please refresh to try again. Twitch Access Token may have expired.</div>").prependTo('body');
    });

    // Get game details function
    async function game_by_id(game_id) {
        const response = await fetch(apiServer + "/getgame.php?id=" + game_id);
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        let jsonParse = await response.json();

        return jsonParse;
    }

    if (showFollowing === 'true' && ref > '' && clientId > '') {

        let followList = localStorage.getItem('twitch_follow_list');

        if (followList) {
            console.log('Pulling followList from localStorage');
        } else {
            async function following_pagination(cursor) {
                let jsonParse;
                let apiUrl;

                if (cursor) {
                    apiUrl = apiServer + "/getuserfollowing.php?channel=" + mainAccount + "&limit=100&ref=" + ref + "&clientId=" + clientId + "&after=" + cursor
                } else {
                    apiUrl = apiServer + "/getuserfollowing.php?channel=" + mainAccount + "&limit=100&ref=" + ref + "&clientId=" + clientId
                }

                try {
                    let response = await fetch(apiUrl);
                    jsonParse = await response.json();

                    if (jsonParse.error && jsonParse.error.includes("401 Unauthorized")) {
                        $("<div class='msg-error'>Twitch Access Token has expired. Please generate a new one.</div>").prependTo('body');
                    }
                } catch (e) {
                    console.error('Error fetching following list:', e);
                    return { data: [], pagination: {} };
                }

                return jsonParse;
            }

            // Globals: following, followCount
            function concatFollowing(jsonData) {
                $.each(jsonData, function (i, val) {
                    following += val['broadcaster_login'] + ",";
                    followCount++;
                });
            }

            // Json following data - page 1
            let following_json = await following_pagination();

            concatFollowing(following_json.data);

            // Start the Following pagination
            while (following_json.pagination['cursor']) {
                following_json = await following_pagination(following_json.pagination['cursor']);
                concatFollowing(following_json.data);
            }

            // Remove the last comma from string
            following = following.replace(/,\s*$/, "");

            // Exclude channels from following
            let channelListArray = following.split(',');

            // Add mainAccount to the list
            if (mainAccount) {
                channelListArray.push(mainAccount);
            }

            let excludeArray = exclude.split(',');
            channelListArray = channelListArray.filter(item => !excludeArray.includes(item));

            // Remove duplicates
            channelListArray = [...new Set(channelListArray)];

            followList = channelListArray.join(',');
            localStorage.setItem('twitch_follow_list', followList);
        }

        // Set channel to equal following list/string
        channel = followList.split(',').map(element => element.trim()).filter(item => item !== "");

    } else {

        // Convert string to an array/list
        channel = channel.split(',').map(element => element.trim()).filter(item => item !== "");
    }

    // Randomly grab a channel from the list to start from
    if (channel.length > 0) {
        // shuffle the list of channel names
        shuffleArray(channel);
        clip_index = 0;
    }

    console.log(channel);

    // Create new video element
    let curr_clip = document.createElement('video');
    $(curr_clip).appendTo('#container');

    //if command is set
    if (command && chatConnect === 'true') {
        // triggers on message
        client.on('chat', async (channel, user, message, self) => {

            if (self || !message.startsWith('!')) return;

            if (user['message-type'] === 'chat' && message.startsWith('!' + command) && (user.mod || user.username === mainAccount)) {

                console.log('Starting clips player using command: !' + command);

                // Remove element before loading the clip
                removeElements();

                // Properly remove video source
                let videoElement = document.querySelector("video");
                videoElement.pause();
                videoElement.removeAttribute("src"); // empty source
                videoElement.load();

                // Get second command. ie: stop
                let commandOption = message.split(' ')[1];

                // Stop the clips player
                if (commandOption === "stop") {
                    // Remove element before loading the clip
                    $('#container').empty();
                    window.location.reload();
                }

                // Plays clips when command is used
                await loadClip(channel[clip_index]);
            }
        });

    } else {
        // Plays clips when scene is active
        if (channel.length > 1 && typeof channel[clip_index + 1] !== 'undefined') {
            preloadNextClip(channel[clip_index + 1]);
        }
        await loadClip(channel[clip_index]);
    }

    // Hard-coded commands to control the current clip. Limited to mods and streamer
    // !clipskip, !clippause, !clipplay
    // Triggers on message
    if (chatConnect === 'true') {
        client.on('chat', async (channel, user, message, self) => {
            const controlCommands = ["!clipskip", "!clippause", "!clipplay", "!clipreload"];
            const receivedCommand = message.toLowerCase().split(' ')[0];

            if (self || !message.startsWith('!')) return;

            if (user['message-type'] === 'chat' && controlCommands.includes(receivedCommand) && (user.mod || user.username === mainAccount)) {
                let videoElement = document.querySelector("video");

                switch (receivedCommand) {
                    case "!clipskip":
                        console.log("Skipping Clip");
                        await nextClip(true); // skip clip
                        break;
                    case "!clippause":
                        console.log("Pausing Clip");
                        if (videoElement) videoElement.pause(); // pause clip
                        break;
                    case "!clipplay":
                        if (videoElement && videoElement.paused) {
                            console.log("Playing Clip");
                            videoElement.play(); // continue playing clip if was paused
                        }
                        break;
                    case "!clipreload":
                        // Remove element before loading the clip
                        $('#container').empty();
                        window.location.reload(); // Reload browser source
                        break;
                    default:
                        console.log(`Unknown command: ${command}`);
                        break;
                }
            }

        });
    }

    async function fetchClipsForChannel(channelName) {
        if (pendingFetches[channelName]) {
            return pendingFetches[channelName];
        }

        const fetchPromise = (async () => {
            let apiUrl;
            let response;
            let data;

            if (preferFeatured !== "false") {
                apiUrl = apiServer + "/getuserclips.php?channel=" + channelName + "&prefer_featured=true&limit=" + limit + "&shuffle=true" + dateRange;
            } else {
                apiUrl = apiServer + "/getuserclips.php?channel=" + channelName + "&prefer_featured=false&limit=" + limit + "&shuffle=true" + dateRange;
            }

            response = await fetch(apiUrl);
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            data = await response.json();

            // If dateRange or preferFeatured is set but no clips are found or only 1 clip is found. Try to pull any clip. 
            if (data.data.length === 0 && (dateRange > "" || preferFeatured !== "false")) {
                response = await fetch(apiServer + "/getuserclips.php?channel=" + channelName + "&limit=" + limit + "&shuffle=true");
                if (!response.ok) {
                    throw new Error('Network response was not ok');
                }
                data = await response.json();
                console.log('No clips found matching dateRange or preferFeatured filter. PULL ANY Clip found from: ' + channelName);
            }

            return data;
        })();

        pendingFetches[channelName] = fetchPromise;

        try {
            return await fetchPromise;
        } finally {
            delete pendingFetches[channelName];
        }
    }

    async function preloadNextClip(channelName) {

        if (sessionStorage.getItem(channelName) === null && typeof channelName !== 'undefined') {
            console.log('Preloading next clip: ' + channelName);

            try {
                let nextClipsData = await fetchClipsForChannel(channelName);

                if (nextClipsData.data.length > 0) {
                    console.log('Set ' + channelName + ' in sessionStorage');
                    // Store the data in localStorage
                    sessionStorage.setItem(channelName, JSON.stringify(nextClipsData));
                }
            } catch (error) {
                console.error('Error while preloading clip:', error);
            }
        }
    }

    // Get and play the clip
    async function loadClip(channelName) {

        // Remove element before loading the clip
        removeElements();

        // Json data - Ajax calls
        // if localstorage does not exist
        if (sessionStorage.getItem(channelName) === null && typeof channelName !== 'undefined') {
            try {
                clips_json = await fetchClipsForChannel(channelName);

                if (clips_json.data.length > 0) {
                    console.log('Set ' + channelName + ' in sessionStorage');
                    sessionStorage.setItem(channelName, JSON.stringify(clips_json));
                } else {
                    await nextClip(true);
                }
            } catch (e) {
                // Sometimes the api returns an error. Usually when a channel no longer exists
                if (e.name === 'TypeError' || e.name === 'SyntaxError') {
                    console.error(e.name + ' found. Skipping...');
                    await nextClip(true);
                    return false;
                }

                if (e.name === 'QuotaExceededError') {
                    console.error('sessionStorage Quota Exceeded. Please free up some space by deleting unnecessary data.');
                    // automatically clear sessionStorage if it exceeds the quota
                    sessionStorage.clear();
                    console.log('Cleared sessionStorage');
                    await nextClip(true);
                    return false;
                } else {
                    console.error('An error occurred:', e);
                }
            }
        } else {
            // Retrieve the object from storage
            console.log('Pulling ' + channelName + ' from sessionStorage');
            clips_json = JSON.parse(sessionStorage.getItem(channelName));
        }

        // Grab a random clip index anywhere from 0 to the clips_json.data.length.
        if (channel.length > 1) {

            console.log('Using random selection logic instead of shuffle');
            randomClip = Math.floor(Math.random() * clips_json.data.length);

        } else {

            // Play clips in the order they were recieved
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
        console.log('Playing clip Index: ' + randomClip);
        console.log('Playing clip Item: ' + clips_json.data[randomClip]['item']);
        console.log('Playing clip ID: ' + clips_json.data[randomClip]['id']);
        console.log('Data length: ' + clips_json.data.length)

        // Create video element and load a new clip
        // adding a poster will help reduce the gap between clips.
        curr_clip.poster = clips_json.data[randomClip]['thumbnail_url'];
        curr_clip.src = clips_json.data[randomClip]['clip_url'];
        curr_clip.autoplay = true;
        curr_clip.controls = false;
        curr_clip.volume = 1.0;
        curr_clip.load();

        // Remove elements before loading the clip and clip details
        removeElements();

        // Show channel name on top of video
        if (showText === 'true') {
            if (customText) {
                // custom message to show on top of clip. includes {channel} name as a variable
                customText = (urlParams.get('customText') || '').trim();
                customText = customText.replace("{channel}", clips_json.data[randomClip]['broadcaster_name']);
                $("<div id='text-container'><span class='title-text'>" + decodeURIComponent(customText) + "</span></div>").appendTo('#container');
            } else {
                $("<div id='text-container'><span class='title-text'>" + clips_json.data[randomClip]['broadcaster_name'] + "</span></div>").appendTo('#container');
            }
        }

        // Show clip details panel
        if (showDetails === 'true') {
            if (detailsText) {

                if (document.getElementById("details-container")) {
                    document.getElementById("details-container").remove();
                }

                // custom clip details text
                detailsText = (urlParams.get('detailsText') || '').trim();
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
                        let game = await game_by_id(clips_json.data[randomClip]['game_id']);
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
        }

        // Move to the next clip when the current one finishes playing
        curr_clip.addEventListener("ended", nextClip);
    }

    async function nextClip(skip = false) {

        // Properly remove video source
        let videoElement = document.querySelector("video");
        videoElement.pause();
        videoElement.removeAttribute("src"); // empty source
        videoElement.load();

        if (clip_index < channel.length - 1) {
            clip_index += 1;
        } else {
            clip_index = 0;
        }

        if (skip === true) {
            // Skips to the next clip if a clip does not exist
            console.log("Skipping clip...");
            await loadClip(channel[clip_index]);
            curr_clip.play();
        } else {
            if (channel.length > 1 && typeof channel[clip_index + 1] !== 'undefined') {
                preloadNextClip(channel[clip_index + 1]);
            }
            // Play a clip
            await loadClip(channel[clip_index]);
            curr_clip.play();
        }
    }
});